"""Database configuration and session management using SQLAlchemy."""

from __future__ import annotations

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Locate database file in backend/data/app.db
_THIS_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _THIS_DIR.parent
DATA_DIR = _BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

STORAGE_DIR = DATA_DIR / "storage"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
(STORAGE_DIR / "images").mkdir(parents=True, exist_ok=True)
(STORAGE_DIR / "heatmaps").mkdir(parents=True, exist_ok=True)
(STORAGE_DIR / "overlays").mkdir(parents=True, exist_ok=True)
(STORAGE_DIR / "reports").mkdir(parents=True, exist_ok=True)

# Default to SQLite for local development; can be overridden via DATABASE_URL
DEFAULT_SQLITE_PATH = DATA_DIR / "pneumonia_detection.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides an active SQLAlchemy database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

