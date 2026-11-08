# Explainable AI-Based Pneumonia Detection Using Chest X-rays
### MobileNetV2 Transfer Learning with Grad-CAM & Secure Multi-User Authentication

[![FastAPI](https://img.shields.io/badge/FastAPI-0.142.2-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.3.1-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3.6-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.22.0-FF6F00.svg?logo=tensorflow&logoColor=white)](https://tensorflow.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.3.5-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![ReportLab](https://img.shields.io/badge/ReportLab-4.4.10-red.svg)](https://www.reportlab.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **IMPORTANT REGULATORY DISCLAIMER**:  
> PneumoDetect AI is strictly an **educational and academic research decision-support tool**. It is **NOT** a clinically cleared diagnostic medical device (FDA/CE). Model predictions and heatmaps represent statistical correlation, never confirmed medical diagnosis. Always consult certified radiologists.

---

## 🌟 Upgraded Platform Capabilities

### 1. Advanced AI Dashboard
- Personal scan activity telemetry (Total Scans, Normal, Pneumonia, Model Benchmark Accuracy).
- Interactive Recharts data visualizations:
  - Normal vs. Pneumonia distribution pie charts.
  - 7-Day daily activity area/bar charts.
  - Monthly activity trends.
- Quick navigation actions and recent scan history log.

### 2. Enterprise User Authentication & Authorization
- Secure account registration with live password strength meters and validation.
- Login with password visibility toggle, remember-me support, and secure session management.
- Cryptographically secure JWT access tokens (HMAC-SHA256) with short-lived expiration.
- Database-backed refresh token rotation with SHA-256 hashed storage.
- Bcrypt password hashing ($2^{12}$ rounds).
- Single-use, expiring password recovery workflow.
- Strict row-level user data isolation: no user can view, download, or delete another researcher's scans.

### 3. Interactive Grad-CAM Visualization
- 3-Panel comparison: **Original Radiograph**, **Grad-CAM Heatmap (JET Colormap)**, and **Anatomical Overlay ($\alpha=0.4$)**.
- Interactive controls: Zoom in, Zoom out, Reset fit, Fullscreen mode.
- High-resolution PNG download for all visual representations.
- Detailed *"Why Did the AI Make This Prediction?"* rationale section.

### 4. Interactive Before-and-After Slider Comparison
- Smooth draggable slider comparing input radiograph directly against the Grad-CAM overlay.
- Dual inspection modes: Interactive Slider and Side-by-Side comparison.
- Fullscreen examination view for detailed radiologic inspection.

### 5. Publication-Grade AI PDF Reports
- Automated PDF report generation via **ReportLab**.
- Formatted medical header with unique Report ID (`AR-XAI-XXXXXX`) and timestamps.
- Embedded high-res images: Original radiograph, Grad-CAM heatmap, and overlay.
- Categorical classification, confidence, class probabilities, and clinical rationale.
- Authenticated endpoint: `GET /api/reports/{id}/pdf`.

### 6. Multiple X-ray Batch Upload
- Support for single scans or batch upload of up to 10 radiographs simultaneously.
- Drag-and-drop zone with thumbnail previews and individual file removal.
- Independent neural network evaluation for each scan in the batch.
- Batch outcome summary table with individual status and link to heatmaps.

### 7. Private Scan History & Search
- Paginated scan history table.
- Search by filename or scan ID.
- Filter by classification (NORMAL / PNEUMONIA).
- Sort by newest or oldest.
- Permanent scan deletion with image file purge.

### 8. Explainable AI Educational Center
- Comprehensive educational guides:
  1. What is a Convolutional Neural Network (CNN)?
  2. MobileNetV2 Architecture & Inverted Residual Bottlenecks.
  3. Transfer Learning in Medical Imaging.
  4. The Grad-CAM Algorithm & Mathematical Formulation.
  5. Overcoming the "Black Box" Problem in Healthcare.
  6. End-to-End System Workflow.

### 9. Model Performance Center
- Real benchmark test evaluation results:
  - **Accuracy**: 92.5%
  - **Sensitivity / Recall**: 96.9%
  - **Precision**: 91.4%
  - **Specificity**: 85.0%
  - **ROC-AUC**: 0.969
- High-resolution Confusion Matrix and ROC Curve figures.
- Detailed educational explanations of TP, TN, FP, FN, Sensitivity, and Specificity.

### 10. Dark Mode & Light Mode Theme Engine
- Clinical Light theme (high-contrast clinical reading).
- Dark Radiologic theme (low-glare radiologist workstation environment).
- Smooth CSS transitions and persistent user preference via `localStorage`.

### 11. System Health & Telemetry Monitoring
- Real-time service monitoring at `GET /api/system/health`:
  - FastAPI backend gateway status.
  - SQLAlchemy relational database connectivity.
  - MobileNetV2 neural model loaded state.
  - Live round-trip API latency telemetry.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, React Router DOM 7, Recharts 3, Lucide React, Axios |
| **Backend** | Python 3.14 / 3.13, FastAPI 0.142, Uvicorn 0.54, SQLAlchemy 2.0, Pydantic v2 |
| **Security** | PyJWT (HS256), Bcrypt, SHA-256 token hashing, Row-level data isolation |
| **Deep Learning** | TensorFlow 2.22 / Keras 3, MobileNetV2 (ImageNet), Grad-CAM |
| **Reporting & Images** | ReportLab 4.4, OpenCV 4.13, Pillow 12.0, Matplotlib 3.10 |
| **Database** | SQLite (development) / PostgreSQL (production ready) |

---

## 🚀 Quickstart & Installation

### 1. Prerequisites
- Python 3.11+ (Python 3.13/3.14 verified)
- Node.js 18+ (Node.js 22 verified)

### 2. Backend Setup & Startup
```powershell
# Navigate to backend directory
cd "c:\Users\m40su\Downloads\PPT\New folder\AI\backend"

# Install Python requirements
pip install -r requirements.txt

# Start the FastAPI server (runs at http://localhost:8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 3. Frontend Setup & Startup
```powershell
# Navigate to frontend directory
cd "c:\Users\m40su\Downloads\PPT\New folder\AI\frontend"

# Install npm dependencies (if not already installed)
npm install

# Start the Vite development server (runs at http://localhost:5173)
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 🧪 Automated Testing
Run the comprehensive Pytest verification suite:
```powershell
cd "c:\Users\m40su\Downloads\PPT\New folder\AI"
python -m pytest tests -v
```
**Results**: 6 of 6 tests passing (100% pass rate).

---

## 📂 Project Structure
```
explainable-pneumonia-detection/
├── frontend/                     # React 19 + Vite + Tailwind application
│   ├── src/
│   │   ├── components/           # Navbar, Footer, ComparisonSlider, ImageViewer, etc.
│   │   ├── context/              # AuthContext.jsx, ThemeContext.jsx
│   │   ├── pages/                # All 15 application pages
│   │   ├── services/             # api.js with Axios interceptors
│   │   ├── App.jsx               # Route definitions
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # FastAPI Python backend
│   ├── app/
│   │   ├── models/               # SQLAlchemy User, RefreshSession, PredictionHistory
│   │   ├── routes/               # auth.py, prediction.py, system.py, health.py, metrics.py
│   │   ├── schemas/              # Pydantic auth, prediction, system schemas
│   │   ├── services/             # ml_service.py, gradcam_service.py, pdf_service.py, auth_service.py
│   │   ├── utils/                # image_utils.py, dependencies.py
│   │   ├── config.py
│   │   ├── database.py           # SQLite / PostgreSQL engine & session maker
│   │   └── main.py               # FastAPI entry point & lifespan
│   ├── data/
│   │   ├── samples/              # Demo X-ray images
│   │   └── storage/              # Private, secure patient image & report storage
│   └── requirements.txt
│
├── ml/                           # Deep learning training & evaluation pipeline
│   ├── model.py                  # MobileNetV2 architecture definition
│   ├── gradcam.py                # Grad-CAM algorithm implementation
│   ├── preprocessing.py          # Data pipeline
│   ├── train.py                  # Two-phase transfer learning training
│   ├── evaluate.py               # Test dataset evaluation script
│   └── saved_models/             # best_model.keras
│
├── results/                      # Evaluation figures & metrics
│   ├── evaluation/               # metrics.json, confusion_matrix.png, roc_curve.png
│   └── graphs/
│
├── tests/                        # Automated Pytest suite
│   └── test_api.py
│
├── docs/                         # In-depth architectural documentation
│   ├── AUTHENTICATION_GUIDE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DOCUMENTATION.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── MODEL_DOCUMENTATION.md
│   ├── TESTING_REPORT.md
│   └── DEPLOYMENT_GUIDE.md
│
└── README.md
```

---

## ⚖️ License
This project is open-source under the MIT License.

