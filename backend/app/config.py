"""Application configuration using pydantic-settings."""

import os
from pathlib import Path

from pydantic_settings import BaseSettings


# Resolve the project root (AI/) from backend/app/config.py
_THIS_DIR = Path(__file__).resolve().parent          # backend/app/
_BACKEND_DIR = _THIS_DIR.parent                      # backend/
_PROJECT_ROOT = _BACKEND_DIR.parent                  # AI/


class Settings(BaseSettings):
    """Central configuration loaded from environment variables with sensible defaults."""

    # --- Paths (resolved relative to project root) ---
    MODEL_PATH: str = str(_PROJECT_ROOT / "ml" / "saved_models" / "best_model.keras")
    METRICS_PATH: str = str(_PROJECT_ROOT / "results" / "evaluation" / "metrics.json")
    SAMPLES_DIR: str = str(_BACKEND_DIR / "data" / "samples")

    # --- Upload constraints ---
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_EXTENSIONS: list[str] = [".jpg", ".jpeg", ".png"]

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False

    # --- Image preprocessing ---
    IMAGE_SIZE: int = 224   # MobileNetV2 expected input size

    # --- xAI Grok LLM API ---
    XAI_API_KEY: str = ""
    XAI_BASE_URL: str = "https://api.x.ai/v1"
    XAI_MODEL: str = "grok-2-latest"

    # --- Google reCAPTCHA v2 ---
    RECAPTCHA_SECRET_KEY: str = ""
    RECAPTCHA_SITE_KEY: str = "6Ldk-hYuAAAAAO35F0uypYiXqXhpUWJp4nGK_Zst"
    RECAPTCHA_VERIFY_URL: str = "https://www.google.com/recaptcha/api/siteverify"

    model_config = {
        "env_file": str(_BACKEND_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# Singleton settings instance
settings = Settings()
