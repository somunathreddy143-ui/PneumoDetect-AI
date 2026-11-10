"""FastAPI application entry point for the Pneumonia Detection API."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models import init_db
from app.routes import auth, grok, health, metrics, prediction, system
from app.services.ml_service import ml_service

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan – database init and ML model loading on startup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and load the ML model when the server starts."""
    logger.info("Starting Pneumonia Detection API with Auth & Healthcare Features …")
    
    # 1. Initialize SQLite / PostgreSQL Database tables
    try:
        init_db()
        logger.info("Database tables initialized successfully.")
    except Exception:
        logger.exception("Database initialization failed")

    # 2. Load ML Model
    try:
        ml_service.load_model(settings.MODEL_PATH)
        logger.info("ML model loaded successfully from %s", settings.MODEL_PATH)
    except FileNotFoundError:
        logger.warning(
            "Model file not found at %s – the /predict endpoint will return 503 "
            "until a model is available.",
            settings.MODEL_PATH,
        )
    except Exception:
        logger.exception("Failed to load ML model")

    yield  # application is running

    logger.info("Shutting down Pneumonia Detection API.")


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Pneumonia Detection & Explainable AI Research API",
    description=(
        "Explainable AI-based pneumonia detection from chest X-ray images. "
        "Includes User Authentication, MobileNetV2 transfer learning, "
        "Grad-CAM visual explanations, PDF reports, and telemetry."
    ),
    version="2.5.0",
    lifespan=lifespan,
)

# -- CORS – allow the production Vercel frontend and localhost for development --
_cors_origins = [
    "https://pneumo-detect-ai.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Also honour an env-var override for additional origins (comma-separated)
import os as _os
_extra = _os.environ.get("CORS_ORIGINS", "")
if _extra:
    _cors_origins.extend([o.strip() for o in _extra.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -- Routers --
app.include_router(auth.router)
app.include_router(prediction.router)
app.include_router(grok.router)
app.include_router(system.router)
app.include_router(health.router)
app.include_router(metrics.router)


# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------

@app.get("/", tags=["Root"])
async def root():
    """Return basic API information."""
    return {
        "name": "Pneumonia Detection & Explainable AI Platform API",
        "version": "2.5.0",
        "status": "operational",
        "endpoints": {
            "auth": "/api/auth",
            "predict": "/api/predict",
            "batch_predict": "/api/predict/batch",
            "history": "/api/history",
            "reports": "/api/reports/{id}/pdf",
            "system_health": "/api/system/health",
            "metrics": "/metrics",
            "docs": "/docs",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
