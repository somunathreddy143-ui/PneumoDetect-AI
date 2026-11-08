"""Authentication and cryptography service."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import os
import secrets
from typing import Optional

import bcrypt
import jwt
from sqlalchemy.orm import Session

from app.models.user import PasswordResetToken, RefreshSession, User

# Secret key: minimum 32 bytes for RFC 7518 compliance
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-healthcare-ai-key-min-32-bytes-long!")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7
REMEMBER_ME_REFRESH_DAYS = 30
RESET_TOKEN_EXPIRE_HOURS = 1


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt with a secure salt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def hash_token(token: str) -> str:
    """Hash a token using SHA-256 for secure database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(user_id: int, email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a signed JWT access token."""
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.PyJWTError:
        return None


def create_refresh_token(
    db: Session,
    user_id: int,
    remember_me: bool = False,
) -> str:
    """Generate a cryptographically secure refresh token, store its hash, and return the raw token."""
    raw_token = secrets.token_urlsafe(48)
    token_h = hash_token(raw_token)
    days = REMEMBER_ME_REFRESH_DAYS if remember_me else REFRESH_TOKEN_EXPIRE_DAYS
    expires_at = datetime.now(timezone.utc) + timedelta(days=days)

    session = RefreshSession(
        user_id=user_id,
        token_hash=token_h,
        expires_at=expires_at,
        created_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    return raw_token


def rotate_refresh_token(db: Session, raw_token: str) -> Optional[tuple[User, str]]:
    """Validate refresh token, revoke it, issue a new one, and return (User, new_raw_token)."""
    token_h = hash_token(raw_token)
    session = (
        db.query(RefreshSession)
        .filter(RefreshSession.token_hash == token_h)
        .first()
    )

    if not session:
        return None

    # Check if already revoked or expired
    now = datetime.now(timezone.utc)
    # Handle timezone naive vs aware comparison if sqlite strips tz
    exp = session.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    if session.revoked_at is not None or exp < now:
        return None

    # Revoke current session (token rotation)
    session.revoked_at = now
    db.add(session)

    user = db.query(User).filter(User.id == session.user_id).first()
    if not user or not user.is_active:
        db.commit()
        return None

    # Issue new refresh token
    new_raw = secrets.token_urlsafe(48)
    new_token_h = hash_token(new_raw)
    new_session = RefreshSession(
        user_id=user.id,
        token_hash=new_token_h,
        expires_at=now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        created_at=now,
    )
    db.add(new_session)
    db.commit()
    return user, new_raw


def revoke_refresh_token(db: Session, raw_token: str) -> bool:
    """Revoke a refresh token (logout)."""
    token_h = hash_token(raw_token)
    session = (
        db.query(RefreshSession)
        .filter(RefreshSession.token_hash == token_h)
        .first()
    )
    if session and session.revoked_at is None:
        session.revoked_at = datetime.now(timezone.utc)
        db.add(session)
        db.commit()
        return True
    return False


def create_password_reset_token(db: Session, user: User) -> str:
    """Generate a single-use password reset token valid for 1 hour."""
    raw_token = secrets.token_urlsafe(32)
    token_h = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_EXPIRE_HOURS)

    # Invalidate existing unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({"used_at": datetime.now(timezone.utc)})

    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_h,
        expires_at=expires_at,
        created_at=datetime.now(timezone.utc),
    )
    db.add(reset_token)
    db.commit()
    return raw_token


def verify_and_use_reset_token(db: Session, raw_token: str, new_password: str) -> bool:
    """Validate a password reset token and update user's password."""
    token_h = hash_token(raw_token)
    record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_h)
        .first()
    )

    if not record or record.used_at is not None:
        return False

    now = datetime.now(timezone.utc)
    exp = record.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    if exp < now:
        return False

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        return False

    # Update password and mark token as used
    user.password_hash = hash_password(new_password)
    user.updated_at = now
    record.used_at = now
    db.add(user)
    db.add(record)

    # Invalidate all active sessions for this user on password reset
    db.query(RefreshSession).filter(
        RefreshSession.user_id == user.id,
        RefreshSession.revoked_at.is_(None),
    ).update({"revoked_at": now})

    db.commit()
    return True

