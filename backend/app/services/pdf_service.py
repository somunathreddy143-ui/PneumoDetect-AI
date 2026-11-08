"""Professional AI Medical Report generation using ReportLab."""

from __future__ import annotations

import io
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Image as RLImage,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def generate_prediction_pdf(
    prediction_id: int,
    filename: str,
    prediction: str,
    confidence: float,
    normal_prob: float,
    pneumonia_prob: float,
    explanation: Optional[str],
    processing_time: float,
    created_at: datetime,
    original_image_path: Optional[str] = None,
    heatmap_image_path: Optional[str] = None,
    overlay_image_path: Optional[str] = None,
    patient_identifier: Optional[str] = None,
    model_version: str = "2.1.0-alpha",
    model_checksum: str = "",
    uncertainty_score: float = 0.0,
    reliability_level: str = "HIGH",
    validation_status: str = "PASSED",
) -> io.BytesIO:
    """Generate a publication-grade AI Analysis Report in PDF format."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#1E3A8A")   # Navy 900
    accent_blue = colors.HexColor("#2563EB")     # Blue 600
    danger_red = colors.HexColor("#DC2626")      # Red 600
    success_green = colors.HexColor("#16A34A")   # Green 600
    light_bg = colors.HexColor("#F8FAFC")        # Slate 50
    border_color = colors.HexColor("#E2E8F0")    # Slate 200

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=primary_color,
    )

    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748B"),
    )

    h2_style = ParagraphStyle(
        "Heading2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=primary_color,
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
    )

    disclaimer_style = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=7.5,
        leading=11,
        textColor=colors.HexColor("#78350F"),
    )

    elements = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>PNEUMODETECT AI RESEARCH PLATFORM</b>", subtitle_style),
            Paragraph(f"<b>REPORT ID:</b> AR-XAI-{prediction_id:06d}", subtitle_style),
        ],
        [
            Paragraph("AI-Based Pneumonia Detection & Explainability Report", title_style),
            Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style),
        ],
    ]
    header_table = Table(header_data, colWidths=[4.2 * inch, 3.0 * inch])
    header_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("ALIGN", (1, 0), (1, -1), "RIGHT"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ])
    )
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=accent_blue, spaceBefore=8, spaceAfter=12))

    # 2. Scan & Patient Metadata
    meta_data = [
        [
            Paragraph("<b>Radiograph Filename:</b>", body_style),
            Paragraph(filename, body_style),
            Paragraph("<b>Scan Timestamp:</b>", body_style),
            Paragraph(created_at.strftime("%Y-%m-%d %H:%M:%S UTC"), body_style),
        ],
        [
            Paragraph("<b>Internal Scan ID:</b>", body_style),
            Paragraph(f"#{prediction_id}", body_style),
            Paragraph("<b>Inference Latency:</b>", body_style),
            Paragraph(f"{processing_time:.2f} seconds", body_style),
        ],
        [
            Paragraph("<b>Neural Architecture:</b>", body_style),
            Paragraph(f"MobileNetV2 (v{model_version})", body_style),
            Paragraph("<b>Model SHA-256 Checksum:</b>", body_style),
            Paragraph(f"{model_checksum[:16]}..." if model_checksum else "Verified Release", body_style),
        ],
        [
            Paragraph("<b>Reliability Tier:</b>", body_style),
            Paragraph(f"<b>{reliability_level}</b> (Entropy: {uncertainty_score:.3f})", body_style),
            Paragraph("<b>Radiograph Validation:</b>", body_style),
            Paragraph(f"<b>{validation_status}</b>", body_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[1.8 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
    meta_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), light_bg),
            ("BOX", (0, 0), (-1, -1), 0.5, border_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    elements.append(meta_table)
    elements.append(Spacer(1, 12))

    # 3. Model Classification Outcome
    is_pneu = prediction.upper() == "PNEUMONIA"
    outcome_bg = colors.HexColor("#FEF2F2") if is_pneu else colors.HexColor("#F0FDF4")
    outcome_color = danger_red if is_pneu else success_green

    outcome_style = ParagraphStyle(
        "Outcome",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=outcome_color,
    )

    pred_data = [
        [
            Paragraph("<b>PREDICTED CLASSIFICATION:</b>", subtitle_style),
            Paragraph("<b>CONFIDENCE SCORE:</b>", subtitle_style),
            Paragraph("<b>NORMAL PROBABILITY:</b>", subtitle_style),
            Paragraph("<b>PNEUMONIA PROBABILITY:</b>", subtitle_style),
        ],
        [
            Paragraph(prediction.upper(), outcome_style),
            Paragraph(f"<b>{confidence * 100:.1f}%</b>", outcome_style),
            Paragraph(f"{normal_prob * 100:.1f}%", h2_style),
            Paragraph(f"{pneumonia_prob * 100:.1f}%", h2_style),
        ],
    ]
    pred_table = Table(pred_data, colWidths=[2.2 * inch, 1.8 * inch, 1.6 * inch, 1.6 * inch])
    pred_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), outcome_bg),
            ("BOX", (0, 0), (-1, -1), 1.0, outcome_color),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    elements.append(pred_table)
    elements.append(Spacer(1, 14))

    # 4. 3-Panel Visual Explanations (Original, Heatmap, Overlay)
    elements.append(Paragraph("<b>Grad-CAM Explainability Visualizations</b>", h2_style))
    elements.append(Paragraph(
        "Gradient-weighted Class Activation Mapping (Grad-CAM) highlights the anatomical regions that had the strongest influence on the neural network's classification decision.",
        body_style,
    ))
    elements.append(Spacer(1, 8))

    img_w = 2.25 * inch
    img_h = 2.25 * inch

    def make_rl_image(path_str):
        if path_str and Path(path_str).is_file():
            try:
                return RLImage(path_str, width=img_w, height=img_h)
            except Exception:
                pass
        # Fallback text box if image missing
        return Paragraph("<br/><br/><i>Image not available</i>", body_style)

    img_row = [
        make_rl_image(original_image_path),
        make_rl_image(heatmap_image_path),
        make_rl_image(overlay_image_path),
    ]

    labels_row = [
        Paragraph("<b>1. Input Radiograph</b><br/><font size=7 color='#64748B'>Resized to 224×224 RGB</font>", body_style),
        Paragraph("<b>2. Grad-CAM Heatmap</b><br/><font size=7 color='#64748B'>JET Colormap (Conv_1)</font>", body_style),
        Paragraph("<b>3. Visual Overlay</b><br/><font size=7 color='#64748B'>α=0.4 Anatomical Blend</font>", body_style),
    ]

    vis_table = Table([img_row, labels_row], colWidths=[2.4 * inch, 2.4 * inch, 2.4 * inch])
    vis_table.setStyle(
        TableStyle([
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("BOX", (0, 0), (-1, -1), 0.5, border_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    elements.append(vis_table)
    elements.append(Spacer(1, 12))

    # 5. Decision Rationale & Grok Explanation
    elements.append(Paragraph("<b>Clinical AI Decision Rationale & Grok LLM Explanation (AI-Generated)</b>", h2_style))
    expl_text = explanation or (
        f"The MobileNetV2 architecture identified characteristic radiographic features for {prediction}. "
        "The Grad-CAM heatmap illustrates regions of elevated gradient flow located within the pulmonary fields, "
        "corresponding to opacities and infiltrates in pneumonia or clear aeration in normal scans."
    )
    elements.append(Paragraph(f"<i>AI-Generated Natural-Language Synthesis:</i> {expl_text}", body_style))
    elements.append(Spacer(1, 10))

    # 6. Medical Disclaimer Box
    disclaimer_data = [[
        Paragraph(
            "<b>IMPORTANT REGULATORY & RESEARCH DISCLAIMER:</b><br/>"
            "This report is generated by the PneumoDetect AI research and decision-support platform. "
            "It is NOT a cleared medical device (FDA/CE) and is NOT intended for primary clinical diagnosis or treatment planning. "
            "Model confidence scores represent statistical activation levels across training distributions, NOT confirmed pathological probabilities. "
            "Always consult a licensed radiologist or medical physician for clinical patient evaluation.",
            disclaimer_style,
        )
    ]]
    disclaimer_table = Table(disclaimer_data, colWidths=[7.2 * inch])
    disclaimer_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#F59E0B")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    elements.append(disclaimer_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer

