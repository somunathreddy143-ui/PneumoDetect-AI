"""Prediction, history, dashboard, and system health Pydantic schemas."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    id: Optional[int] = None
    filename: Optional[str] = "radiograph.png"
    prediction: str
    confidence: float
    probabilities: dict[str, float]
    original_image: str
    heatmap_image: str
    overlay_image: str
    explanation: str
    processing_time: float
    timestamp: str
    model_name: Optional[str] = "MobileNetV2"
    model_version: Optional[str] = "2.1.0-alpha"
    model_checksum: Optional[str] = ""
    uncertainty_score: Optional[float] = 0.0
    validation_status: Optional[str] = "PASSED"
    reliability_level: Optional[str] = "HIGH"
    is_inconclusive: Optional[bool] = False
    image_validation: Optional[dict[str, Any]] = None

    model_config = {"from_attributes": True}


class BatchItemResult(BaseModel):
    filename: str
    success: bool
    error: Optional[str] = None
    prediction: Optional[str] = None
    confidence: Optional[float] = None
    probabilities: Optional[dict[str, float]] = None
    prediction_id: Optional[int] = None
    original_image: Optional[str] = None
    heatmap_image: Optional[str] = None
    overlay_image: Optional[str] = None
    explanation: Optional[str] = None
    processing_time: Optional[float] = None
    model_version: Optional[str] = "2.1.0-alpha"
    uncertainty_score: Optional[float] = 0.0
    reliability_level: Optional[str] = "HIGH"
    is_inconclusive: Optional[bool] = False
    validation_status: Optional[str] = "PASSED"


class BatchPredictionResponse(BaseModel):
    total: int
    successful: int
    failed: int
    results: list[BatchItemResult]


class HistoryItem(BaseModel):
    id: int
    filename: str
    prediction: str
    confidence: float
    probabilities: dict[str, float]
    processing_time: float
    timestamp: str

    model_config = {"from_attributes": True}


class PaginatedHistoryResponse(BaseModel):
    items: list[HistoryItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class ActivityTrend(BaseModel):
    label: str
    total: int
    normal: int
    pneumonia: int


class DashboardStatsResponse(BaseModel):
    total_scans: int
    normal_scans: int
    pneumonia_scans: int
    model_accuracy: float
    recent_scans: list[HistoryItem]
    weekly_activity: list[ActivityTrend]
    monthly_activity: list[ActivityTrend]


class SystemHealthResponse(BaseModel):
    status: str
    database_connected: bool
    model_loaded: bool
    model_name: str = "MobileNetV2 (ImageNet)"
    model_version: str = "2.1.0"
    app_version: str = "2.5.0-Healthcare"
    api_latency_ms: float
    timestamp: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    timestamp: str


class MetricsResponse(BaseModel):
    metrics: dict[str, Any]
    confusion_matrix_image: Optional[str] = None
    roc_curve_image: Optional[str] = None


class SampleImage(BaseModel):
    name: str
    category: str
    image_base64: str


class SampleImagesResponse(BaseModel):
    samples: list[SampleImage]


class UserActivityItem(BaseModel):
    id: int
    action: str
    description: str
    ip_address: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}


class PaginatedActivitiesResponse(BaseModel):
    items: list[UserActivityItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class ModelMetadataResponse(BaseModel):
    model_name: str
    model_version: str
    training_date: str
    dataset_version: str
    model_file: str
    model_checksum_sha256: str
    architecture: str
    input_shape: list[int]
    framework: str
    total_parameters: int
    active_role: str


class ModelComparisonResponse(BaseModel):
    dataset: str
    test_split_samples: int
    primary_model: str
    comparison_model: str
    timestamp: str
    mobilenet_v2: dict[str, Any]
    efficientnet_b0: dict[str, Any]
    comparison_summary: dict[str, Any]
    comparison_chart_image: Optional[str] = None

