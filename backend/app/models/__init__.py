"""Export all SQLAlchemy models."""

from sqlalchemy import inspect, text

from app.database import Base, engine
from app.models.activity import UserActivity
from app.models.prediction import PredictionHistory
from app.models.user import PasswordResetToken, RefreshSession, User

__all__ = [
    "Base",
    "engine",
    "User",
    "RefreshSession",
    "PasswordResetToken",
    "PredictionHistory",
    "UserActivity",
]


def init_db():
    """Create all database tables if they do not exist and ensure schema migration."""
    Base.metadata.create_all(bind=engine)

    # SQLite migration helper to add new columns if upgrading existing DB
    inspector = inspect(engine)
    if "prediction_history" in inspector.get_table_names():
        existing_cols = {col["name"] for col in inspector.get_columns("prediction_history")}
        new_cols = {
            "model_name": "VARCHAR(100) DEFAULT 'MobileNetV2'",
            "model_version": "VARCHAR(50) DEFAULT '2.1.0-alpha'",
            "uncertainty_score": "FLOAT DEFAULT 0.0",
            "validation_status": "VARCHAR(50) DEFAULT 'PASSED'",
            "reliability_level": "VARCHAR(50) DEFAULT 'HIGH'",
            "is_inconclusive": "BOOLEAN DEFAULT 0",
        }
        with engine.begin() as conn:
            for col_name, col_type in new_cols.items():
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE prediction_history ADD COLUMN {col_name} {col_type}"))

