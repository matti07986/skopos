# Skopos — CV, LinkedIn, and application templates

Ready-to-use text for every place you might reference Skopos. Copy the version
that fits the platform (character limits noted where relevant).

---

## LinkedIn — Featured Project

**Section:** Featured (top of profile, first thing recruiters see)

**Title:**
Skopos — Real-time log monitoring with AI-powered insights

**Description (~200 words, LinkedIn shows about the first 150):**

Solo-built log monitoring platform. FastAPI + Next.js + Postgres + Redis, deployed on Hetzner. Anthropic Claude Sonnet 4.6 analyzes error patterns automatically — no chat interface, one AI call per unique pattern, cached.

Load-tested at 2,140 events/sec sustained with 0% error rate on a single 4GB VM. Bulk insert worker with PEL recovery for at-least-once durability. Full production hardening (rate limits, retry with backoff, shared connection pools, worker container separation).

Public source: github.com/matti07986/skopos

**Link:** https://github.com/matti07986/skopos
**Image:** (optional) upload a dashboard screenshot

---

## LinkedIn — Experience entry

**Company:** Skopos (self-employed / side project)
**Title:** Founder & Solo Developer
**Employment type:** Self-employed
**Location:** Remote
**Start date:** May 2026
**End date:** Present (or set to end when you close the project)

**Description:**

Designed, built, and shipped Skopos — a self-hostable log monitoring platform with AI-powered pattern analysis.

Highlights:
- Full-stack async system: FastAPI backend, Next.js 15 frontend, Postgres 16 + Redis 7 storage
- Load-tested to 2,140 events/sec sustained with 0% error rate on a single Hetzner VM
- Bulk insert pattern worker: 10× throughput improvement over one-commit-per-event baseline
- At-least-once durability with PEL recovery and XAUTOCLAIM for crash resilience
- Anthropic Claude integration for automatic error pattern analysis (not a chat, one-shot cached)
- Full production hardening: rate limits, retry with exponential backoff, shared connection pools, PostgreSQL tuning, gunicorn worker separation
- Python and JavaScript SDKs published on PyPI and npm

Stack: Python 3.12, TypeScript, FastAPI, Next.js, Postgres, Redis, Docker, Anthropic API

Public source: github.com/matti07986/skopos

---

## LinkedIn — Headline (varies by intent)

**If job hunting (backend/full-stack focus):**
Full-stack developer · Built Skopos (2K eps log monitoring platform) · Python + TypeScript

**If freelance:**
Full-stack developer for hire · Python, FastAPI, Next.js · Portfolio: Skopos

**If networking / general:**
Building things solo · Skopos (log monitoring + AI) · Studying economics @ UNINETTUNO

---

## LinkedIn — About section (top of profile)

I build web systems solo, end to end.

My most recent project is Skopos — a log monitoring platform with AI-powered pattern analysis. I designed the architecture, implemented the backend and frontend, wrote the SDKs, and load-tested the whole system to 2,140 events per second on a single VM.

I care about honest engineering: making systems that actually work under load, choosing boring proven tech over hype, and being direct about what a system is and isn't.

Currently finishing an economics degree at UNINETTUNO. Open to roles or collaborations in backend / full-stack development, especially with async Python or TypeScript.

Reach me: [your-email] · github.com/matti07986

---

## Twitter / X bio (160 char)

**Version A (project-focused):**
Built Skopos → real-time log monitoring w/ AI insights. FastAPI + Next.js + Claude. Portfolio: github.com/matti07986/skopos

**Version B (personal):**
Building things solo. Latest: Skopos (log monitoring, 2K eps). Studying econ. Open to work. github.com/matti07986

---

## CV — Projects section

**Header option A (concise):**
Skopos — Real-time log monitoring platform (github.com/matti07986/skopos)

**Header option B (with dates):**
Skopos (May 2026 – Present) — Real-time log monitoring platform · github.com/matti07986/skopos

**Body (3-5 bullets, results-focused):**

- Designed and built a self-hostable log monitoring platform end-to-end: FastAPI backend with async workers, Next.js frontend, Postgres 16 and Redis 7 for storage
- Achieved 2,140 events/sec sustained ingest with 0% error rate under load test on a single 4GB Hetzner VM (10× throughput improvement via bulk insert worker refactor)
- Implemented at-least-once durability via Redis PEL recovery and XAUTOCLAIM, ensuring no event loss on worker crashes
- Integrated Anthropic Claude for one-shot pattern analysis (not conversational), keeping AI costs bounded and predictable
- Published Python and JavaScript SDKs on PyPI and npm; documented full architecture and setup for self-hosting

---

## CV — Skills section (add to existing skills)

**Backend:** Python 3.12, FastAPI, SQLAlchemy async, asyncio, Alembic, PyTest
**Frontend:** TypeScript, React 18, Next.js 15 (App Router), Tailwind CSS
**Storage:** PostgreSQL 16, Redis 7 (Streams, PubSub), SQL optimization
**Infra:** Docker Compose, nginx, Linux (Ubuntu), Hetzner, SSH deploy
**AI:** Anthropic API (Claude), prompt engineering, cost optimization
**Practices:** Load testing (k6), production hardening, observability, at-least-once messaging

---

## Cover letter / cold outreach paragraph

Use this as a self-contained paragraph you can drop into any application email:

> I recently finished Skopos, a log monitoring platform I built solo as a
> portfolio project — full-stack async Python + Next.js, load-tested at
> 2,140 events per second on a single VM. It gave me hands-on experience
> with async Python at scale, at-least-once messaging via Redis Streams,
> production hardening (connection pools, rate limits, retry with backoff),
> and integrating LLMs cost-effectively for one-shot analysis rather than
> chat. Source and architecture are at github.com/matti07986/skopos.

---

## Talking points for interviews

If a technical interviewer asks about Skopos, these are your most impressive
stories. Practice explaining each one in 60 seconds.

### The bulk insert refactor (10× throughput)
The naive pattern_worker did one INSERT per event with one commit each. Under
load I measured 248 events/sec — the transaction overhead dominated. I
refactored to batch 100 events per commit with a 2-second max-age flush, and
throughput went to 2,140 eps. Same DB, same hardware, just amortized commit cost.

### The PEL recovery bug
On flush exception, the original code reset both `batch` and `pending_msg_ids`
to empty. Messages stayed in Redis Pending Entries List but the worker had
lost the IDs — so `XREADGROUP >` never returned them again. Silent event loss.
Fixed by keeping the batch until XACK succeeds, adding a PEL sweep at the top
of each loop, and XAUTOCLAIM every 15s to reclaim entries from crashed workers.
At-least-once guaranteed.

### The gunicorn race condition
Each gunicorn worker was spawning its own pattern_worker via FastAPI lifespan.
Two workers, same Redis consumer name, continuous NOGROUP errors and restart
loops. Fixed structurally: workers now run in a separate container with a
single process. API scales independently.

### The Redis connection pool
Original ingest endpoint opened a fresh aioredis client per request and closed
it. Under 150 concurrent VUs, TCP setup overhead added ~5-10ms per request and
saturated worker file descriptors. Moved to the shared pool from
redis_service.py, p95 latency dropped from 8.8s to 1.5s.

---

## When to use what

| Situation                   | Use                              |
|-----------------------------|----------------------------------|
| LinkedIn profile top        | Featured project + Experience    |
| CV / resume                 | Projects section + Skills        |
| Cold email to recruiter     | Cover letter paragraph           |
| Job application form        | Cover letter paragraph, adapted  |
| Twitter / X bio             | Version A                        |
| Technical interview         | Talking points                   |
| Networking event            | LinkedIn About section           |

---

## Things NOT to say

Don't oversell. Portfolio projects lose credibility when described in startup
language.

**Avoid:**
- "Disrupting log monitoring"
- "Enterprise-grade platform"
- "10× faster than Datadog"
- "Revolutionizing observability with AI"
- "Building the future of DevOps"
- "Founder" without context (implies incorporated business)
- "Team" or "we" (you're solo)
- Feature counts as bragging metric ("50+ features")

**Prefer:**
- "Built solo as a portfolio project"
- "Measured throughput of X eps under load test"
- "Self-hostable"
- "Not currently accepting paying users"
- "I built" not "we built"
- Specific technical stories over general claims

---

## Update checklist (do these next)

- [ ] Add Skopos to LinkedIn Featured section (upload dashboard screenshot as image)
- [ ] Update LinkedIn headline to one of the versions above
- [ ] Add Experience entry: Skopos, May 2026 – Present
- [ ] Update About section (2-3 paragraphs)
- [ ] Update CV/resume Projects section
- [ ] Update CV/resume Skills section
- [ ] Prepare 2-3 minute verbal pitch about Skopos for interviews (practice out loud)
- [ ] Set up Google Alerts for "log monitoring hiring" to see relevant openings
