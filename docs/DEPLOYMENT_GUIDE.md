# Production Deployment & Hosting Guide

## 1. Architecture Overview
- **Frontend**: Static Single Page Application (SPA) deployable on **Vercel**, **Netlify**, or AWS CloudFront.
- **Backend API**: Python FastAPI application containerized via Docker or hosted on **Render**, **Railway**, or AWS ECS.
- **Database**: PostgreSQL (e.g. Supabase, AWS RDS, Neon) or local SQLite for prototyping.

---

## 2. Backend Deployment (e.g., Render / Docker)

### 2.1 Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgl1-mesa-glx libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/
COPY ml/ /app/ml/
COPY results/ /app/results/

ENV PYTHONPATH=/app/backend
WORKDIR /app/backend

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2 Environment Variables
| Variable | Example Value | Description |
|----------|---------------|-------------|
| `JWT_SECRET` | `generate-a-strong-random-32-byte-hex` | Secret key for signing JWT tokens |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Database connection string |
| `MODEL_PATH` | `/app/ml/saved_models/best_model.keras` | Location of trained MobileNetV2 model |
| `MAX_FILE_SIZE` | `10485760` | 10 MB maximum image upload |

---

## 3. Frontend Deployment (e.g., Vercel / Netlify)

### 3.1 Build Settings
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3.2 Environment Variables
- `VITE_API_URL`: `https://your-backend-api.onrender.com`

---

## 4. Hardware Sizing & Memory Constraints
- MobileNetV2 inference requires ~350 MB to 600 MB RAM during peak execution with TensorFlow.
- A virtual machine or container with **1.0 GB to 2.0 GB RAM** is recommended.

