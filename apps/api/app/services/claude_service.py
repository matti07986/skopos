"""
Anthropic API client with production-grade resilience.

Adds explicit timeouts, exponential backoff retry on transient errors,
and graceful fallback on exhaustion (returns a degraded InsightResult
instead of propagating a 500 to the user).

Retries on:
- 429 Too Many Requests (rate limit hit)
- 5xx Server Errors (Anthropic upstream issue)
- Connection / timeout errors (network glitch)

Does NOT retry on:
- 4xx (other than 429): client error, no point retrying
- ValueError / JSONDecodeError: response shape problem, not transient
"""
import asyncio
import json
import logging
from typing import TypedDict

import anthropic

from app.config import settings

logger = logging.getLogger(__name__)

# Module-level client. Built once, reused. Timeout caps a single call at 30s
# regardless of SDK defaults so we never block a worker indefinitely.
_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(
            api_key=settings.anthropic_api_key,
            timeout=30.0,
        )
    return _client


# Retry tuning. 5 attempts × max 30s wait = up to ~62s total wall time
# in the worst case (1+2+4+8+16+request time). That's tolerable for a
# background AI worker and acceptable for an interactive chat endpoint
# under load — better than failing immediately.
MAX_ATTEMPTS = 5
BASE_DELAY = 1.0
MAX_DELAY = 30.0

# Exceptions worth retrying. These are all transient in nature: rate limits
# reset, upstream errors recover, connections re-establish.
RETRIABLE_EXCEPTIONS = (
    anthropic.RateLimitError,         # 429
    anthropic.APIConnectionError,     # network issue
    anthropic.APITimeoutError,        # request took too long
    anthropic.InternalServerError,    # 500
    anthropic.APIStatusError,         # 5xx generic catch
)


async def _call_with_retry(**kwargs):
    """
    Wrap a single messages.create() call with exponential backoff.
    Raises the last exception if all attempts fail (caller handles fallback).
    """
    last_exc: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            return await _get_client().messages.create(**kwargs)
        except RETRIABLE_EXCEPTIONS as e:
            last_exc = e
            # Don't retry 4xx that aren't 429 (auth failure, bad request, etc.)
            if isinstance(e, anthropic.APIStatusError) and 400 <= e.status_code < 500 and e.status_code != 429:
                logger.error("Anthropic non-retriable 4xx (status=%s): %s", e.status_code, e)
                raise
            if attempt == MAX_ATTEMPTS:
                logger.error("Anthropic retry exhausted after %d attempts: %s", attempt, e)
                raise
            delay = min(BASE_DELAY * (2 ** (attempt - 1)), MAX_DELAY)
            logger.warning(
                "Anthropic %s on attempt %d/%d, retrying in %.1fs",
                type(e).__name__, attempt, MAX_ATTEMPTS, delay,
            )
            await asyncio.sleep(delay)
    # Should be unreachable given the raise above, but type-checker happy.
    raise last_exc  # type: ignore[misc]


SYSTEM_PROMPT = """Sei un esperto di debugging. Analizza questi log e identifica:
1. La causa principale dell'errore
2. Il servizio/file responsabile
3. Un fix concreto con esempio di codice

Rispondi SOLO in JSON con campi: root_cause, file_hint, suggested_fix, confidence.
Il campo suggested_fix deve sempre contenere una diff leggibile, non solo testo."""


class InsightResult(TypedDict):
    root_cause: str
    file_hint: str
    suggested_fix: str
    confidence: float


def _fallback_result() -> InsightResult:
    """
    Returned when Anthropic is unreachable after all retries. The user sees
    a polite, actionable message instead of a 500 error from the API.
    """
    return InsightResult(
        root_cause="AI analysis temporarily unavailable",
        file_hint="",
        suggested_fix="The AI service is experiencing high load. Please retry in a few seconds.",
        confidence=0.0,
    )


async def analyze_logs(log_messages: list[str]) -> InsightResult:
    formatted = "\n".join(f"- {m}" for m in log_messages[:50])

    try:
        message = await _call_with_retry(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=[{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": f"Log da analizzare:\n{formatted}"}],
        )
    except (anthropic.APIError, asyncio.TimeoutError) as e:
        logger.error("Anthropic call failed permanently: %s", e)
        return _fallback_result()

    raw = message.content[0].text.strip()

    # Strip markdown fences if the model wrapped its JSON
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        result: InsightResult = json.loads(raw)
        result["confidence"] = float(result.get("confidence", 0.5))
        return result
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        logger.error("Anthropic returned unparseable response: %s | raw=%r", e, raw[:200])
        return _fallback_result()
