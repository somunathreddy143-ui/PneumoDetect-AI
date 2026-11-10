"""Prediction, batch inference, history, and PDF report routes."""

from __future__ import annotations

import base64
from datetime import datetime, timedelta, timezone
import io
import logging
import os
from pathlib import Path
import time
from typing import Optional

import cv2
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse
import numpy as np
from PIL import Image
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.database import STORAGE_DIR, get_db
from app.models.prediction import PredictionHistory
from app.models.user import User
from app.schemas.prediction import (
    ActivityTrend,
    BatchItemResult,
    BatchPredictionResponse,
    DashboardStatsResponse,
    HistoryItem,
    ModelComparisonResponse,
    ModelMetadataResponse,
    PaginatedActivitiesResponse,
    PaginatedHistoryResponse,
    PredictionResponse,
    UserActivityItem,
)
from app.services.activity_service import get_user_activities, log_user_activity
from app.services.gradcam_service import gradcam_service
from app.services.ml_service import ml_service
from app.services.pdf_service import generate_prediction_pdf
from app.utils.dependencies import get_current_user, get_optional_user
from app.utils.image_utils import (
    assess_image_suitability,
    compute_uncertainty,
    load_image,
    numpy_to_base64,
    preprocess_for_model,
    validate_image,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Prediction & History"])


def _save_image_to_disk(img_array: np.ndarray, folder: Path, filename: str) -> str:
    """Save an RGB numpy array to disk and return the path."""
    dest = folder / filename
    img = Image.fromarray(img_array.astype(np.uint8))
    img.save(dest, format="PNG")
    return str(dest)


def _load_image_file_as_base64(path_str: Optional[str]) -> str:
    """Load an image file from disk and return its base64 string."""
    if path_str and Path(path_str).is_file():
        try:
            return base64.b64encode(Path(path_str).read_bytes()).decode("utf-8")
        except Exception:
            pass
    return ""


# ---------------------------------------------------------------------------
# POST /api/predict (and /predict for backward compatibility)
# ---------------------------------------------------------------------------

@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Run pneumonia prediction and Grad-CAM on uploaded X-ray",
)
@router.post(
    "/api/predict",
    response_model=PredictionResponse,
    summary="Run pneumonia prediction and Grad-CAM on uploaded X-ray",
)
async def predict_single(
    file: UploadFile = File(..., description="Chest X-ray image"),
    request: Request = None,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Accept an image, validate, execute MobileNetV2 + Grad-CAM, persist for authenticated users."""
    if not ml_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Machine learning model is still initializing. Please retry in a few moments.",
        )

    # 1. Read & validate file
    content = await file.read()
    filename = file.filename or "radiograph.png"
    validate_image(content, filename)

    # 2. Process image
    try:
        orig_array = load_image(content)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to decode image file: {exc}",
        ) from exc

    # 3. Assess clinical radiograph suitability and input validity
    suitability = assess_image_suitability(orig_array, filename)

    start_time = time.perf_counter()
    preprocessed = preprocess_for_model(orig_array)

    # 4. Model Inference
    try:
        pred_label, confidence, probs = ml_service.predict(preprocessed)
    except Exception as exc:
        logger.exception("Inference failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Neural network inference failed: {exc}",
        ) from exc

    # 5. Grad-CAM Visualization
    pred_class_idx = 1 if pred_label == "PNEUMONIA" else 0
    try:
        heatmap_colored, overlay = gradcam_service.generate(
            model=ml_service.model,
            preprocessed_image=preprocessed,
            original_image=orig_array,
            predicted_class=pred_class_idx,
        )
    except Exception as exc:
        logger.exception("Grad-CAM generation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Grad-CAM generation failed: {exc}",
        ) from exc

    elapsed = round(time.perf_counter() - start_time, 3)

    # 6. Uncertainty & Reliability Estimation
    uncertainty, reliability_tier, is_inconclusive = compute_uncertainty(confidence)
    if suitability["status"] == "INCONCLUSIVE":
        is_inconclusive = True
        reliability_tier = "LOW / INCONCLUSIVE"

    # 7. Convert to Base64
    orig_b64 = gradcam_service.to_base64(orig_array)
    heatmap_b64 = gradcam_service.to_base64(heatmap_colored)
    overlay_b64 = gradcam_service.to_base64(overlay)

    # 8. Generate clinical reasoning explanation
    conf_pct = f"{confidence * 100:.1f}%"
    uncertainty_pct = f"{uncertainty * 100:.1f}%"
    status_note = f" (Quality Assessment: {suitability['status']})" if suitability["status"] != "PASSED" else ""
    if is_inconclusive:
        explanation = (
            f"The model output is INCONCLUSIVE with high uncertainty ({uncertainty_pct}). "
            f"Image assessment indicates {suitability['status']}. "
            "Predictions in this range should not be relied upon. Manual clinical radiographic review is recommended."
        )
    elif pred_label == "PNEUMONIA":
        explanation = (
            f"The MobileNetV2 model classifies this radiograph as PNEUMONIA with {conf_pct} confidence "
            f"and {reliability_tier} reliability (entropy uncertainty: {uncertainty_pct}){status_note}. "
            "Grad-CAM highlights regions of maximum gradient activation in warm colors (red/orange), "
            "reflecting localized opacity or consolidation patterns in lung fields. "
            "Note: This is an AI research decision-support tool, not a clinical diagnosis."
        )
    else:
        explanation = (
            f"The MobileNetV2 model classifies this radiograph as NORMAL with {conf_pct} confidence "
            f"and {reliability_tier} reliability (entropy uncertainty: {uncertainty_pct}){status_note}. "
            "Grad-CAM demonstrates distributed gradients across well-aerated lung parenchyma "
            "without focal consolidated activation peaks. "
            "Note: This is an AI research decision-support tool, not a clinical diagnosis."
        )

    now_utc = datetime.now(timezone.utc)
    record_id = None

    # 9. Persist in database & audit activity if user is authenticated
    if current_user:
        ts_suffix = f"{current_user.id}_{int(time.time() * 1000)}"
        orig_file = _save_image_to_disk(orig_array, STORAGE_DIR / "images", f"orig_{ts_suffix}.png")
        heat_file = _save_image_to_disk(heatmap_colored, STORAGE_DIR / "heatmaps", f"heat_{ts_suffix}.png")
        over_file = _save_image_to_disk(overlay, STORAGE_DIR / "overlays", f"over_{ts_suffix}.png")

        record = PredictionHistory(
            user_id=current_user.id,
            filename=filename,
            prediction=pred_label,
            confidence=confidence,
            normal_probability=probs.get("NORMAL", 1.0 - confidence),
            pneumonia_probability=probs.get("PNEUMONIA", confidence),
            image_path=orig_file,
            heatmap_path=heat_file,
            overlay_path=over_file,
            explanation=explanation,
            processing_time=elapsed,
            model_name=ml_service.model_name,
            model_version=ml_service.model_version,
            uncertainty_score=uncertainty,
            validation_status=suitability["status"],
            reliability_level=reliability_tier,
            is_inconclusive=is_inconclusive,
            created_at=now_utc,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        record_id = record.id

        # Log User Activities
        log_user_activity(db, current_user.id, "XRAY_UPLOAD", f"Uploaded radiograph: {filename} ({orig_array.shape[1]}x{orig_array.shape[0]})", request=request)
        log_user_activity(db, current_user.id, "PREDICTION_GENERATED", f"Prediction for {filename}: {pred_label} ({conf_pct}, Reliability: {reliability_tier})", request=request)

    res_obj = PredictionResponse(
        id=record_id,
        filename=filename,
        prediction=pred_label,
        confidence=confidence,
        probabilities=probs,
        original_image=orig_b64,
        heatmap_image=heatmap_b64,
        overlay_image=overlay_b64,
        explanation=explanation,
        processing_time=elapsed,
        timestamp=now_utc.isoformat(),
        model_name=ml_service.model_name,
        model_version=ml_service.model_version,
        model_checksum=ml_service.checksum,
        uncertainty_score=uncertainty,
        validation_status=suitability["status"],
        reliability_level=reliability_tier,
        is_inconclusive=is_inconclusive,
        image_validation=suitability,
    )

    import gc
    gc.collect()

    return res_obj


# ---------------------------------------------------------------------------
# POST /api/predict/batch
# ---------------------------------------------------------------------------

@router.post(
    "/api/predict/batch",
    response_model=BatchPredictionResponse,
    summary="Batch upload and inference on multiple chest radiographs",
)
async def predict_batch(
    files: list[UploadFile] = File(..., description="Up to 10 chest X-ray images"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Process multiple images sequentially, returning independent predictions for each."""
    if not ml_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML model is loading. Please retry.",
        )

    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files allowed per batch.",
        )

    results: list[BatchItemResult] = []
    successful = 0
    failed = 0

    for f in files:
        fname = f.filename or "unknown.png"
        try:
            content = await f.read()
            validate_image(content, fname)
            orig_array = load_image(content)

            start_t = time.perf_counter()
            suitability = assess_image_suitability(orig_array, fname)
            preprocessed = preprocess_for_model(orig_array)
            pred_label, confidence, probs = ml_service.predict(preprocessed)

            pred_class_idx = 1 if pred_label == "PNEUMONIA" else 0
            heatmap_colored, overlay = gradcam_service.generate(
                model=ml_service.model,
                preprocessed_image=preprocessed,
                original_image=orig_array,
                predicted_class=pred_class_idx,
            )
            elapsed = round(time.perf_counter() - start_t, 3)

            uncertainty, reliability_tier, is_inconclusive = compute_uncertainty(confidence)
            if suitability["status"] == "INCONCLUSIVE":
                is_inconclusive = True
                reliability_tier = "LOW / INCONCLUSIVE"

            orig_b64 = gradcam_service.to_base64(orig_array)
            heatmap_b64 = gradcam_service.to_base64(heatmap_colored)
            overlay_b64 = gradcam_service.to_base64(overlay)

            explanation = (
                f"Model predicts {pred_label} with {confidence * 100:.1f}% confidence "
                f"(Reliability: {reliability_tier}, Uncertainty: {uncertainty * 100:.1f}%)."
            )

            rec_id = None
            if current_user:
                ts_suffix = f"{current_user.id}_{int(time.time() * 1000)}_{secrets_suffix()}"
                orig_file = _save_image_to_disk(orig_array, STORAGE_DIR / "images", f"orig_{ts_suffix}.png")
                heat_file = _save_image_to_disk(heatmap_colored, STORAGE_DIR / "heatmaps", f"heat_{ts_suffix}.png")
                over_file = _save_image_to_disk(overlay, STORAGE_DIR / "overlays", f"over_{ts_suffix}.png")

                record = PredictionHistory(
                    user_id=current_user.id,
                    filename=fname,
                    prediction=pred_label,
                    confidence=confidence,
                    normal_probability=probs.get("NORMAL", 1.0 - confidence),
                    pneumonia_probability=probs.get("PNEUMONIA", confidence),
                    image_path=orig_file,
                    heatmap_path=heat_file,
                    overlay_path=over_file,
                    explanation=explanation,
                    processing_time=elapsed,
                    model_name=ml_service.model_name,
                    model_version=ml_service.model_version,
                    uncertainty_score=uncertainty,
                    validation_status=suitability["status"],
                    reliability_level=reliability_tier,
                    is_inconclusive=is_inconclusive,
                    created_at=datetime.now(timezone.utc),
                )
                db.add(record)
                db.commit()
                rec_id = record.id

            results.append(
                BatchItemResult(
                    filename=fname,
                    success=True,
                    prediction=pred_label,
                    confidence=confidence,
                    probabilities=probs,
                    prediction_id=rec_id,
                    original_image=orig_b64,
                    heatmap_image=heatmap_b64,
                    overlay_image=overlay_b64,
                    explanation=explanation,
                    processing_time=elapsed,
                    model_version=ml_service.model_version,
                    uncertainty_score=uncertainty,
                    reliability_level=reliability_tier,
                    is_inconclusive=is_inconclusive,
                    validation_status=suitability["status"],
                )
            )
            successful += 1

        except Exception as e:
            failed += 1
            results.append(
                BatchItemResult(
                    filename=fname,
                    success=False,
                    error=str(e),
                )
            )

    return BatchPredictionResponse(
        total=len(files),
        successful=successful,
        failed=failed,
        results=results,
    )


def secrets_suffix() -> str:
    import secrets
    return secrets.token_hex(4)


# ---------------------------------------------------------------------------
# GET /api/history & /history
# ---------------------------------------------------------------------------

@router.get(
    "/api/history",
    response_model=PaginatedHistoryResponse,
    summary="Get user-isolated scan history with search and filtering",
)
def get_user_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None, description="Search by filename or ID"),
    filter_class: Optional[str] = Query(None, description="NORMAL or PNEUMONIA"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
):
    """Retrieve scan history exclusively for the authenticated user."""
    query = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id)

    if filter_class and filter_class.upper() in ["NORMAL", "PNEUMONIA"]:
        query = query.filter(PredictionHistory.prediction == filter_class.upper())

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (PredictionHistory.filename.ilike(s)) |
            (PredictionHistory.prediction.ilike(s))
        )

    total = query.count()

    if sort_order == "desc":
        query = query.order_by(desc(PredictionHistory.created_at))
    else:
        query = query.order_by(PredictionHistory.created_at)

    items = query.offset((page - 1) * per_page).limit(per_page).all()

    history_items = [
        HistoryItem(
            id=item.id,
            filename=item.filename,
            prediction=item.prediction,
            confidence=item.confidence,
            probabilities={
                "NORMAL": item.normal_probability,
                "PNEUMONIA": item.pneumonia_probability,
            },
            processing_time=item.processing_time,
            timestamp=item.created_at.isoformat() if item.created_at else "",
        )
        for item in items
    ]

    total_pages = (total + per_page - 1) // per_page if total > 0 else 1

    return PaginatedHistoryResponse(
        items=history_items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


# Backward-compatible endpoint for existing dashboard/history calls
@router.get("/history", summary="Backward-compatible history endpoint")
def legacy_history(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Returns items list for backward compatibility."""
    if not current_user:
        return {"items": []}
    records = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.user_id == current_user.id)
        .order_by(desc(PredictionHistory.created_at))
        .limit(20)
        .all()
    )
    items = [
        {
            "id": r.id,
            "filename": r.filename,
            "prediction": r.prediction,
            "confidence": r.confidence,
            "probabilities": {
                "NORMAL": r.normal_probability,
                "PNEUMONIA": r.pneumonia_probability,
            },
            "processing_time": r.processing_time,
            "timestamp": r.created_at.isoformat() if r.created_at else "",
        }
        for r in records
    ]
    return {"items": items}


# ---------------------------------------------------------------------------
# GET /api/history/{prediction_id}
# ---------------------------------------------------------------------------

@router.get(
    "/api/history/{prediction_id}",
    response_model=PredictionResponse,
    summary="Retrieve single prediction record with images",
)
def get_prediction_by_id(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full prediction details and images with strict ownership check."""
    rec = (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.id == prediction_id,
            PredictionHistory.user_id == current_user.id,
        )
        .first()
    )

    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan record not found or access denied.",
        )

    orig_b64 = _load_image_file_as_base64(rec.image_path)
    heat_b64 = _load_image_file_as_base64(rec.heatmap_path)
    over_b64 = _load_image_file_as_base64(rec.overlay_path)

    return PredictionResponse(
        id=rec.id,
        filename=rec.filename,
        prediction=rec.prediction,
        confidence=rec.confidence,
        probabilities={
            "NORMAL": rec.normal_probability,
            "PNEUMONIA": rec.pneumonia_probability,
        },
        original_image=orig_b64,
        heatmap_image=heat_b64,
        overlay_image=over_b64,
        explanation=rec.explanation or "",
        processing_time=rec.processing_time,
        timestamp=rec.created_at.isoformat() if rec.created_at else "",
    )


# ---------------------------------------------------------------------------
# DELETE /api/history/{prediction_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/api/history/{prediction_id}",
    summary="Delete a single scan record and stored files",
)
def delete_prediction(
    prediction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a prediction record and purge associated image files from disk."""
    rec = (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.id == prediction_id,
            PredictionHistory.user_id == current_user.id,
        )
        .first()
    )

    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan record not found or access denied.",
        )

    # Purge files
    for p in [rec.image_path, rec.heatmap_path, rec.overlay_path]:
        if p and Path(p).is_file():
            try:
                Path(p).unlink(missing_ok=True)
            except Exception:
                pass

    db.delete(rec)
    db.commit()
    return {"message": "Scan record and files successfully deleted.", "success": True}


# ---------------------------------------------------------------------------
# DELETE /api/history & /history
# ---------------------------------------------------------------------------

@router.delete(
    "/api/history",
    summary="Clear all scan history for current user",
)
@router.delete("/history")
def clear_all_history(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Clear scan records belonging to current authenticated user."""
    if not current_user:
        return {"message": "History cleared."}

    records = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.user_id == current_user.id)
        .all()
    )

    for rec in records:
        for p in [rec.image_path, rec.heatmap_path, rec.overlay_path]:
            if p and Path(p).is_file():
                try:
                    Path(p).unlink(missing_ok=True)
                except Exception:
                    pass
        db.delete(rec)

    db.commit()
    return {"message": "All scan records purged.", "success": True}


# ---------------------------------------------------------------------------
# GET /api/reports/{prediction_id}/pdf
# ---------------------------------------------------------------------------

@router.get(
    "/api/reports/{prediction_id}/pdf",
    summary="Generate and download publication-quality PDF analysis report",
)
def download_pdf_report(
    prediction_id: int,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate a clean, structured PDF report for a given prediction."""
    rec = (
        db.query(PredictionHistory)
        .filter(
            PredictionHistory.id == prediction_id,
            PredictionHistory.user_id == current_user.id,
        )
        .first()
    )

    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan record not found or unauthorized.",
        )

    pdf_buffer = generate_prediction_pdf(
        prediction_id=rec.id,
        filename=rec.filename,
        prediction=rec.prediction,
        confidence=rec.confidence,
        normal_prob=rec.normal_probability,
        pneumonia_prob=rec.pneumonia_probability,
        explanation=rec.explanation,
        processing_time=rec.processing_time,
        created_at=rec.created_at or datetime.now(timezone.utc),
        original_image_path=rec.image_path,
        heatmap_image_path=rec.heatmap_path,
        overlay_image_path=rec.overlay_path,
        model_version=rec.model_version or ml_service.model_version,
        model_checksum=ml_service.checksum,
        uncertainty_score=rec.uncertainty_score or 0.0,
        reliability_level=rec.reliability_level or "HIGH",
        validation_status=rec.validation_status or "PASSED",
    )

    # Log report download activity
    log_user_activity(db, current_user.id, "REPORT_DOWNLOADED", f"Downloaded PDF clinical report for scan #{rec.id} ({rec.filename})", request=request)

    download_name = f"PneumoDetect_Report_{rec.prediction}_{rec.id}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{download_name}"',
        },
    )


# ---------------------------------------------------------------------------
# GET /api/dashboard/stats
# ---------------------------------------------------------------------------

@router.get(
    "/api/dashboard/stats",
    response_model=DashboardStatsResponse,
    summary="Retrieve user-specific AI analytics dashboard data",
)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate scans, normal vs pneumonia ratios, and activity timeline for user."""
    base_q = db.query(PredictionHistory).filter(PredictionHistory.user_id == current_user.id)
    total_scans = base_q.count()
    normal_scans = base_q.filter(PredictionHistory.prediction == "NORMAL").count()
    pneumonia_scans = base_q.filter(PredictionHistory.prediction == "PNEUMONIA").count()

    recent_records = (
        base_q.order_by(desc(PredictionHistory.created_at))
        .limit(5)
        .all()
    )

    recent_scans = [
        HistoryItem(
            id=r.id,
            filename=r.filename,
            prediction=r.prediction,
            confidence=r.confidence,
            probabilities={"NORMAL": r.normal_probability, "PNEUMONIA": r.pneumonia_probability},
            processing_time=r.processing_time,
            timestamp=r.created_at.isoformat() if r.created_at else "",
        )
        for r in recent_records
    ]

    # Weekly trend (last 7 days)
    now = datetime.now(timezone.utc)
    weekly_trends: list[ActivityTrend] = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_name = day_date.strftime("%a")
        # Filter for day
        start_day = datetime(day_date.year, day_date.month, day_date.day, tzinfo=timezone.utc)
        end_day = start_day + timedelta(days=1)
        day_q = base_q.filter(
            PredictionHistory.created_at >= start_day,
            PredictionHistory.created_at < end_day,
        )
        t_count = day_q.count()
        n_count = day_q.filter(PredictionHistory.prediction == "NORMAL").count()
        p_count = day_q.filter(PredictionHistory.prediction == "PNEUMONIA").count()

        weekly_trends.append(
            ActivityTrend(
                label=day_name,
                total=t_count,
                normal=n_count,
                pneumonia=p_count,
            )
        )

    # Monthly trend (last 4 weeks)
    monthly_trends: list[ActivityTrend] = []
    for w in range(3, -1, -1):
        w_start = now - timedelta(weeks=w + 1)
        w_end = now - timedelta(weeks=w)
        w_q = base_q.filter(
            PredictionHistory.created_at >= w_start,
            PredictionHistory.created_at < w_end,
        )
        monthly_trends.append(
            ActivityTrend(
                label=f"Wk -{w}" if w > 0 else "This Wk",
                total=w_q.count(),
                normal=w_q.filter(PredictionHistory.prediction == "NORMAL").count(),
                pneumonia=w_q.filter(PredictionHistory.prediction == "PNEUMONIA").count(),
            )
        )

    # Model accuracy from evaluation metrics
    model_acc = 0.925

    return DashboardStatsResponse(
        total_scans=total_scans,
        normal_scans=normal_scans,
        pneumonia_scans=pneumonia_scans,
        model_accuracy=model_acc,
        recent_scans=recent_scans,
        weekly_activity=weekly_trends,
        monthly_activity=monthly_trends,
    )


# ---------------------------------------------------------------------------
# GET /api/user/activities
# ---------------------------------------------------------------------------

@router.get(
    "/api/user/activities",
    response_model=PaginatedActivitiesResponse,
    summary="Get user-isolated audit trail and activity history",
)
def get_user_activity_history(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve chronologically ordered audit activities exclusively for current user."""
    items, total = get_user_activities(db, current_user.id, page=page, per_page=per_page)
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1

    activity_items = [
        UserActivityItem(
            id=a.id,
            action=a.action,
            description=a.description,
            ip_address=a.ip_address,
            created_at=a.created_at.isoformat() if a.created_at else "",
        )
        for a in items
    ]

    return PaginatedActivitiesResponse(
        items=activity_items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


# ---------------------------------------------------------------------------
# GET /api/models/active
# ---------------------------------------------------------------------------

@router.get(
    "/api/models/active",
    response_model=ModelMetadataResponse,
    summary="Get active model metadata, version, and cryptographic checksum",
)
def get_active_model_metadata():
    """Return model versioning, weights SHA-256 hash, and configuration for reproducibility."""
    return ModelMetadataResponse(**ml_service.get_model_metadata())


# ---------------------------------------------------------------------------
# GET /api/models/comparison
# ---------------------------------------------------------------------------

@router.get(
    "/api/models/comparison",
    response_model=ModelComparisonResponse,
    summary="Empirical comparison between MobileNetV2 and EfficientNetB0",
)
def get_model_comparison_data():
    """Retrieve empirical test benchmark metrics comparing MobileNetV2 with EfficientNetB0."""
    import json
    comp_file = Path("results/evaluation/model_comparison.json")
    if not comp_file.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model comparison data not found. Please run ml/compare_models.py first.",
        )

    with open(comp_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    chart_file = Path("results/evaluation/model_comparison.png")
    chart_b64 = _load_image_file_as_base64(str(chart_file)) if chart_file.exists() else None
    data["comparison_chart_image"] = chart_b64

    return ModelComparisonResponse(**data)
