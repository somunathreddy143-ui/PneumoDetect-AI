# REST API Documentation

## Base URL
- Local: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Redoc Reference: `http://localhost:8000/redoc`

---

## 1. Authentication Endpoints

### 1.1 `POST /api/auth/register`
Register a new healthcare researcher account.
- **Request Body (JSON)**:
  ```json
  {
    "full_name": "Dr. Jane Doe",
    "email": "dr.jane@hospital.org",
    "password": "SecureMedPassword2026!",
    "confirm_password": "SecureMedPassword2026!",
    "terms_accepted": true
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "s9xV4j...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "full_name": "Dr. Jane Doe",
      "email": "dr.jane@hospital.org",
      "is_active": true,
      "created_at": "2026-11-08T17:25:15"
    }
  }
  ```

### 1.2 `POST /api/auth/login`
Authenticate existing user and issue fresh tokens.
- **Request Body (JSON)**:
  ```json
  {
    "email": "dr.jane@hospital.org",
    "password": "SecureMedPassword2026!",
    "remember_me": true
  }
  ```
- **Response (200 OK)**: TokenResponse object.

### 1.3 `POST /api/auth/refresh`
Rotate refresh token and issue new access token.
- **Request Body (JSON)**: `{"refresh_token": "string"}`
- **Response (200 OK)**: TokenResponse object.

### 1.4 `POST /api/auth/logout`
Revoke active session token.
- **Request Body (JSON)**: `{"refresh_token": "string"}`

### 1.5 `GET /api/auth/me`
Retrieve authenticated user profile.
- **Headers**: `Authorization: Bearer <access_token>`

---

## 2. Radiograph Prediction & Explainability

### 2.1 `POST /api/predict`
Single chest radiograph evaluation.
- **Headers**: `Authorization: Bearer <access_token>` (Optional)
- **Form Data**: `file` (Image binary: JPG/PNG, max 10MB)
- **Response (200 OK)**:
  ```json
  {
    "id": 1,
    "filename": "chest_xray_01.png",
    "prediction": "PNEUMONIA",
    "confidence": 0.8638,
    "probabilities": {
      "NORMAL": 0.1362,
      "PNEUMONIA": 0.8638
    },
    "original_image": "base64_string...",
    "heatmap_image": "base64_string...",
    "overlay_image": "base64_string...",
    "explanation": "The MobileNetV2 model classifies this radiograph...",
    "processing_time": 0.34,
    "timestamp": "2026-11-08T17:26:49"
  }
  ```

### 2.2 `POST /api/predict/batch`
Batch evaluation of up to 10 radiographs.
- **Form Data**: `files` (Multiple image files)
- **Response (200 OK)**: `BatchPredictionResponse` containing individual results and error reports.

---

## 3. History, Analytics, & Reports

### 3.1 `GET /api/history`
User-isolated scan history with search and pagination.
- **Headers**: `Authorization: Bearer <access_token>`
- **Query Parameters**:
  - `page`: int (default: 1)
  - `per_page`: int (default: 10)
  - `search`: string
  - `filter_class`: "NORMAL" | "PNEUMONIA"
  - `sort_order`: "desc" | "asc"

### 3.2 `GET /api/reports/{id}/pdf`
Stream and download formal AI publication report in PDF.
- **Headers**: `Authorization: Bearer <access_token>`
- **Response (200 OK)**: `application/pdf` binary stream.

### 3.3 `GET /api/dashboard/stats`
User analytics dashboard aggregations (scans, ratios, weekly/monthly activity).
- **Headers**: `Authorization: Bearer <access_token>`

### 3.4 `GET /api/system/health`
System operational telemetry (backend, DB, ML model status, latency).
- **Response (200 OK)**: `SystemHealthResponse` object.

