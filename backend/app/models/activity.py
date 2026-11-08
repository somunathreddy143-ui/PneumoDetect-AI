"""User Activity model for audit trails and research timeline."""

from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(60), nullable=False, index=True)
    # e.g., LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, XRAY_UPLOAD, PREDICTION_GENERATED,
    # REPORT_GENERATED, REPORT_DOWNLOADED, PASSWORD_CHANGED, PROFILE_UPDATED
    description = Column(Text, nullable=False)
    ip_address = Column(String(60), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="activities")

