"""Service for logging and retrieving user-specific activity audit events."""

from __future__ import annotations

import logging
from typing import Optional
from fastapi import Request
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.activity import UserActivity

logger = logging.getLogger(__name__)


def get_client_ip(request: Optional[Request]) -> str:
    """Extract client IP address safely from request headers."""
    if not request:
        return "127.0.0.1"
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def log_user_activity(
    db: Session,
    user_id: int,
    action: str,
    description: str,
    request: Optional[Request] = None,
) -> UserActivity:
    """Record an audit trail event for a specific user."""
    ip = get_client_ip(request)
    ua = request.headers.get("User-Agent", "Unknown") if request else "Unknown"

    activity = UserActivity(
        user_id=user_id,
        action=action,
        description=description,
        ip_address=ip[:60],
        user_agent=ua[:255],
    )
    db.add(activity)
    try:
        db.commit()
        db.refresh(activity)
    except Exception as exc:
        logger.warning("Failed to commit user activity log: %s", exc)
        db.rollback()
    return activity


def get_user_activities(
    db: Session,
    user_id: int,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[UserActivity], int]:
    """Retrieve chronologically ordered activity logs strictly isolated for the user."""
    q = db.query(UserActivity).filter(UserActivity.user_id == user_id)
    total = q.count()
    items = q.order_by(desc(UserActivity.created_at)).offset((page - 1) * per_page).limit(per_page).all()
    return items, total

