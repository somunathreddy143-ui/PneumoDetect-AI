# Relational Database Schema Documentation

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ REFRESH_SESSIONS : "owns"
    USERS ||--o{ PASSWORD_RESET_TOKENS : "requests"
    USERS ||--o{ PREDICTION_HISTORY : "evaluates"

    USERS {
        int id PK "Auto Increment"
        string full_name "User's full name"
        string email "Unique Email (Indexed)"
        string password_hash "Bcrypt Hash"
        boolean is_active "Account status"
        datetime created_at "Registration Timestamp"
        datetime updated_at "Last Profile Update"
    }

    REFRESH_SESSIONS {
        int id PK "Auto Increment"
        int user_id FK "References users.id"
        string token_hash "SHA-256 Hash of Token (Unique, Indexed)"
        datetime expires_at "Expiration Timestamp"
        datetime revoked_at "Revocation Timestamp (Nullable)"
        datetime created_at "Session Created Timestamp"
    }

    PASSWORD_RESET_TOKENS {
        int id PK "Auto Increment"
        int user_id FK "References users.id"
        string token_hash "SHA-256 Hash (Unique, Indexed)"
        datetime expires_at "1-Hour Expiration"
        datetime used_at "Consumed Timestamp (Nullable)"
        datetime created_at "Token Created Timestamp"
    }

    PREDICTION_HISTORY {
        int id PK "Auto Increment"
        int user_id FK "References users.id (Nullable for Guests)"
        string filename "Radiograph file name"
        string prediction "NORMAL or PNEUMONIA"
        float confidence "Model confidence (0.0 - 1.0)"
        float normal_probability "Normal class probability"
        float pneumonia_probability "Pneumonia class probability"
        string image_path "Secure disk storage path"
        string heatmap_path "Grad-CAM heatmap storage path"
        string overlay_path "Heatmap overlay storage path"
        text explanation "Clinical reasoning summary"
        float processing_time "Latency in seconds"
        datetime created_at "Inference Timestamp (Indexed)"
    }
```

## 2. Table Specifications

### 2.1 `users`
- Stores user credentials, hashed passwords, and profile metadata.
- Email is indexed and constrained to be case-insensitively unique.

### 2.2 `refresh_sessions`
- Manages refresh token rotation.
- Rather than storing raw refresh tokens, stores a 256-bit SHA-256 digest (`token_hash`), preventing session compromise even if database dumps are leaked.

### 2.3 `password_reset_tokens`
- Tracks cryptographic single-use tokens valid for 60 minutes.
- When consumed, `used_at` is populated and all user sessions are invalidated.

### 2.4 `prediction_history`
- Stores individual scan records.
- User ownership is strictly enforced via foreign key `user_id`.
- Sensitive patient radiographs are saved into private disk storage (`backend/data/storage/`) rather than exposed publicly.

