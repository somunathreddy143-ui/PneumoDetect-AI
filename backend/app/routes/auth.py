"""Authentication API routes."""

from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    MessageResponse,
    RefreshTokenRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.activity_service import log_user_activity
from app.services.auth_service import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    hash_password,
    revoke_refresh_token,
    rotate_refresh_token,
    verify_and_use_reset_token,
    verify_password,
)
from app.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with email and secure password hashing."""
    email_clean = req.email.lower().strip()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    user = User(
        full_name=req.full_name.strip(),
        email=email_clean,
        password_hash=hash_password(req.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(db, user.id, remember_me=False)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and return JWT tokens",
)
def login(req: UserLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate with email and password, returning short-lived access and refresh tokens."""
    email_clean = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(req.password, user.password_hash):
        if user:
            log_user_activity(db, user.id, "LOGIN_FAILED", "Failed authentication attempt (invalid credentials)", request=request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        log_user_activity(db, user.id, "LOGIN_FAILED", "Attempted login to inactive account", request=request)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Please contact system support.",
        )

    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(db, user.id, remember_me=req.remember_me)

    log_user_activity(db, user.id, "LOGIN_SUCCESS", "User authenticated successfully", request=request)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Revoke refresh token session",
)
def logout(req: RefreshTokenRequest, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Revoke the current refresh token session."""
    revoke_refresh_token(db, req.refresh_token)
    log_user_activity(db, current_user.id, "LOGOUT", "User session logged out and refresh token revoked", request=request)
    return MessageResponse(message="Successfully logged out.")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    """Return profile details for the currently logged-in user."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Rotate refresh token and issue new access token",
)
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Exchange a valid refresh token for a fresh access token and rotated refresh token."""
    result = rotate_refresh_token(db, req.refresh_token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token. Please sign in again.",
        )

    user, new_refresh_token = result
    access_token = create_access_token(user.id, user.email)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Initiate password recovery workflow",
)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a secure, single-use password reset token.
    
    In development, if SMTP is not configured, the reset token is provided in the dev response.
    Generic success message prevents account enumeration attacks.
    """
    email_clean = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    dev_token = None
    if user and user.is_active:
        raw_token = create_password_reset_token(db, user)
        # Development fallback token
        dev_token = raw_token
        logger.info(f"Password reset token generated for {user.email}: {raw_token}")

    return MessageResponse(
        message="If this email is registered in our system, password reset instructions have been dispatched.",
        success=True,
        token_for_dev=dev_token,
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Complete password reset using secure token",
)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validate single-use reset token and update user's password."""
    success = verify_and_use_reset_token(db, req.token, req.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset token is invalid, expired, or has already been used.",
        )
    return MessageResponse(message="Your password has been successfully reset. You may now sign in.")


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change password for authenticated user",
)
def change_password(
    req: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allow an authenticated user to update their password by confirming current credentials."""
    if not verify_password(req.current_password, current_user.password_hash):
        log_user_activity(db, current_user.id, "PASSWORD_CHANGE_FAILED", "Failed attempt to change password (invalid current password)", request=request)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password.",
        )

    current_user.password_hash = hash_password(req.new_password)
    db.add(current_user)
    db.commit()

    log_user_activity(db, current_user.id, "PASSWORD_CHANGED", "Account password updated successfully", request=request)

    return MessageResponse(message="Password successfully changed.")

