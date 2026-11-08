# Authentication & Authorization Architecture Guide

## 1. Overview
The PneumoDetect AI platform implements enterprise-grade authentication and authorization designed to safeguard clinical radiograph records and ensure strict row-level user data isolation.

## 2. Authentication Standards & Cryptography

### 2.1 Password Hashing
- **Algorithm**: `bcrypt` with adaptive salt rounds ($2^{12} = 4096$ iterations).
- **Security**: Resists GPU/ASIC rainbow table attacks; plaintext passwords are never logged, transmitted in responses, or stored in plaintext.

### 2.2 JWT Access Tokens
- **Standard**: RFC 7518 JSON Web Signature (JWS) with HMAC-SHA256 (`HS256`).
- **Secret Key**: Minimum 256-bit cryptographically random key (`JWT_SECRET`).
- **Lifespan**: 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- **Payload Structure**:
  ```json
  {
    "sub": "1",
    "email": "dr.jane@hospital.org",
    "exp": 1794162315,
    "iat": 1794158715,
    "type": "access"
  }
  ```

### 2.3 Refresh Tokens & Rotation
- **Generation**: `secrets.token_urlsafe(48)` (288 bits of cryptographic entropy).
- **Storage**: Tokens are hashed using SHA-256 before insertion into the `refresh_sessions` table.
- **Rotation**: Every call to `POST /api/auth/refresh` immediately revokes the existing refresh token and issues a new refresh token + access token pair.
- **Revocation**: Logging out instantly marks the session as `revoked_at = utcnow()`.

### 2.4 Password Reset Recovery
- **Workflow**:
  1. User submits registered email to `POST /api/auth/forgot-password`.
  2. System returns generic confirmation to prevent user account enumeration.
  3. Single-use token generated with 1-hour expiration.
  4. User provides token and new password to `POST /api/auth/reset-password`.
  5. Upon reset, all active refresh sessions for that user are revoked.

## 3. Row-Level Data Isolation Policy
All patient prediction records (`prediction_history`) have a foreign key `user_id`. Every CRUD operation strictly filters:
```python
PredictionHistory.user_id == current_user.id
```
Any attempt by a user to access, download a PDF, or delete a scan belonging to another user results in an immediate `404 Not Found` response.

