from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx

from app.deps import get_current_user
from app.models.user import User
from app.config import settings

router = APIRouter()

class AiAnalyzeRequest(BaseModel):
    prompt: str
    max_tokens: int = 500

class AiAnalyzeResponse(BaseModel):
    text: str

@router.post("/ai/analyze", response_model=AiAnalyzeResponse)
async def ai_analyze(
    req: AiAnalyzeRequest,
    user: User = Depends(get_current_user),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="AI not available")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-haiku-4-5",
                "max_tokens": req.max_tokens,
                "messages": [{"role": "user", "content": req.prompt}],
            },
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="AI service error")

    data = resp.json()
    text = data.get("content", [{}])[0].get("text", "Analisi non disponibile.")
    return AiAnalyzeResponse(text=text)
