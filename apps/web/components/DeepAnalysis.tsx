"use client";

import { useState } from "react";

const INTER = { fontFamily: "'Inter', sans-serif" };
const MONO = { fontFamily: "JetBrains Mono, Fira Code, monospace" };

interface LogEvent {
  id?: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
}

interface AnalysisBlock {
  title: string;
  content: string;
  type: "text" | "code" | "command" | "warning" | "tip";
  language?: string;
}

function detectErrorType(pattern: string): string {
  const p = pattern.toLowerCase();
  if (p.includes("connection timeout") || p.includes("connect timeout")) return "connection_timeout";
  if (p.includes("connection refused")) return "connection_refused";
  if (p.includes("database") || p.includes("db") || p.includes("postgres") || p.includes("mysql") || p.includes("sql")) return "database";
  if (p.includes("memory") || p.includes("oom") || p.includes("heap")) return "memory";
  if (p.includes("404") || p.includes("not found")) return "not_found";
  if (p.includes("401") || p.includes("403") || p.includes("unauthorized") || p.includes("forbidden")) return "auth";
  if (p.includes("500") || p.includes("internal server")) return "server_error";
  if (p.includes("timeout") || p.includes("timed out")) return "timeout";
  if (p.includes("null") || p.includes("undefined") || p.includes("typeerror") || p.includes("referenceerror")) return "runtime";
  if (p.includes("rate limit") || p.includes("too many requests") || p.includes("429")) return "rate_limit";
  if (p.includes("disk") || p.includes("storage") || p.includes("no space")) return "disk";
  if (p.includes("ssl") || p.includes("certificate") || p.includes("tls")) return "ssl";
  return "generic";
}

function generateAnalysis(
  type: "errors" | "warnings",
  events: LogEvent[],
  patterns: { message: string; service: string; count: number }[],
  total: number,
  peak: number,
  activeHours: number,
): AnalysisBlock[] {
  if (total === 0) return [];

  const topPattern = patterns[0];
  const topService = topPattern?.service || "unknown";
  const errorType = topPattern ? detectErrorType(topPattern.message) : "generic";
  const avgPerHour = (total / 24).toFixed(1);
  const concentration = activeHours <= 2 ? "altamente concentrati" : activeHours <= 6 ? "parzialmente concentrati" : "distribuiti nell'arco della giornata";
  const severity = type === "errors"
    ? (total > 50 ? "critica" : total > 10 ? "alta" : "media")
    : (total > 100 ? "alta" : total > 20 ? "media" : "bassa");

  const blocks: AnalysisBlock[] = [];

  // 1. Panoramica
  blocks.push({
    type: "text",
    title: "Panoramica",
    content: `Nelle ultime 24 ore sono stati rilevati **${total} ${type === "errors" ? "errori" : "warning"}** con severità **${severity}**. Gli eventi sono ${concentration} (${activeHours}/24 ore attive) con un picco di **${peak}/${type === "errors" ? "errori" : "warning"} per ora**. La media è di ${avgPerHour} eventi/ora.${patterns.length > 1 ? ` Sono stati identificati **${patterns.length} pattern distinti**.` : ""}`
  });

  // 2. Analisi pattern principale
  if (topPattern) {
    const typeDescriptions: Record<string, string> = {
      connection_timeout: `Il pattern principale "**${topPattern.message}**" (×${topPattern.count}) indica che il servizio **${topService}** non riesce a stabilire una connessione entro il timeout configurato. Le cause più comuni sono: sovraccarico del server di destinazione, rete instabile, firewall che blocca la connessione, o timeout configurato troppo basso per il carico attuale.`,
      connection_refused: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica che il server di destinazione sta attivamente rifiutando le connessioni. Questo succede quando il servizio target è down, non è in ascolto sulla porta attesa, o le regole firewall bloccano il traffico.`,
      database: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica un problema con il layer database. Le cause tipiche includono: pool di connessioni esaurito, query lente che bloccano il DB, connessione al DB interrotta, o credenziali scadute.`,
      memory: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica pressione sulla memoria. Il processo sta consumando più RAM del previsto — possibile memory leak, dataset troppo grande in memoria, o limite container troppo basso.`,
      timeout: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica operazioni che non completano entro il tempo atteso. Potrebbe essere una chiamata esterna lenta, una query non ottimizzata, o un deadlock.`,
      not_found: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica richieste a risorse inesistenti. Controlla se ci sono URL errati nel codice, risorse cancellate, o routing non configurato correttamente.`,
      auth: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica problemi di autenticazione o autorizzazione. Token scaduti, credenziali errate, o permessi insufficienti sono le cause più frequenti.`,
      runtime: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica un errore runtime nel codice. Variabile null/undefined non gestita, tipo di dato inatteso, o logica non coperta da error handling.`,
      rate_limit: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica che stai superando i limiti di rate di un'API esterna o del tuo stesso sistema. Implementa retry con backoff esponenziale e considera il caching.`,
      server_error: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica errori interni del server. Analizza gli stack trace completi per identificare la riga di codice responsabile.`,
      disk: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica problemi di storage. Verifica lo spazio disponibile e implementa una policy di rotazione dei log.`,
      ssl: `Il pattern "**${topPattern.message}**" (×${topPattern.count}) dal servizio **${topService}** indica problemi con i certificati SSL/TLS. Controlla la data di scadenza del certificato e la catena di certificazione.`,
      generic: `Il pattern principale "**${topPattern.message}**" (×${topPattern.count}) proviene principalmente dal servizio **${topService}** e rappresenta il ${Math.round((topPattern.count / total) * 100)}% di tutti gli eventi.`,
    };
    blocks.push({
      type: "text",
      title: "Analisi del pattern principale",
      content: typeDescriptions[errorType] || typeDescriptions.generic,
    });
  }

  // 3. Comandi di investigazione
  const commands: Record<string, string[]> = {
    connection_timeout: [
      `# Verifica la connettività al servizio target\ncurl -v --connect-timeout 5 <HOST>:<PORT>`,
      `# Controlla i log del servizio in tempo reale\ndocker logs ${topService} --tail=100 -f | grep -i "timeout"`,
      `# Verifica le connessioni aperte\nnetstat -an | grep ESTABLISHED | wc -l`,
    ],
    connection_refused: [
      `# Verifica se il servizio è in ascolto\nnetstat -tlnp | grep <PORT>`,
      `# Controlla lo stato del container\ndocker ps | grep ${topService}`,
      `# Ispeziona gli ultimi log del servizio\ndocker logs ${topService} --tail=50`,
    ],
    database: [
      `# Controlla le connessioni attive al DB\ndocker exec infra-db-1 psql -U logtail -d logtail -c "SELECT count(*) FROM pg_stat_activity;"`,
      `# Verifica query lente\ndocker exec infra-db-1 psql -U logtail -d logtail -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC LIMIT 10;"`,
      `# Cerca il pattern nei log del DB\ndocker logs infra-db-1 --tail=100 | grep -i "error"`,
    ],
    memory: [
      `# Verifica l'uso di memoria del container\ndocker stats ${topService} --no-stream`,
      `# Controlla i processi più pesanti\ndocker exec ${topService} top -b -n 1 | head -20`,
      `# Cerca pattern memory nei log\ndocker logs ${topService} --tail=200 | grep -i "memory\\|heap\\|oom"`,
    ],
    timeout: [
      `# Cerca tutti i timeout nei log\ndocker logs ${topService} --tail=500 | grep -i "timeout\\|timed out"`,
      `# Verifica latenza verso servizi esterni\ncurl -o /dev/null -s -w "%{time_total}\\n" <EXTERNAL_URL>`,
      `# Controlla le query lente se è DB-related\ndocker exec infra-db-1 psql -U logtail -d logtail -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5;"`,
    ],
    generic: [
      `# Filtra gli errori del servizio specifico\ndocker logs ${topService} --tail=200 | grep -i "error\\|exception\\|fail"`,
      `# Vedi tutti i log in tempo reale\ndocker logs ${topService} -f --tail=50`,
      `# Conta gli errori per ora\ndocker logs ${topService} --since 24h | grep -c "error"`,
    ],
  };

  const cmds = commands[errorType] || commands.generic;
  blocks.push({
    type: "command",
    title: "Comandi di investigazione",
    content: cmds.join("\n\n"),
  });

  // 4. Snippet di fix
  const fixes: Record<string, { lang: string; code: string }> = {
    connection_timeout: {
      lang: "python",
      code: `import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10)
)
async def fetch_with_retry(url: str):
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()`,
    },
    database: {
      lang: "python",
      code: `from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

# Configura connection pool per evitare esaurimento connessioni
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,          # Connessioni mantenute aperte
    max_overflow=20,       # Connessioni extra in caso di picco
    pool_timeout=30,       # Secondi di attesa per una connessione
    pool_recycle=1800,     # Ricicla connessioni ogni 30 minuti
    pool_pre_ping=True,    # Verifica connessione prima dell'uso
)`,
    },
    memory: {
      lang: "python",
      code: `import gc
import tracemalloc

# Abilita tracciamento memoria per debug
tracemalloc.start()

# Processa dati in batch per evitare OOM
def process_large_dataset(items, batch_size=1000):
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        process_batch(batch)
        gc.collect()  # Forza garbage collection dopo ogni batch

# Snapshot memoria per trovare leak
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:5]:
    print(stat)`,
    },
    timeout: {
      lang: "python",
      code: `import asyncio
from functools import wraps

def with_timeout(seconds: float):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=seconds
                )
            except asyncio.TimeoutError:
                raise TimeoutError(
                    f"{func.__name__} exceeded {seconds}s timeout"
                )
        return wrapper
    return decorator

@with_timeout(5.0)
async def your_function():
    # La tua logica qui
    pass`,
    },
    runtime: {
      lang: "python",
      code: `# Pattern sicuro per gestire valori null/undefined
from typing import Optional, TypeVar, Callable

T = TypeVar('T')

def safe_get(obj: dict, key: str, default=None):
    """Accesso sicuro a dizionari annidati"""
    try:
        return obj.get(key, default)
    except (AttributeError, TypeError):
        return default

def safe_execute(func: Callable[[], T], default: T, log_error=True) -> T:
    """Esegui funzione con fallback sicuro"""
    try:
        return func()
    except Exception as e:
        if log_error:
            import logging
            logging.error(f"Safe execute failed: {e}")
        return default`,
    },
    generic: {
      lang: "python",
      code: `import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

@contextmanager
def error_boundary(operation: str, reraise=False):
    """Cattura e logga errori con contesto"""
    try:
        yield
    except Exception as e:
        logger.error(
            f"Error in {operation}",
            extra={
                "operation": operation,
                "error_type": type(e).__name__,
                "error_message": str(e),
            },
            exc_info=True
        )
        if reraise:
            raise

# Utilizzo:
with error_boundary("database_query"):
    result = db.execute(query)`,
    },
  };

  const fix = fixes[errorType] || fixes.generic;
  blocks.push({
    type: "code",
    title: `Soluzione consigliata per ${errorType.replace(/_/g, " ")}`,
    content: fix.code,
    language: fix.lang,
  });

  // 5. Tip finale
  const tips: Record<string, string> = {
    connection_timeout: "Implementa un circuit breaker per evitare cascate di timeout. Se un servizio fallisce N volte consecutive, smetti di chiamarlo per un periodo e usa un fallback.",
    connection_refused: "Aggiungi health check al tuo orchestratore (Docker, Kubernetes) per riavviare automaticamente i servizi che smettono di rispondere.",
    database: "Monitora `pg_stat_activity` periodicamente. Un pool di connessioni mal configurato è la causa #1 di problemi database in produzione.",
    memory: "Imposta `--memory` e `--memory-swap` nei tuoi container Docker per evitare che un processo consumi tutta la RAM del host.",
    timeout: "Usa timeout diversi per operazioni diverse: lettura DB (1-2s), API esterne (5-10s), operazioni batch (60s+). Non usare un timeout globale unico.",
    rate_limit: "Implementa una coda con retry backoff esponenziale: aspetta 1s, poi 2s, 4s, 8s... Così eviti di peggiorare il rate limiting con retry aggressivi.",
    generic: "Aggiungi correlation ID a ogni request per tracciare il flusso attraverso i servizi. Rende il debugging molto più veloce.",
  };

  blocks.push({
    type: "tip",
    title: "Best practice",
    content: tips[errorType] || tips.generic,
  });

  return blocks;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #222" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", backgroundColor: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
        <span style={{ ...MONO, fontSize: "10px", color: "#a0aab4" }}>{language}</span>
        <button onClick={copy} style={{ ...INTER, fontSize: "10px", color: copied ? "#4ade80" : "#a0aab4", background: "none", border: "none", cursor: "pointer", padding: "2px 8px" }}>
          {copied ? "✓ copiato" : "copia"}
        </button>
      </div>
      <pre style={{ ...MONO, margin: 0, padding: "14px", backgroundColor: "#080808", fontSize: "12px", color: "#e6edf3", overflowX: "auto", lineHeight: 1.6, whiteSpace: "pre" }}>{code}</pre>
    </div>
  );
}

function renderContent(block: AnalysisBlock) {
  if (block.type === "code") {
    return <CodeBlock code={block.content} language={block.language || "code"} />;
  }
  if (block.type === "command") {
    const cmds = block.content.split("\n\n");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {cmds.map((cmd, i) => <CodeBlock key={i} code={cmd} language="bash" />)}
      </div>
    );
  }
  if (block.type === "warning") {
    return (
      <div style={{ backgroundColor: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "12px 16px" }}>
        <p style={{ ...INTER, fontSize: "13px", color: "#fbbf24", margin: 0, lineHeight: 1.7 }}>{block.content}</p>
      </div>
    );
  }
  if (block.type === "tip") {
    return (
      <div style={{ backgroundColor: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "8px", padding: "12px 16px" }}>
        <p style={{ ...INTER, fontSize: "13px", color: "#4ade80", margin: 0, lineHeight: 1.7 }}>💡 {block.content}</p>
      </div>
    );
  }
  // text — supporta **bold**
  const parts = block.content.split(/\*\*(.+?)\*\*/g);
  return (
    <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", margin: 0, lineHeight: 1.8 }}>
      {parts.map((p, i) => i % 2 === 1 ? <strong key={i} style={{ color: "#e6edf3", fontWeight: 500 }}>{p}</strong> : p)}
    </p>
  );
}

export function DeepAnalysis({ type, events, patterns, total, peak, activeHours }: {
  type: "errors" | "warnings";
  events: LogEvent[];
  patterns: { message: string; service: string; count: number }[];
  total: number;
  peak: number;
  activeHours: number;
}) {
  const [open, setOpen] = useState(true);
  const blocks = generateAnalysis(type, events, patterns, total, peak, activeHours);
  if (blocks.length === 0) return null;

  return (
    <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: open ? "1px solid #1a1a1a" : "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: type === "errors" ? "#f87171" : "#fbbf24" }} />
          <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>Analisi approfondita</span>
          <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", backgroundColor: "#111", border: "1px solid #222", borderRadius: "4px", padding: "1px 8px" }}>{blocks.length} sezioni</span>
        </div>
        <span style={{ color: "#a0aab4", fontSize: "16px" }}>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {blocks.map((block, i) => (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>{block.title}</span>
                {i < blocks.length - 1 && <div style={{ flex: 1, height: "1px", backgroundColor: "#111" }} />}
              </div>
              {renderContent(block)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
