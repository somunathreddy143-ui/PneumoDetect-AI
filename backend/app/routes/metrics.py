"""Metrics route: GET /metrics."""

from __future__ import annotations

import base64
import json
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.schemas.prediction import MetricsResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Metrics"])


def _load_image_as_base64(path: Path) -> str | None:
    """Read an image file and return its base64-encoded contents, or None."""
    if path.is_file():
        try:
            return base64.b64encode(path.read_bytes()).decode("utf-8")
        except Exception:
            logger.warning("Failed to read image %s", path, exc_info=True)
    return None


@router.get(
    "/metrics",
    response_model=MetricsResponse,
    summary="Return model evaluation metrics and plots",
)
async def get_metrics() -> MetricsResponse:
    """Load metrics.json and (optionally) confusion-matrix / ROC-curve images."""
    metrics_path = Path(settings.METRICS_PATH)

    if not metrics_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metrics file not found at {metrics_path}. Run model evaluation first.",
        )

    try:
        with open(metrics_path, "r", encoding="utf-8") as fh:
            metrics_data = json.load(fh)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Metrics file is not valid JSON: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read metrics file: {exc}",
        ) from exc

    # Look for plot images in the same directory as metrics.json
    eval_dir = metrics_path.parent
    cm_b64 = _load_image_as_base64(eval_dir / "confusion_matrix.png")
    roc_b64 = _load_image_as_base64(eval_dir / "roc_curve.png")

    return MetricsResponse(
        metrics=metrics_data,
        confusion_matrix_image=cm_b64,
        roc_curve_image=roc_b64,
    )
