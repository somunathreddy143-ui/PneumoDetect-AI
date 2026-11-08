"""Health and sample-image routes."""

from __future__ import annotations

import base64
import logging
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, status

from app.config import settings
from app.schemas.prediction import (
    HealthResponse,
    SampleImage,
    SampleImagesResponse,
)
from app.services.ml_service import ml_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
)
async def health_check() -> HealthResponse:
    """Return the current service health including model-loaded status."""
    return HealthResponse(
        status="ok",
        model_loaded=ml_service.is_loaded,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


# ---------------------------------------------------------------------------
# GET /sample-images
# ---------------------------------------------------------------------------

@router.get(
    "/sample-images",
    response_model=SampleImagesResponse,
    summary="List base64-encoded sample images",
)
async def list_sample_images() -> SampleImagesResponse:
    """Return every image found in the configured samples directory."""
    samples_dir = Path(settings.SAMPLES_DIR)
    images: list[SampleImage] = []

    if samples_dir.is_dir():
        for fpath in sorted(samples_dir.iterdir()):
            if fpath.suffix.lower() in settings.ALLOWED_EXTENSIONS:
                try:
                    raw = fpath.read_bytes()
                    b64 = base64.b64encode(raw).decode("utf-8")
                    images.append(SampleImage(filename=fpath.name, image=b64))
                except Exception:
                    logger.warning("Could not read sample image %s", fpath, exc_info=True)

    return SampleImagesResponse(total=len(images), images=images)
