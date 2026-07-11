# Skopos

**Real-time log monitoring with AI-powered insights.**  
Self-hostable. EU-native. Built by one person.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-async-teal.svg)](https://fastapi.tiangolo.com/)
[![Postgres 16](https://img.shields.io/badge/Postgres-16-336791.svg)](https://www.postgresql.org/)

---

Skopos ingests logs from your application at 2,000+ events/sec, groups similar errors into patterns, and asks Claude to explain the likely root cause — before you go looking through raw logs.

Not a chatbot. Not a Datadog replacement. A focused tool for indie developers and small teams who want to know *what broke* without paying enterprise prices.

## Why it exists

Every log monitoring tool I looked at either treated AI as a marketing bullet (chat-with-your-logs, deep magical insights) or ignored it entirely.

I wanted to build the honest middle: log ingestion done well, and Claude doing exactly one job — reading a small set of clustered errors and telling you what probably went wrong. No agentic auto-fixes. No 300ms response requirements. Just useful analysis, cached per pattern, cheap enough to run.

This is a portfolio project. I built it to learn, to ship something end-to-end, and to have a real system I could point to when someone asks *"what have you built?"*.

## What it does

- **Ingest** logs at 2,000+ events/sec from any language (Python + JS SDKs available)
- **Cluster** similar errors into patterns via fingerprinting (level + service + message hash)
- **Analyze** each new pattern once with Claude Sonnet 4.6, cache the result
- **Alert** on threshold breaches (rule-based, no LLM in the alerting path)
- **Detect** anomalies statistically (no LLM either — cheap and fast)
- **Retain** logs configurably (7 to 180 days depending on tier)
- **Show** everything in a clean Next.js dashboard

## What it deliberately doesn't do

- **No chat with your logs.** The AI runs once per unique error pattern, not per query. This keeps costs bounded and predictable.
- **No auto-remediation.** Skopos suggests. Humans decide.
- **No Datadog/Sentry replacement.** No APM, no distributed tracing, no browser monitoring. Just logs, well-monitored.
- **No LLM in the alert path.** Alerts are threshold-based and fast. LLMs only run on new pattern analysis, out-of-band.
- **No unlimited data retention.** Even paying users get 180 days max.

## Architecture
The API and worker containers are separate processes. This lets us scale HTTP throughput (multiple gunicorn workers) independently from background workers (single instance, avoids Redis consumer name collisions).

## Tech stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | Next.js 15 · React 18 · Tailwind · TypeScript |
| Backend   | FastAPI · Python 3.12 · SQLAlchemy async      |
| Storage   | Postgres 16 · Redis 7                         |
| AI        | Anthropic Claude Sonnet 4.6                   |
| Deploy    | Docker Compose · Hetzner (Frankfurt, EU)      |
| SDKs      | Python (PyPI) · JavaScript (npm)              |

## Engineering highlights

The numbers below come from a production load test using `k6` against the real infrastructure (single Hetzner CPX21 instance, 4 GB RAM, 4 vCPU).

- **2,140 events/sec sustained ingest** at 0.00% error rate under 3-minute peak load
- **Bulk insert pattern worker**: 10× throughput improvement over one-commit-per-event baseline (248 → 2,140 eps)
- **Durability guarantees**: PEL recovery + XAUTOCLAIM ensures at-least-once delivery even if the worker crashes mid-batch
- **Shared Redis connection pool**: replaced per-request client lifecycle, cut p95 latency from 8.8s to 1.5s under stress
- **user.plan cache**: 60-second Redis TTL eliminated a per-request DB roundtrip, dropped p50 latency by 65%
- **Worker container separation**: fixed a race condition where two gunicorn workers competed for the same Redis consumer name
- **Full production hardening**: rate limits (nginx zones + app-level), retry with exponential backoff on Anthropic 429/5xx, PostgreSQL tuned for the workload, Redis capped at 512 MB with allkeys-lru eviction

## Getting started

You need Docker Compose. Everything else runs in containers.

```bash
# 1. Clone
git clone https://github.com/matti07986/skopos.git
cd skopos

# 2. Configure
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your own values:
#   - ANTHROPIC_API_KEY (required for AI insights)
#   - DATABASE_URL, REDIS_URL (defaults work with docker-compose)
#   - JWT_SECRET_KEY (generate with: openssl rand -hex 32)

# 3. Run
docker compose -f infra/docker-compose.yml up -d

# 4. Open
open http://localhost:3000
```

First user to register becomes admin.

## Repository layout
## Status

**Portfolio project.** Not accepting paying users, no SLA, no support commitments.

The code is here if you want to:
- Study a full-stack async Python + Next.js system
- Self-host log monitoring for a personal project
- Fork and build something similar

If you want to reach out about this project (feedback, questions, hiring), open an issue or contact me directly.

## License

MIT. See [LICENSE](LICENSE).

## Author

Built by [Mattia Garello](https://github.com/matti07986) — solo dev, still finishing university.

Live demo available on request.
