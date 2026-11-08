# System Architecture
## Explainable AI-Based Pneumonia Detection Using Chest X-rays

## 1. Overview

This document describes the complete system architecture for the Explainable AI-Based Pneumonia Detection web application. The system uses MobileNetV2 for binary classification of chest X-ray images and Grad-CAM for visual explanations.

> **Disclaimer**: This is an educational and research project, not a clinically validated diagnostic tool.

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                               │
│                    React.js + Tailwind CSS                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ Landing  │ │Dashboard │ │ Upload   │ │ Results  │ │ History  │ │
│  │  Page    │ │  Page    │ │  Page    │ │  Page    │ │  Page    │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ REST API (Axios/HTTP)
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                    │
│                   FastAPI + Uvicorn                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ /health  │ │ /predict │ │ /history │ │ /metrics │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│        │            │            │            │                     │
│        ▼            ▼            ▼            ▼                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │  Health  │ │    ML    │ │ History  │ │ Metrics  │              │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ML INFERENCE ENGINE                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Image            │  │  MobileNetV2     │  │   Grad-CAM       │  │
│  │ Preprocessing    │──│  Classification  │──│   Explainability │  │
│  │ (224×224, RGB)   │  │  (Binary)        │  │   (Heatmaps)     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Component Details

### 3.1 Frontend (React.js)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 19 + Vite 8 | Single Page Application |
| Styling | Tailwind CSS 4 | Responsive medical UI |
| Charts | Recharts | Dashboard visualizations |
| Icons | Lucide React | UI iconography |
| HTTP | Axios | API communication |
| Routing | React Router DOM | Client-side navigation |

### 3.2 Backend (FastAPI)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | FastAPI 0.142 | Async REST API |
| Server | Uvicorn | ASGI production server |
| Validation | Pydantic v2 | Request/response validation |
| Image I/O | Pillow + OpenCV | Image processing |
| ML Runtime | TensorFlow 2.22 | Model inference |

### 3.3 Machine Learning Pipeline

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Base Model | MobileNetV2 | Feature extraction (ImageNet) |
| Training | Transfer Learning | Domain adaptation |
| Explainability | Grad-CAM | Visual decision explanation |
| Evaluation | Scikit-learn | Performance metrics |
| Visualization | Matplotlib + Seaborn | Training/eval plots |

## 4. Data Flow

### 4.1 Prediction Flow

1. **User** uploads chest X-ray image via drag-and-drop
2. **Frontend** validates file (type: JPG/PNG, size: <10MB)
3. **Axios** sends POST request with multipart/form-data to `/predict`
4. **FastAPI** validates request and extracts image bytes
5. **Image Utils** converts to PIL Image → RGB → numpy array
6. **Preprocessor** resizes to 224×224, applies MobileNetV2 preprocessing
7. **MobileNetV2** runs forward pass → sigmoid output
8. **Classifier** determines class (>0.5 = Pneumonia) and confidence
9. **Grad-CAM** computes gradients → generates heatmap
10. **Overlay Generator** blends heatmap with original X-ray
11. **Response** packages prediction, confidence, base64 images, explanation
12. **Frontend** displays 3-panel visualization with results

### 4.2 Dashboard Flow

1. Frontend fetches `/metrics` → displays model performance cards
2. Frontend fetches `/history` → displays prediction statistics
3. Charts render from actual evaluation data

## 5. MobileNetV2 Architecture

```
Input Image (224 × 224 × 3)
         │
         ▼
┌─────────────────────────┐
│    MobileNetV2 Base     │
│   (ImageNet Weights)    │
│   17 Bottleneck Blocks  │
│   Depthwise Separable   │
│   Convolutions          │
│                         │
│   Last Conv: "Conv_1"   │
│   Output: 7 × 7 × 1280 │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Global Average Pooling │
│  Output: 1280           │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│    Dropout (0.3)        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Dense (1, sigmoid)     │
│  Output: probability    │
│  > 0.5 → PNEUMONIA      │
│  ≤ 0.5 → NORMAL         │
└─────────────────────────┘
```

## 6. Grad-CAM Algorithm

1. Forward pass through model → get prediction
2. Extract feature maps from last conv layer (Conv_1): shape 7×7×1280
3. Compute gradients of predicted class score w.r.t. feature maps
4. Global average pool gradients → 1280 channel weights
5. Weighted sum of feature maps using channel weights → 7×7 activation map
6. Apply ReLU (keep positive activations only)
7. Normalize to [0, 1]
8. Resize to original image dimensions (224×224)
9. Apply JET colormap for visualization
10. Overlay on original X-ray (alpha = 0.4)

## 7. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health and model status |
| POST | `/predict` | Upload X-ray, get prediction + Grad-CAM |
| GET | `/history` | Retrieve prediction history |
| DELETE | `/history` | Clear prediction history |
| GET | `/metrics` | Model evaluation metrics |
| GET | `/sample-images` | Demo X-ray images |

## 8. Security Considerations

- File type validation (JPG, JPEG, PNG only)
- File size limitation (10MB maximum)
- No persistent storage of uploaded patient images
- No collection of personally identifiable information
- CORS configuration for frontend access
- Input sanitization on all endpoints

## 9. Deployment Architecture

```
┌────────────────┐     ┌────────────────┐
│   Frontend     │     │   Backend      │
│   (Vercel/     │────▶│   (Render/     │
│   Netlify)     │     │   Railway)     │
│   Static SPA   │     │   Python App   │
└────────────────┘     └───────┬────────┘
                               │
                       ┌───────┴────────┐
                       │  ML Model      │
                       │  (Stored in    │
                       │  cloud storage │
                       │  or bundled)   │
                       └────────────────┘
```

## 10. Limitations

1. Binary classification only (Normal vs. Pneumonia)
2. Not validated for clinical use
3. Performance depends on X-ray image quality
4. Potential dataset bias (single source: Kaggle)
5. Grad-CAM highlights correlation, not causation
6. Model may not generalize to all populations/equipment

