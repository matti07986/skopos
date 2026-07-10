import uuid
from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.log_event import LogEvent, AiInsight
from app.models.project import Project
from app.utils.project_access import check_project_access, get_user_project_ids
from app.utils.pattern_ids import get_pattern_ids_for_projects

router = APIRouter()


class LogEventOut(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    timestamp: datetime
    level: str
    message: str
    service: str
    event_metadata: dict
    fingerprint: Optional[str]

    model_config = {"from_attributes": True}


class AiInsightOut(BaseModel):
    id: uuid.UUID
    pattern_id: uuid.UUID
    root_cause: str
    suggested_fix: str
    confidence: float
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("/logs", response_model=list[LogEventOut])
async def list_logs(
    level: Optional[Literal["ERROR", "WARN", "INFO", "DEBUG"]] = None,
    service: Optional[str] = None,
    project_id: Optional[uuid.UUID] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Project IDs accessible to the user (owned + team-shared)
    project_ids = await get_user_project_ids(user, db)

    if not project_ids:
        return []

    # Filter by specific project_id if provided and accessible
    if project_id and project_id in project_ids:
        q = select(LogEvent).where(LogEvent.project_id == project_id)
    else:
        q = select(LogEvent).where(LogEvent.project_id.in_(project_ids))
    if level:
        q = q.where(LogEvent.level == level)
    if service:
        q = q.where(LogEvent.service == service)
    q = q.order_by(LogEvent.timestamp.desc()).limit(limit).offset(offset)

    result = await db.execute(q)
    return result.scalars().all()


@router.get("/insights", response_model=list[AiInsightOut])
async def list_insights(
    limit: int = Query(20, ge=1, le=100),
    project_id: Optional[uuid.UUID] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Project IDs accessible to the user (owned + team-shared)
    project_ids = await get_user_project_ids(user, db)

    if not project_ids:
        return []

    # Filter by specific project_id if provided and accessible
    if project_id and project_id in project_ids:
        active_ids = [project_id]
    else:
        active_ids = list(project_ids)

    # Pattern IDs derived from log fingerprints (shared helper)
    pattern_ids = await get_pattern_ids_for_projects(active_ids, db)

    if not pattern_ids:
        return []

    q = (
        select(AiInsight)
        .where(AiInsight.pattern_id.in_(pattern_ids))
        .order_by(AiInsight.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(q)
    return result.scalars().all()


import csv
import io
import json as json_lib
from datetime import datetime, timezone
from fastapi.responses import StreamingResponse

@router.get("/logs/export")
async def export_logs(
    project_id: uuid.UUID,
    format: Literal["json", "csv", "pdf"] = Query("json"),
    level: Optional[Literal["ERROR", "WARN", "INFO", "DEBUG"]] = None,
    limit: int = Query(10000, ge=1, le=50000),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify access (raises 404 if not found, 403 if user has no access)
    project = await check_project_access(project_id, user, db)

    # Recupera i log
    q = select(LogEvent).where(LogEvent.project_id == project_id)
    if level:
        q = q.where(LogEvent.level == level)
    q = q.order_by(LogEvent.timestamp.desc()).limit(limit if format != "pdf" else 500)
    logs = (await db.execute(q)).scalars().all()

    filename = f"skopos-{project.name}-logs"

    if format == "json":
        data = [
            {
                "id": str(l.id),
                "timestamp": l.timestamp.isoformat(),
                "level": l.level,
                "message": l.message,
                "service": l.service,
                "metadata": l.event_metadata,
            }
            for l in logs
        ]
        content = json_lib.dumps(data, indent=2)
        return StreamingResponse(
            io.BytesIO(content.encode()),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{filename}.json"'},
        )
    elif format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["id", "timestamp", "level", "message", "service"])
        for l in logs:
            writer.writerow([str(l.id), l.timestamp.isoformat(), l.level, l.message, l.service])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}.csv"'},
        )
    else:
        # PDF Report — Skopos branded
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import mm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
        from reportlab.lib.enums import TA_LEFT, TA_RIGHT

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            leftMargin=18*mm, rightMargin=18*mm,
            topMargin=18*mm, bottomMargin=18*mm,
            title=f"{project.name} — Log Report",
            author="Skopos",
        )

        # Stili
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("Title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=22, textColor=colors.HexColor("#0d0d0d"), spaceAfter=4, alignment=TA_LEFT)
        subtitle_style = ParagraphStyle("Sub", parent=styles["Normal"], fontName="Helvetica", fontSize=10, textColor=colors.HexColor("#6e7681"), spaceAfter=20)
        h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12, textColor=colors.HexColor("#0d0d0d"), spaceBefore=14, spaceAfter=8)
        meta_label = ParagraphStyle("ML", parent=styles["Normal"], fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#6e7681"))
        meta_value = ParagraphStyle("MV", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#0d0d0d"))
        brand_style = ParagraphStyle("Brand", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=11, textColor=colors.HexColor("#0d0d0d"), alignment=TA_RIGHT)

        story = []

        # Header con logo (testo) a destra
        header_table = Table([[
            Paragraph(f"<font color='#4ade80'>●</font> <b>skopos</b>", brand_style),
        ]], colWidths=[170*mm])
        header_table.setStyle(TableStyle([
            ("ALIGN", (0,0), (-1,-1), "RIGHT"),
            ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 4*mm))

        # Divider verde
        divider = Table([[""]], colWidths=[170*mm], rowHeights=[1.5])
        divider.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#4ade80"))]))
        story.append(divider)
        story.append(Spacer(1, 10*mm))

        # Titolo
        story.append(Paragraph(f"Log Report", title_style))
        story.append(Paragraph(f"Project: <b>{project.name}</b>", subtitle_style))

        # Metadata box
        now = datetime.now(timezone.utc)
        meta_data = [
            [Paragraph("GENERATED", meta_label), Paragraph(now.strftime("%Y-%m-%d %H:%M UTC"), meta_value)],
            [Paragraph("PROJECT", meta_label), Paragraph(project.name, meta_value)],
            [Paragraph("FILTER", meta_label), Paragraph(level or "All levels", meta_value)],
            [Paragraph("TOTAL EVENTS", meta_label), Paragraph(str(len(logs)), meta_value)],
        ]
        meta_table = Table(meta_data, colWidths=[40*mm, 130*mm])
        meta_table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#f6f8fa")),
            ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#d0d7de")),
            ("LINEBELOW", (0,0), (-1,-2), 0.3, colors.HexColor("#d0d7de")),
            ("LEFTPADDING", (0,0), (-1,-1), 12),
            ("RIGHTPADDING", (0,0), (-1,-1), 12),
            ("TOPPADDING", (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 8*mm))

        # Statistiche per livello
        story.append(Paragraph("Summary by Level", h2))
        level_counts = {"ERROR": 0, "WARN": 0, "INFO": 0, "DEBUG": 0}
        for l in logs:
            if l.level in level_counts:
                level_counts[l.level] += 1
        level_colors_map = {
            "ERROR": colors.HexColor("#f87171"),
            "WARN": colors.HexColor("#facc15"),
            "INFO": colors.HexColor("#4ade80"),
            "DEBUG": colors.HexColor("#a855f7"),
        }
        stats_data = [[Paragraph(f"<b>{lvl}</b>", meta_value), Paragraph(str(cnt), meta_value)] for lvl, cnt in level_counts.items()]
        stats_table = Table(stats_data, colWidths=[40*mm, 130*mm])
        style_rows = [
            ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#ffffff")),
            ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#d0d7de")),
            ("LINEBELOW", (0,0), (-1,-2), 0.3, colors.HexColor("#eaeef2")),
            ("LEFTPADDING", (0,0), (-1,-1), 12),
            ("TOPPADDING", (0,0), (-1,-1), 6),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ]
        for i, lvl in enumerate(["ERROR", "WARN", "INFO", "DEBUG"]):
            style_rows.append(("TEXTCOLOR", (0,i), (0,i), level_colors_map[lvl]))
        stats_table.setStyle(TableStyle(style_rows))
        story.append(stats_table)
        story.append(Spacer(1, 8*mm))

        # Eventi
        story.append(Paragraph(f"Events ({len(logs)})", h2))
        if not logs:
            story.append(Paragraph("No logs in this range.", styles["Normal"]))
        else:
            event_rows = [["Timestamp", "Level", "Service", "Message"]]
            for l in logs:
                msg = (l.message or "")[:140]
                event_rows.append([
                    l.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                    l.level,
                    l.service or "-",
                    msg,
                ])
            events_table = Table(event_rows, colWidths=[32*mm, 16*mm, 28*mm, 94*mm], repeatRows=1)
            ev_style = [
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#0d0d0d")),
                ("TEXTCOLOR", (0,0), (-1,0), colors.white),
                ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
                ("FONTSIZE", (0,0), (-1,-1), 7.5),
                ("ALIGN", (0,0), (-1,-1), "LEFT"),
                ("VALIGN", (0,0), (-1,-1), "TOP"),
                ("LEFTPADDING", (0,0), (-1,-1), 8),
                ("RIGHTPADDING", (0,0), (-1,-1), 8),
                ("TOPPADDING", (0,0), (-1,-1), 6),
                ("BOTTOMPADDING", (0,0), (-1,-1), 6),
                ("LINEBELOW", (0,1), (-1,-1), 0.2, colors.HexColor("#eaeef2")),
                ("FONTNAME", (3,1), (3,-1), "Courier"),
            ]
            for i, l in enumerate(logs, start=1):
                ev_style.append(("TEXTCOLOR", (1,i), (1,i), level_colors_map.get(l.level, colors.black)))
                ev_style.append(("FONTNAME", (1,i), (1,i), "Helvetica-Bold"))
            events_table.setStyle(TableStyle(ev_style))
            story.append(events_table)

        # Footer
        def footer(canvas, doc):
            canvas.saveState()
            canvas.setFont("Helvetica", 7)
            canvas.setFillColor(colors.HexColor("#8b949e"))
            canvas.drawString(18*mm, 10*mm, f"Generated by Skopos · skopos.ink")
            canvas.drawRightString(192*mm, 10*mm, f"Page {doc.page}")
            canvas.restoreState()

        doc.build(story, onFirstPage=footer, onLaterPages=footer)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}.pdf"'},
        )
