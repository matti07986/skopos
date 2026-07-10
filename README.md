# Skopos

> Boring log infrastructure. Smart AI on top.

A log monitoring SaaS for indie developers and small teams. Reliable ingestion, fast search, sensible retention — plus an AI chat layer on top, so you can actually understand what's happening in your services.

**The primary interface for understanding your logs is a chat box, not a search bar.**

[skopos.ink](https://skopos.ink) • [Pricing](https://skopos.ink/pricing) • [Status](https://status.skopos.ink) • [Docs](https://docs.skopos.ink)

---

## Features

- 🔍 **Full-text search** across all your logs, with filters that don't fight you
- 💬 **Chat with your logs** — natural-language questions, answers grounded in your actual data (RAG over your logs with Claude)
- 🚨 **Alerts** — get pinged on patterns that matter, with rate-limit baked in so you're not paged by your own retries
- 📊 **Auto-insights** — Skopos surfaces unusual patterns and frequent error signatures automatically
- 👥 **Team sharing** — read-only project sharing, per-project access control
- 📈 **Status pages** — public uptime / incident reports for your users (one-toggle setup)
- 🔌 **SDKs in JavaScript and Python** plus a universal HTTP ingest endpoint

## Quick start

Pick your language and ship a log in 30 seconds.

### JavaScript / TypeScript

```bash
npm install @skopos/sdk
```

```typescript
import { Skopos } from "@skopos/sdk";

const log = new Skopos({ token: process.env.SKOPOS_TOKEN });

log.info("Order placed", { orderId, userId, amount });
log.error("Payment failed", { error: err.message, orderId });

// Flush before process exit (long-running apps don't need this)
process.on("beforeExit", () => log.shutdown());
```

### Python

```bash
pip install skopos-sdk
```

```python
from skopos import Skopos

log = Skopos(token=os.environ["SKOPOS_TOKEN"])

log.info("Order placed", order_id=order_id, user_id=user_id, amount=amount)
log.error("Payment failed", error=str(err), order_id=order_id)
```

### HTTP ingest (any language)

```bash
curl -X POST https://api.skopos.ink/v1/ingest \
  -H "X-Skopos-Key: $SKOPOS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"level":"error","message":"payment failed","service":"checkout"}]'
```

Sign up at [skopos.ink](https://skopos.ink) to get your token (free tier, no credit card).

## Pricing

| Plan         | Price        | Events/hr | Projects   | Retention | AI insights / mo |
|--------------|--------------|-----------|------------|-----------|------------------|
| **Starter**  | Free forever | 10k       | 1          | 7 days    | 20               |
| **Indie**    | €22/mo       | 100k      | 3          | 21 days   | unlimited        |
| **Pro**      | €59/mo       | 500k      | 10         | 60 days   | unlimited        |
| **Business** | €169/mo      | 5M        | unlimited  | 90 days   | unlimited        |

Full details at [skopos.ink/pricing](https://skopos.ink/pricing).

## Tech stack

- **Frontend**: Next.js 15, React, Tailwind CSS, deployed on Vercel
- **Backend**: FastAPI (Python 3.12), PostgreSQL + TimescaleDB, Redis
- **AI**: Claude (Anthropic) via RAG over the user's own logs
- **Infra**: Hetzner (backend), Cloudflare (DNS / CDN / Email Routing)
- **Billing**: Lemon Squeezy (merchant of record — VAT handled for us)

## SDKs

| Language              | Package                                                        | Source           |
|-----------------------|----------------------------------------------------------------|------------------|
| JavaScript/TypeScript | [`@skopos/sdk`](https://www.npmjs.com/package/@skopos/sdk)     | `packages/js`    |
| Python                | [`skopos-sdk`](https://pypi.org/project/skopos-sdk/)           | `packages/py`    |
| Go                    | planned                                                        | —                |

## Status & support

- 🟢 Service status: [status.skopos.ink](https://status.skopos.ink)
- 📖 Documentation: [docs.skopos.ink](https://docs.skopos.ink)
- ✉️ Support: [support@skopos.ink](mailto:support@skopos.ink)

## Contributing

Skopos is mostly closed-source — it's a SaaS — but the SDKs under `packages/*` are MIT-licensed and PRs are welcome. For bugs or feature requests on the main product, please [open an issue](https://github.com/matti07986/skopos/issues) or email support.

## License

- SDKs (`packages/*`): MIT
- Main product (`apps/*`, `infra/*`): proprietary
