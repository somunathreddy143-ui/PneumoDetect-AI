"""Image helper utilities: validation, loading, preprocessing, encoding."""

from __future__ import annotations

import base64
import io
from pathlib import Path
from typing import Union

import numpy as np
from fastapi import HTTPException, UploadFile, status
from PIL import Image

from app.config import settings


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_image(content: bytes, filename: str = ""):
    """Validate image bytes and filename extension.
    
    Checks:
      - File has a recognized extension (.jpg, .jpeg, .png).
      - File size does not exceed MAX_FILE_SIZE.
      - File is not empty.
    """
    if filename:
        ext = Path(filename).suffix.lower()
        if ext and ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid file type '{ext}'. "
                    f"Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
                ),
            )

    if len(content) > settings.MAX_FILE_SIZE:
        size_mb = settings.MAX_FILE_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the maximum allowed size of {size_mb:.0f} MB.",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )


# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

def load_image(file_bytes: bytes) -> np.ndarray:
    """Read raw image bytes and return a uint8 RGB numpy array."""
    try:
        pil_img = Image.open(io.BytesIO(file_bytes))
        pil_img = pil_img.convert("RGB")
        arr = np.array(pil_img, dtype=np.uint8)
        if arr.size == 0 or len(arr.shape) != 3:
            raise ValueError("Decoded image is empty or has invalid channel structure.")
        return arr
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupted or unreadable image file: {exc}",
        ) from exc


# ---------------------------------------------------------------------------
# Radiograph Suitability & Quality Assessment
# ---------------------------------------------------------------------------

def assess_image_suitability(image_array: np.ndarray, filename: str = "") -> dict:
    """Evaluate image properties against chest radiograph clinical criteria.

    Checks:
      - Spatial resolution (min 64x64, max 5000x5000)
      - Aspect ratio (between 0.45 and 2.2)
      - Color channel divergence (radiographs are predominantly grayscale / monochrome)
      - Contrast standard deviation (reject washed out / blank images)
      - Shannon entropy (measure of structural anatomical information density)

    Returns:
      Dictionary with validation status, quality score, reliability level, and notes.
    """
    height, width, channels = image_array.shape
    issues: list[str] = []
    checks: list[str] = []

    # 1. Dimension checks
    if height < 64 or width < 64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image resolution too low ({width}x{height}). Minimum required is 64x64 pixels.",
        )
    if height > 5000 or width > 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image resolution exceeds maximum supported limit of 5000x5000 ({width}x{height}).",
        )
    checks.append(f"Resolution: {width}x{height} px")

    # 2. Aspect ratio check
    aspect_ratio = width / height
    if aspect_ratio < 0.40 or aspect_ratio > 2.50:
        issues.append(f"Unusual aspect ratio ({aspect_ratio:.2f}:1). Standard chest radiographs are near square (0.7-1.4).")
    else:
        checks.append(f"Aspect ratio valid ({aspect_ratio:.2f}:1)")

    # 3. Grayscale / Monochrome verification (Radiograph characteristic)
    # Channel divergence: standard deviation across RGB channels at each pixel
    channel_dev = float(np.mean(np.std(image_array.astype(np.float32), axis=2)))
    if channel_dev > 32.0:
        # High saturation indicates a non-radiographic colorful photo or graphic
        issues.append("Image exhibits strong chromatic saturation; standard chest X-rays are monochrome or grayscale.")
    else:
        checks.append("Monochrome distribution consistent with medical radiography.")

    # 4. Contrast & dynamic range
    contrast_std = float(np.std(image_array))
    if contrast_std < 10.0:
        issues.append("Extremely low contrast dynamic range (image appears blank, solid, or severely underexposed).")
    else:
        checks.append(f"Contrast dynamic range adequate (std: {contrast_std:.1f})")

    # 5. Shannon entropy (information content)
    # Convert to grayscale luminance
    gray = (0.299 * image_array[:, :, 0] + 0.587 * image_array[:, :, 1] + 0.114 * image_array[:, :, 2]).astype(np.uint8)
    hist, _ = np.histogram(gray, bins=256, range=(0, 256), density=True)
    hist = hist[hist > 0]
    entropy = float(-np.sum(hist * np.log2(hist)))

    if entropy < 2.5:
        issues.append(f"Low structural information entropy ({entropy:.2f} bits). Radiograph lacks distinct anatomical landmarks.")
    else:
        checks.append(f"Information entropy healthy ({entropy:.2f} bits)")

    # Quality score computation (0.0 to 1.0)
    score = 1.0
    if channel_dev > 32.0:
        score -= 0.35
    elif channel_dev > 15.0:
        score -= 0.15

    if aspect_ratio < 0.40 or aspect_ratio > 2.50:
        score -= 0.20

    if contrast_std < 15.0:
        score -= 0.30
    elif contrast_std < 25.0:
        score -= 0.10

    if entropy < 3.0:
        score -= 0.25

    score = max(0.10, min(1.0, score))

    # Determine status
    if len(issues) == 0 and score >= 0.80:
        status_str = "PASSED"
        reliability = "HIGH"
        is_inconclusive = False
    elif score >= 0.50:
        status_str = "WARNING"
        reliability = "MODERATE"
        is_inconclusive = False
    else:
        status_str = "INCONCLUSIVE"
        reliability = "LOW / INCONCLUSIVE"
        is_inconclusive = True

    return {
        "is_valid": status_str != "INCONCLUSIVE",
        "quality_score": round(score, 2),
        "status": status_str,
        "reliability_level": reliability,
        "is_inconclusive": is_inconclusive,
        "aspect_ratio": round(aspect_ratio, 2),
        "channel_divergence": round(channel_dev, 2),
        "entropy": round(entropy, 2),
        "checks": checks,
        "issues": issues,
    }


def compute_uncertainty(confidence: float) -> tuple[float, str, bool]:
    """Calculate normalized Shannon entropy uncertainty for binary classification.

    Parameters
    ----------
    confidence : float
        Prediction confidence score (0.5 to 1.0).

    Returns
    -------
    uncertainty_score : float
        0.0 (high certainty) to 1.0 (maximal uncertainty at 50/50).
    reliability_tier : str
        'HIGH', 'MODERATE', or 'LOW / INCONCLUSIVE'.
    is_inconclusive : bool
        True if uncertainty exceeds 0.70 (borderline decision boundary).
    """
    p = max(1e-6, min(1.0 - 1e-6, confidence))
    # Normalized binary entropy
    h = -(p * np.log2(p) + (1.0 - p) * np.log2(1.0 - p))
    uncertainty = round(float(np.clip(h, 0.0, 1.0)), 3)

    if uncertainty > 0.70:
        return uncertainty, "LOW / INCONCLUSIVE", True
    if uncertainty > 0.35:
        return uncertainty, "MODERATE", False
    return uncertainty, "HIGH", False


# ---------------------------------------------------------------------------
# Preprocessing for MobileNetV2
# ---------------------------------------------------------------------------

def preprocess_for_model(
    image_array: np.ndarray,
    target_size: tuple[int, int] = (settings.IMAGE_SIZE, settings.IMAGE_SIZE),
) -> np.ndarray:
    """Resize to 224x224, apply MobileNetV2 preprocess_input, add batch dimension."""
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

    pil_img = Image.fromarray(image_array)
    pil_resized = pil_img.resize(target_size, Image.Resampling.BILINEAR)
    arr = np.array(pil_resized, dtype=np.float32)

    # Scale to [-1, 1] range via MobileNetV2 preprocessing
    arr = preprocess_input(arr)

    # Shape: (1, 224, 224, 3)
    return np.expand_dims(arr, axis=0)


# ---------------------------------------------------------------------------
# Base64 encoding
# ---------------------------------------------------------------------------

def numpy_to_base64(image_array: np.ndarray, fmt: str = "PNG") -> str:
    """Encode an RGB numpy array to a base64 string."""
    img = Image.fromarray(image_array.astype(np.uint8))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode("utf-8")
