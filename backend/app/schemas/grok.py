"""Pydantic schemas for xAI Grok LLM integration."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str = Field(..., min_length=1, max_length=4000)


class GrokChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    language: Optional[str] = Field("en", description="'en' for English, 'te' for Telugu")


class GrokChatResponse(BaseModel):
    response: str
    language: str
    model: str
    status_note: str
    is_live_api: bool


class ExplainPredictionRequest(BaseModel):
    prediction: str = Field(..., description="NORMAL or PNEUMONIA")
    confidence: float = Field(..., ge=0.0, le=1.0)
    normal_prob: Optional[float] = Field(None, ge=0.0, le=1.0)
    pneumonia_prob: Optional[float] = Field(None, ge=0.0, le=1.0)
    model_version: Optional[str] = "2.1.0-alpha"
    uncertainty: Optional[float] = 0.0
    validation_status: Optional[str] = "PASSED"
    has_gradcam: Optional[bool] = True
    language: Optional[str] = Field("en", description="'en' or 'te'")


class ExplainPredictionResponse(BaseModel):
    explanation: str
    language: str
    model: str
    is_live_api: bool
    status_note: str
    disclaimer: str


class ReportSummaryRequest(BaseModel):
    prediction: str
    confidence: float
    normal_prob: Optional[float] = None
    pneumonia_prob: Optional[float] = None
    filename: Optional[str] = "radiograph.png"
    uncertainty: Optional[float] = 0.0
    validation_status: Optional[str] = "PASSED"
    language: Optional[str] = "en"


class ReportSummaryResponse(BaseModel):
    summary: str
    language: str

