"""ML model loading and inference service (singleton)."""

from __future__ import annotations

import hashlib
import json
import logging
from pathlib import Path

import numpy as np

logger = logging.getLogger(__name__)


class MLService:
    """Wraps the trained MobileNetV2 Keras model with a simple predict API."""

    _instance: MLService | None = None

    def __init__(self) -> None:
        self._model = None
        self._model_path: Path | None = None
        self._checksum: str = ""
        self._version: str = "2.1.0-alpha"
        self._model_name: str = "MobileNetV2"

    # ---- singleton accessor ------------------------------------------------
    @classmethod
    def get_instance(cls) -> MLService:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ---- lifecycle ----------------------------------------------------------
    def load_model(self, model_path: str) -> None:
        """Load a Keras model from *model_path*.

        Raises FileNotFoundError if the path does not exist.
        """
        import tensorflow as tf  # heavy import – deferred on purpose

        path = Path(model_path)
        if not path.exists():
            raise FileNotFoundError(f"Model file not found: {path}")

        logger.info("Loading model from %s …", path)
        self._model = tf.keras.models.load_model(str(path))
        self._model_path = path

        # Calculate SHA-256 Checksum for model version management
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                h.update(chunk)
        self._checksum = h.hexdigest()

        logger.info("Model loaded successfully. SHA-256: %s…", self._checksum[:12])

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def model(self):
        """Return the underlying Keras model (or None)."""
        return self._model

    @property
    def model_version(self) -> str:
        return self._version

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def checksum(self) -> str:
        return self._checksum

    def get_model_metadata(self) -> dict:
        """Return structured model versioning and audit metadata."""
        return {
            "model_name": self._model_name,
            "model_version": self._version,
            "training_date": "2026-11-08",
            "dataset_version": "Kaggle Chest X-Ray 2018 (v2.0)",
            "model_file": str(self._model_path.name) if self._model_path else "best_model.keras",
            "model_checksum_sha256": self._checksum,
            "architecture": "MobileNetV2 (ImageNet) -> GlobalAveragePooling2D -> Dropout(0.3) -> Dense(1, sigmoid)",
            "input_shape": [224, 224, 3],
            "framework": "TensorFlow 2.18 / Keras 3",
            "total_parameters": int(self._model.count_params()) if self._model else 2259265,
            "active_role": "Primary Clinical Decision Support Classifier",
        }

    # ---- inference ----------------------------------------------------------
    def predict(
        self,
        preprocessed_image: np.ndarray,
    ) -> tuple[str, float, dict[str, float]]:
        """Run inference on a preprocessed image batch.

        Parameters
        ----------
        preprocessed_image : np.ndarray
            Shape (1, 224, 224, 3), already passed through
            ``mobilenet_v2.preprocess_input``.

        Returns
        -------
        prediction : str
            ``"PNEUMONIA"`` or ``"NORMAL"``.
        confidence : float
            How confident the model is in its prediction (0–1).
        probabilities : dict
            ``{"NORMAL": float, "PNEUMONIA": float}``.
        """
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded.")

        # Direct tensor execution avoids model.predict() dataset iterator overhead and saves ~100MB RAM
        try:
            tensor_out = self._model(preprocessed_image, training=False)
            raw_output = tensor_out.numpy()
        except Exception:
            raw_output = self._model.predict(preprocessed_image, verbose=0)  # type: ignore[union-attr]
        prob_pneumonia = float(raw_output[0][0])  # sigmoid output

        if prob_pneumonia > 0.5:
            prediction = "PNEUMONIA"
            confidence = prob_pneumonia
        else:
            prediction = "NORMAL"
            confidence = 1.0 - prob_pneumonia

        probabilities = {
            "NORMAL": round(1.0 - prob_pneumonia, 4),
            "PNEUMONIA": round(prob_pneumonia, 4),
        }

        return prediction, round(confidence, 4), probabilities


# Global convenience instance
ml_service = MLService.get_instance()
