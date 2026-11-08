"""Comprehensive backend tests for Pneumonia Detection & Explainable AI platform."""

import io
import sys
from pathlib import Path
import pytest

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.database import Base, engine
from app.config import settings
from app.services.ml_service import ml_service


@pytest.fixture(scope="session", autouse=True)
def setup_app_and_model():
    """Ensure database tables exist and ML model is loaded for the test session."""
    Base.metadata.create_all(bind=engine)
    if not ml_service.is_loaded:
        ml_service.load_model(settings.MODEL_PATH)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def create_dummy_png_bytes(width=224, height=224) -> io.BytesIO:
    """Generate dummy PNG bytes for testing."""
    img = Image.new("RGB", (width, height), color=(60, 60, 60))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf


# ---------------------------------------------------------------------------
# 1. System Health & Info
# ---------------------------------------------------------------------------

def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "operational"
    assert "auth" in data["endpoints"]


def test_system_health(client):
    res = client.get("/api/system/health")
    assert res.status_code == 200
    data = res.json()
    assert data["database_connected"] is True
    assert data["model_loaded"] is True
    assert "api_latency_ms" in data


# ---------------------------------------------------------------------------
# 2. Authentication Workflow
# ---------------------------------------------------------------------------

def test_auth_registration_and_login(client):
    email = "test.physician@hospital.org"
    password = "StrongPassword2026!"

    # Registration
    reg_payload = {
        "full_name": "Dr. Test Physician",
        "email": email,
        "password": password,
        "confirm_password": password,
        "terms_accepted": True,
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code in [201, 409]

    # Login
    login_payload = {
        "email": email,
        "password": password,
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert "refresh_token" in login_data
    token = login_data["access_token"]

    # Profile (/me)
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # Protected route without token must be 401
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401


# ---------------------------------------------------------------------------
# 3. AI Prediction & Grad-CAM
# ---------------------------------------------------------------------------

def test_single_prediction_and_gradcam(client):
    # Login to get token
    login_res = client.post(
        "/api/auth/login",
        json={"email": "dr.jane@hospital.org", "password": "SecureMed2026!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    img_buf = create_dummy_png_bytes()
    files = {"file": ("test_scan.png", img_buf, "image/png")}

    res = client.post(
        "/api/predict",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["prediction"] in ["NORMAL", "PNEUMONIA"]
    assert 0.0 <= data["confidence"] <= 1.0
    assert len(data["original_image"]) > 0
    assert len(data["heatmap_image"]) > 0
    assert len(data["overlay_image"]) > 0
    assert "explanation" in data
    assert data["id"] is not None


# ---------------------------------------------------------------------------
# 4. User Data Isolation
# ---------------------------------------------------------------------------

def test_user_data_isolation(client):
    # User 1 (Jane)
    u1_login = client.post(
        "/api/auth/login",
        json={"email": "dr.jane@hospital.org", "password": "SecureMed2026!"},
    )
    token1 = u1_login.json()["access_token"]

    # User 2 (Bob)
    u2_login = client.post(
        "/api/auth/login",
        json={"email": "dr.bob@hospital.org", "password": "SecureMed2026!"},
    )
    token2 = u2_login.json()["access_token"]

    # Fetch User 1's history
    h1 = client.get("/api/history", headers={"Authorization": f"Bearer {token1}"}).json()
    assert h1["total"] >= 1
    scan_id = h1["items"][0]["id"]

    # User 2 attempting to access User 1's scan record must receive 404
    u2_attempt = client.get(
        f"/api/history/{scan_id}",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert u2_attempt.status_code == 404

    # User 2 attempting to download User 1's PDF report must receive 404
    u2_pdf_attempt = client.get(
        f"/api/reports/{scan_id}/pdf",
        headers={"Authorization": f"Bearer {token2}"},
    )
    assert u2_pdf_attempt.status_code == 404


# ---------------------------------------------------------------------------
# 5. Invalid File Format Validation
# ---------------------------------------------------------------------------

def test_invalid_file_format(client):
    fake_txt = io.BytesIO(b"This is not a radiograph image.")
    files = {"file": ("malicious.txt", fake_txt, "text/plain")}

    res = client.post("/api/predict", files=files)
    assert res.status_code == 400


# ---------------------------------------------------------------------------
# 6. Model Active Metadata & Versioning (Phase 13)
# ---------------------------------------------------------------------------

def test_model_active_metadata(client):
    res = client.get("/api/models/active")
    assert res.status_code == 200
    data = res.json()
    assert data["model_name"] == "MobileNetV2"
    assert data["model_version"] == "2.1.0-alpha"
    assert len(data["model_checksum_sha256"]) == 64  # SHA-256 hex string
    assert "architecture" in data
    assert data["total_parameters"] > 1_000_000


# ---------------------------------------------------------------------------
# 7. Model Comparison System (Phase 13)
# ---------------------------------------------------------------------------

def test_model_comparison_endpoint(client):
    res = client.get("/api/models/comparison")
    assert res.status_code == 200
    data = res.json()
    assert data["primary_model"] == "MobileNetV2"
    assert data["comparison_model"] == "EfficientNetB0"
    assert "mobilenet_v2" in data
    assert "efficientnet_b0" in data
    assert "comparison_summary" in data
    assert data["mobilenet_v2"]["total_parameters"] < data["efficientnet_b0"]["total_parameters"]


# ---------------------------------------------------------------------------
# 8. User Activity Audit Trail & Isolation (Phase 13)
# ---------------------------------------------------------------------------

def test_user_activity_logging_and_isolation(client):
    email = "audit.physician@hospital.org"
    password = "AuditPassword2026!"

    client.post("/api/auth/register", json={
        "full_name": "Audit Doctor",
        "email": email,
        "password": password,
        "confirm_password": password,
        "terms_accepted": True,
    })

    login_res = client.post("/api/auth/login", json={"email": email, "password": password})
    token = login_res.json()["access_token"]

    # Activity feed should include LOGIN_SUCCESS
    act_res = client.get("/api/user/activities", headers={"Authorization": f"Bearer {token}"})
    assert act_res.status_code == 200
    act_data = act_res.json()
    assert act_data["total"] >= 1
    actions = [item["action"] for item in act_data["items"]]
    assert "LOGIN_SUCCESS" in actions


# ---------------------------------------------------------------------------
# 9. Prediction Reliability & Image Suitability (Phase 13)
# ---------------------------------------------------------------------------

def test_prediction_reliability_and_validation(client):
    img_buf = create_dummy_png_bytes(224, 224)
    files = {"file": ("quality_radiograph.png", img_buf, "image/png")}

    res = client.post("/api/predict", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "uncertainty_score" in data
    assert data["reliability_level"] in ["HIGH", "MODERATE", "LOW / INCONCLUSIVE"]
    assert "validation_status" in data
    assert "image_validation" in data
    assert "is_inconclusive" in data


# ---------------------------------------------------------------------------
# 10. Grok LLM xAI Integration (Phase 14)
# ---------------------------------------------------------------------------

def test_grok_endpoints_unauthorized(client):
    """Ensure all Grok endpoints require JWT authentication."""
    chat_res = client.post("/api/grok/chat", json={"messages": [{"role": "user", "content": "What is Grad-CAM?"}]})
    assert chat_res.status_code == 401

    explain_res = client.post("/api/grok/explain-prediction", json={"prediction": "PNEUMONIA", "confidence": 0.95})
    assert explain_res.status_code == 401

    summary_res = client.post("/api/grok/report-summary", json={"prediction": "NORMAL", "confidence": 0.92})
    assert summary_res.status_code == 401


def test_grok_explain_prediction_and_telugu(client):
    """Verify Grok prediction explanation in both English and Telugu."""
    login_res = client.post(
        "/api/auth/login",
        json={"email": "dr.jane@hospital.org", "password": "SecureMed2026!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. English explanation
    payload_en = {
        "prediction": "PNEUMONIA",
        "confidence": 0.942,
        "probabilities": {"NORMAL": 0.058, "PNEUMONIA": 0.942},
        "model_version": "2.1.0-alpha",
        "uncertainty_score": 0.12,
        "reliability_level": "HIGH",
        "has_gradcam": True,
        "language": "en"
    }
    res_en = client.post("/api/grok/explain-prediction", json=payload_en, headers=headers)
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert "explanation" in data_en
    assert "PNEUMONIA" in data_en["explanation"] or "MobileNetV2" in data_en["explanation"]
    assert data_en["language"] == "en"

    # 2. Telugu explanation
    payload_te = {**payload_en, "language": "te"}
    res_te = client.post("/api/grok/explain-prediction", json=payload_te, headers=headers)
    assert res_te.status_code == 200
    data_te = res_te.json()
    assert "explanation" in data_te
    assert data_te["language"] == "te"


def test_grok_chat_and_report_summary(client):
    """Verify interactive Grok chatbot and AI PDF report summary generation."""
    login_res = client.post(
        "/api/auth/login",
        json={"email": "dr.jane@hospital.org", "password": "SecureMed2026!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Educational Chat
    chat_payload = {
        "messages": [
            {"role": "user", "content": "Explain Grad-CAM and MobileNetV2 architecture."}
        ],
        "language": "en"
    }
    chat_res = client.post("/api/grok/chat", json=chat_payload, headers=headers)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert "response" in chat_data
    assert len(chat_data["response"]) > 20

    # 2. PDF Report Summary
    summary_payload = {
        "prediction": "NORMAL",
        "confidence": 0.965,
        "uncertainty_score": 0.08,
        "language": "en"
    }
    sum_res = client.post("/api/grok/report-summary", json=summary_payload, headers=headers)
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert "summary" in sum_data
    assert len(sum_data["summary"]) > 20

