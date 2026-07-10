# CLAUDE.md — Logtail

## Cos'è questo progetto
Logtail è una SaaS di log analysis con AI per produzione. Permette a sviluppatori e team tecnici di:
- ingerire log da qualsiasi app via SDK o HTTP
- rilevare automaticamente pattern di errore
- ottenere root cause analysis e fix suggeriti via Claude API
- ricevere alert intelligenti su Slack/email

**Tagline:** "See what's breaking. Fix it fast."
**Dominio:** logtail.dev
**Target:** startup e PMI tech che non possono permettersi Datadog o Splunk

---

## Stack tecnico

| Layer | Tecnologia | Versione |
|-------|-----------|---------|
| Backend API | FastAPI | 0.111+ |
| AI engine | Claude API (claude-sonnet-4-20250514) | latest |
| Queue | Redis Streams | 7.x |
| DB log/metriche | TimescaleDB (PostgreSQL + estensione) | 2.x |
| DB applicativo | PostgreSQL | 16.x |
| Cache | Redis | 7.x |
| Frontend | Next.js (App Router) | 14+ |
| SDK Node | TypeScript | 5.x |
| Deploy API | Railway | — |
| Deploy Web | Vercel | — |
| Container locale | Docker + docker-compose | — |
| Package manager | pnpm workspaces | 9.x |

---

## Struttura monorepo

```
logtail/
├── apps/
│   ├── api/                  # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py       # entrypoint FastAPI
│   │   │   ├── config.py     # settings (env vars)
│   │   │   ├── database.py   # connessioni DB
│   │   │   ├── deps.py       # dependency injection
│   │   │   ├── routers/
│   │   │   │   ├── ingest.py # POST /v1/ingest — riceve i log
│   │   │   │   ├── logs.py   # GET /v1/logs — query log
│   │   │   │   ├── auth.py   # autenticazione API key
│   │   │   │   └── alerts.py # gestione alert
│   │   │   ├── workers/
│   │   │   │   ├── pattern_worker.py  # raggruppa errori per fingerprint
│   │   │   │   ├── ai_worker.py       # chiama Claude per root cause
│   │   │   │   └── alert_worker.py    # invia notifiche
│   │   │   ├── models/
│   │   │   │   ├── log_event.py
│   │   │   │   ├── user.py
│   │   │   │   └── alert.py
│   │   │   └── services/
│   │   │       ├── claude_service.py  # wrapper Claude API
│   │   │       └── redis_service.py   # wrapper Redis Streams
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── web/                  # Next.js frontend
│       ├── app/
│       │   ├── page.tsx       # dashboard principale
│       │   ├── layout.tsx
│       │   └── (auth)/
│       ├── components/
│       │   ├── LogStream.tsx
│       │   ├── AiInsight.tsx
│       │   └── MetricCard.tsx
│       └── package.json
├── packages/
│   └── sdk-node/             # SDK npm pubblico
│       ├── src/
│       │   └── index.ts      # Logtail({ apiKey }).log(...)
│       └── package.json
├── infra/
│   ├── docker-compose.yml    # ambiente locale completo
│   └── railway.toml          # config deploy produzione
├── CLAUDE.md                 # questo file
└── README.md
```

---

## Avvio ambiente locale

```bash
# 1. Clona e installa dipendenze
git clone https://github.com/tuonome/logtail
cd logtail
pnpm install

# 2. Copia variabili d'ambiente
cp apps/api/.env.example apps/api/.env
# Poi edita .env e aggiungi ANTHROPIC_API_KEY

# 3. Avvia tutti i servizi (DB, Redis, API)
docker-compose up -d

# 4. Avvia il frontend in dev
cd apps/web && pnpm dev

# 5. Verifica che l'API risponda
curl http://localhost:8000/health
```

---

## Variabili d'ambiente richieste

```bash
# apps/api/.env
DATABASE_URL=postgresql://logtail:logtail@localhost:5432/logtail
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...         # OBBLIGATORIO per AI worker
SECRET_KEY=cambia-in-produzione

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Convenzioni di codice

### Python (FastAPI)
- **Lingua commenti:** italiano nei commenti ad alto livello, inglese nel codice
- Usa `async/await` ovunque possibile
- Modelli Pydantic v2 per validazione input/output
- Nomi route in snake_case: `log_event`, `api_key`
- Ogni router ha il suo file in `routers/`
- I worker sono funzioni async che consumano da Redis Streams
- Gestisci sempre le eccezioni con HTTPException appropriata

### TypeScript (Next.js + SDK)
- Strict mode attivo
- Componenti React con naming PascalCase
- Hook custom con prefisso `use`
- Tutto tipato — no `any`
- CSS: Tailwind utility classes

### Git
- Branch: `feature/nome-feature`, `fix/nome-bug`
- Commit: `feat:`, `fix:`, `chore:`, `docs:` (conventional commits)
- Main branch: `main`

---

## Flusso dati principale

```
App cliente
  → SDK/HTTP POST /v1/ingest
  → Ingestor valida + scrive su Redis Streams
  → Pattern worker consuma stream → raggruppa per fingerprint → scrive su TimescaleDB
  → AI worker consuma stream → chiama Claude API → scrive insight su PostgreSQL
  → Alert worker consuma stream → valuta regole → manda Slack/email
  → Dashboard Next.js → legge da API → mostra real-time via polling/SSE
```

---

## Modello dati core

### LogEvent (TimescaleDB)
```python
class LogEvent(BaseModel):
    id: UUID
    project_id: UUID
    timestamp: datetime       # colonna tempo TimescaleDB
    level: str                # ERROR | WARN | INFO | DEBUG
    message: str
    service: str              # nome del servizio (es. "user-service")
    metadata: dict            # JSON libero (stack trace, req_id, ecc.)
    fingerprint: str | None   # hash per raggruppamento pattern
```

### AiInsight (PostgreSQL)
```python
class AiInsight(BaseModel):
    id: UUID
    pattern_id: UUID
    root_cause: str           # spiegazione in linguaggio naturale
    suggested_fix: str        # diff o snippet di codice
    confidence: float         # 0.0 - 1.0
    created_at: datetime
```

---

## Chiamate Claude API

Usa sempre `claude-sonnet-4-20250514`. Il sistema prompt è in `services/claude_service.py`.

Struttura del prompt per root cause analysis:
```
Sistema: Sei un esperto di debugging. Analizza questi log e identifica:
1. La causa principale dell'errore
2. Il servizio/file responsabile
3. Un fix concreto con esempio di codice

Rispondi SOLO in JSON con campi: root_cause, file_hint, suggested_fix, confidence
```

**Importante:** il campo `suggested_fix` deve sempre contenere una diff leggibile, non solo testo.

---

## Pattern da evitare

- ❌ Non usare `time.sleep()` nei worker — usa `asyncio.sleep()`
- ❌ Non fare query N+1 — usa sempre join o batch query
- ❌ Non loggare `ANTHROPIC_API_KEY` nei log (ovvio ma importante)
- ❌ Non fare chiamate Claude API in modo sincrono nel path di ingestion — sempre asincrono via worker
- ❌ Non usare `SELECT *` su `log_events` — è una tabella enorme
- ❌ Non dimenticare gli indici su `(project_id, timestamp)` in TimescaleDB

---

## Comandi utili

```bash
# Backend
cd apps/api
uvicorn app.main:app --reload          # dev server
pytest tests/                          # test
alembic upgrade head                   # migrazione DB

# Frontend
cd apps/web
pnpm dev                               # dev server su :3000
pnpm build && pnpm start               # prod build

# Docker
docker-compose up -d                   # avvia tutto
docker-compose logs -f api             # log del backend
docker-compose down -v                 # distruggi tutto (inclusi volumi)

# SDK
cd packages/sdk-node
pnpm build                             # compila TypeScript
pnpm publish                           # pubblica su npm
```

---

## Pricing tier (per contesto business)

| Piano | Prezzo | Limiti |
|-------|--------|--------|
| Starter | $29/mese | 1 progetto · 5GB log/mese |
| Pro | $79/mese | 5 progetti · 50GB log/mese |
| Team | $149/mese | illimitato · AI avanzata |

La colonna `plan` su `users` può essere: `starter`, `pro`, `team`.
Il rate limit sull'ingestor si basa sul piano.

---

*Aggiornato: maggio 2026 — versione 1.0*
