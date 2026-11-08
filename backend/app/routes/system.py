"""System health monitoring routes."""

from __future__ import annotations

from datetime import datetime, timezone
import time
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.prediction import SystemHealthResponse
from app.services.ml_service import ml_service

router = APIRouter(prefix="/api/system", tags=["System Health"])


@router.get(
    "/health",
    response_model=SystemHealthResponse,
    summary="Comprehensive system health and service telemetry",
)
def get_system_health(db: Session = Depends(get_db)):
    """Check database connectivity, model status, and benchmark API response latency."""
    start_t = time.perf_counter()

    # Check DB connectivity
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass

    latency_ms = round((time.perf_counter() - start_t) * 1000, 2)

    status_str = "healthy" if (db_ok and ml_service.is_loaded) else "degraded"

    return SystemHealthResponse(
        status=status_str,
        database_connected=db_ok,
        model_loaded=ml_service.is_loaded,
        model_name="MobileNetV2 (ImageNet Transfer)",
        model_version="2.1.0-alpha",
        app_version="2.5.0-Healthcare-XAI",
        api_latency_ms=latency_ms,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

