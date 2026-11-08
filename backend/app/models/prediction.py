"""Prediction History SQLAlchemy model."""

from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PredictionHistory(Base):
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    prediction = Column(String(50), nullable=False)  # NORMAL or PNEUMONIA
    confidence = Column(Float, nullable=False)
    normal_probability = Column(Float, nullable=False)
    pneumonia_probability = Column(Float, nullable=False)
    image_path = Column(String(500), nullable=True)
    heatmap_path = Column(String(500), nullable=True)
    overlay_path = Column(String(500), nullable=True)
    explanation = Column(Text, nullable=True)
    processing_time = Column(Float, nullable=False)
    model_name = Column(String(100), default="MobileNetV2", nullable=False)
    model_version = Column(String(50), default="2.1.0-alpha", nullable=False)
    uncertainty_score = Column(Float, default=0.0, nullable=False)
    validation_status = Column(String(50), default="PASSED", nullable=False)
    reliability_level = Column(String(50), default="HIGH", nullable=False)
    is_inconclusive = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="predictions")

