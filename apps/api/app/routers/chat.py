import asyncio
import logging
import uuid
from datetime import datetime, timezone, date
from typing import List, Optional, Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.log_event import LogEvent, AiInsight
from app.utils.project_access import check_project_access
from app.utils.pattern_ids import get_pattern_ids_for_projects
from app.models.chat_usage import ChatUsage
from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    project_id: uuid.UUID
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    text: str
    usage: dict


class ChatUsageInfo(BaseModel):
    plan: str
    messages_today: int
    messages_limit_per_day: int
    tokens_this_month: int
    tokens_limit_per_month: int


def _get_plan_for(user: User) -> str:
    return user.plan if user.plan else "starter"


async def _get_usage(db: AsyncSession, user: User) -> tuple[int, int]:
    today = datetime.now(timezone.utc).date()
    month = datetime.now(timezone.utc).strftime("%Y-%m")

    msg_today = (await db.execute(
        select(func.coalesce(func.sum(ChatUsage.message_count), 0))
        .where(ChatUsage.user_id == user.id, ChatUsage.day == today)
    )).scalar() or 0

    tokens_month = (await db.execute(
        select(func.coalesce(func.sum(ChatUsage.input_tokens + ChatUsage.output_tokens), 0))
        .where(ChatUsage.user_id == user.id, ChatUsage.month == month)
    )).scalar() or 0

    return int(msg_today), int(tokens_month)


@router.get("/ai/chat/usage", response_model=ChatUsageInfo)
async def chat_usage(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plan = _get_plan_for(user)
    msg_today, tokens_month = await _get_usage(db, user)
    return ChatUsageInfo(
        plan=plan,
        messages_today=msg_today,
        messages_limit_per_day=settings.plan_chat_msg_per_day.get(plan, 3),
        tokens_this_month=tokens_month,
        tokens_limit_per_month=settings.plan_chat_tokens_per_month.get(plan, 50_000),
    )


@router.post("/ai/chat", response_model=ChatResponse)
async def ai_chat(
    req: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="AI not available")

    # Verify project access (team-aware: 404 if not found, 403 if no access)
    project = await check_project_access(req.project_id, user, db)

    # Verifica limiti
    plan = _get_plan_for(user)
    msg_today, tokens_month = await _get_usage(db, user)
    msg_limit = settings.plan_chat_msg_per_day.get(plan, 3)
    tok_limit = settings.plan_chat_tokens_per_month.get(plan, 50_000)

    if msg_today >= msg_limit:
        raise HTTPException(status_code=429, detail=f"Daily message limit reached ({msg_limit} per day on {plan} plan). Upgrade or wait until tomorrow.")
    if tokens_month >= tok_limit:
        raise HTTPException(status_code=429, detail=f"Monthly token limit reached on {plan} plan. Upgrade your plan to continue.")

    # Recupera contesto progetto
    logs_res = await db.execute(
        select(LogEvent)
        .where(LogEvent.project_id == project.id)
        .order_by(LogEvent.timestamp.desc())
        .limit(50)
    )
    logs = logs_res.scalars().all()

    # AiInsight lookup via pattern_id (canonical), shared with logs.py
    pattern_ids = await get_pattern_ids_for_projects([project.id], db)
    if pattern_ids:
        insights_res = await db.execute(
            select(AiInsight)
            .where(AiInsight.pattern_id.in_(pattern_ids))
            .order_by(AiInsight.created_at.desc())
            .limit(20)
        )
        insights = insights_res.scalars().all()
    else:
        insights = []

    # Statistiche aggregate
    error_count = sum(1 for l in logs if l.level == "ERROR")
    warn_count = sum(1 for l in logs if l.level == "WARN")
    services = {}
    for l in logs:
        services[l.service] = services.get(l.service, 0) + 1
    top_services = sorted(services.items(), key=lambda x: -x[1])[:5]

    # System prompt con contesto (cacheable)
    logs_text = "\n".join(
        f"[{l.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {l.level} {l.service}: {l.message[:200]}"
        for l in logs
    )
    insights_text = "\n".join(
        f"- {i.root_cause[:150]} → {i.suggested_fix[:200]}"
        for i in insights
    ) if insights else "(nessun insight disponibile)"
    top_svc_text = ", ".join(f"{s} ({c})" for s, c in top_services) or "(nessun servizio)"

    system_prompt = f"""Sei l'assistente AI di Skopos, un SaaS di log monitoring. Aiuti l'utente ad analizzare i log, capire errori, e trovare soluzioni.

PROGETTO: {project.name}
STATISTICHE (ultimi 50 log):
- Errori: {error_count}
- Warning: {warn_count}
- Top services: {top_svc_text}

LOG RECENTI:
{logs_text}

INSIGHTS AI PRECEDENTI:
{insights_text}

REGOLE:
- Rispondi in italiano in modo conciso e tecnico
- Cita timestamp ed eventi specifici quando rilevante
- Suggerisci comandi/codice quando utile (in code block)
- Se l'utente chiede cose non legate ai log/monitoring del progetto, riportalo gentilmente al topic
- NON inventare dati che non vedi sopra"""

    # Costruisci messaggi (system + history)
    anthropic_messages = []
    for m in req.messages:
        anthropic_messages.append({"role": m.role, "content": m.content})

    # Chiamata Anthropic con prompt caching sul system prompt + retry/backoff.
    # Resilience strategy (same philosophy as claude_service.analyze_logs):
    # - 5 attempts, exponential backoff 1s → 2s → 4s → 8s → 16s
    # - Retry on 429 (rate limit), 5xx, connection errors, timeouts
    # - Hard fail on 4xx ≠ 429 (auth/permission problems aren't transient)
    # - Final exhaustion → 503 Service Unavailable with Retry-After hint,
    #   not a 500 — the client can sensibly retry the user's message.
    payload = {
        "model": "claude-sonnet-4-6",
        "max_tokens": settings.chat_max_output_tokens,
        "system": [
            {
                "type": "text",
                "text": system_prompt,
                "cache_control": {"type": "ephemeral"},
            }
        ],
        "messages": anthropic_messages,
    }
    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    MAX_ATTEMPTS = 5
    BASE_DELAY = 1.0
    MAX_DELAY = 30.0
    last_status: int | None = None
    last_body: str = ""

    async with httpx.AsyncClient(timeout=60.0) as client:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                resp = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json=payload,
                )
            except (httpx.ConnectError, httpx.ReadTimeout, httpx.WriteTimeout) as e:
                if attempt == MAX_ATTEMPTS:
                    logger.error("Anthropic chat unreachable after %d attempts: %s", attempt, e)
                    raise HTTPException(
                        status_code=503,
                        detail="AI service temporarily unavailable. Please retry in a few seconds.",
                        headers={"Retry-After": "5"},
                    )
                delay = min(BASE_DELAY * (2 ** (attempt - 1)), MAX_DELAY)
                logger.warning("Anthropic chat %s on attempt %d/%d, retrying in %.1fs",
                               type(e).__name__, attempt, MAX_ATTEMPTS, delay)
                await asyncio.sleep(delay)
                continue

            last_status = resp.status_code
            last_body = resp.text[:200] if resp.text else ""

            if resp.status_code == 200:
                break

            # 4xx ≠ 429 → not transient, fail fast
            if 400 <= resp.status_code < 500 and resp.status_code != 429:
                logger.error("Anthropic chat non-retriable %d: %s", resp.status_code, last_body)
                raise HTTPException(
                    status_code=502,
                    detail=f"AI service error: {last_body}",
                )

            # 429 or 5xx → retry with backoff
            if attempt == MAX_ATTEMPTS:
                logger.error("Anthropic chat exhausted retries (last status=%d): %s",
                             resp.status_code, last_body)
                raise HTTPException(
                    status_code=503,
                    detail="AI service is busy. Please retry in a few seconds.",
                    headers={"Retry-After": "5"},
                )
            delay = min(BASE_DELAY * (2 ** (attempt - 1)), MAX_DELAY)
            logger.warning("Anthropic chat status %d on attempt %d/%d, retrying in %.1fs",
                           resp.status_code, attempt, MAX_ATTEMPTS, delay)
            await asyncio.sleep(delay)

    data = resp.json()
    text = data.get("content", [{}])[0].get("text", "Errore nella risposta.")
    usage_data = data.get("usage", {})
    input_tokens = usage_data.get("input_tokens", 0) + usage_data.get("cache_read_input_tokens", 0) + usage_data.get("cache_creation_input_tokens", 0)
    output_tokens = usage_data.get("output_tokens", 0)

    # Aggiorna usage
    today = datetime.now(timezone.utc).date()
    month = datetime.now(timezone.utc).strftime("%Y-%m")

    existing_res = await db.execute(
        select(ChatUsage).where(
            and_(
                ChatUsage.user_id == user.id,
                ChatUsage.project_id == project.id,
                ChatUsage.day == today,
            )
        )
    )
    existing = existing_res.scalar_one_or_none()
    if existing:
        existing.input_tokens += input_tokens
        existing.output_tokens += output_tokens
        existing.message_count += 1
    else:
        db.add(ChatUsage(
            user_id=user.id,
            project_id=project.id,
            day=today,
            month=month,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            message_count=1,
        ))
    await db.commit()

    return ChatResponse(text=text, usage={
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "messages_today": msg_today + 1,
        "messages_limit_per_day": msg_limit,
    })
