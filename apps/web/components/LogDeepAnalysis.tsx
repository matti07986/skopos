"use client";
import { useState } from "react";

const INTER = { fontFamily: "Inter, sans-serif" };
const MONO = { fontFamily: "JetBrains Mono, Fira Code, monospace" };

interface LogEvent {
  id: string; timestamp: string; level: string; service: string; message: string; metadata?: Record<string, unknown>;
}

function CopyGrepButton({ cmd }: { cmd: string }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return (
    <button onClick={copy} style={{ ...INTER, fontSize: "10px", color: copied ? "#4ade80" : "#a0aab4", background: "none", border: "none", cursor: "pointer", flexShrink: 0, marginLeft: "8px", padding: "2px 6px" }}>
      {copied ? "✓ copiato" : "copia grep"}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  return (
    <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #222" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 14px", backgroundColor: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
        <span style={{ ...MONO, fontSize: "10px", color: "#a0aab4" }}>{language}</span>
        <button onClick={copy} style={{ ...INTER, fontSize: "10px", color: copied ? "#4ade80" : "#a0aab4", background: "none", border: "none", cursor: "pointer" }}>{copied ? "✓ copiato" : "copia"}</button>
      </div>
      <pre style={{ ...MONO, margin: 0, padding: "14px", backgroundColor: "#080808", fontSize: "12px", color: "#e6edf3", overflowX: "auto", lineHeight: 1.6, whiteSpace: "pre" }}>{code}</pre>
    </div>
  );
}

function generateLogAnalysis(logs: LogEvent[], focusedLog: LogEvent | null) {
  if (logs.length === 0) return null;

  const errorLogs = logs.filter(l => l.level === "ERROR");
  const warnLogs = logs.filter(l => l.level === "WARN");
  const infoLogs = logs.filter(l => l.level === "INFO");
  const debugLogs = logs.filter(l => l.level === "DEBUG");

  const svcMap = new Map<string, { total: number; errors: number; warns: number }>();
  for (const log of logs) {
    const s = svcMap.get(log.service) ?? { total: 0, errors: 0, warns: 0 };
    s.total++;
    if (log.level === "ERROR") s.errors++;
    if (log.level === "WARN") s.warns++;
    svcMap.set(log.service, s);
  }
  const services = Array.from(svcMap.entries()).sort((a, b) => b[1].total - a[1].total);
  const topService = services[0];

  const msgMap = new Map<string, number>();
  for (const log of logs) msgMap.set(log.message, (msgMap.get(log.message) ?? 0) + 1);
  const topPatterns = Array.from(msgMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const errorRate = Math.round((errorLogs.length / logs.length) * 100);
  const health = errorRate === 0 ? "healthy" : errorRate < 10 ? "degraded" : "critical";
  const healthColor = health === "healthy" ? "#4ade80" : health === "degraded" ? "#fbbf24" : "#f87171";

  return { errorLogs, warnLogs, infoLogs, debugLogs, services, topService, topPatterns, errorRate, health, healthColor };
}

export function LogDeepAnalysis({ logs, focusedLog }: { logs: LogEvent[]; focusedLog: LogEvent | null }) {
  const [open, setOpen] = useState(true);
  const analysis = generateLogAnalysis(logs, focusedLog);
  if (!analysis) return null;

  const { errorLogs, warnLogs, infoLogs, debugLogs, services, topService, topPatterns, errorRate, health, healthColor } = analysis;

  return (
    <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: open ? "1px solid #1a1a1a" : "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: healthColor }} />
          <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>
            {focusedLog ? `Analisi log selezionato` : "Analisi approfondita logs"}
          </span>
          <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", backgroundColor: "#111", border: "1px solid #222", borderRadius: "4px", padding: "1px 8px" }}>
            {focusedLog ? focusedLog.level : health}
          </span>
        </div>
        <span style={{ color: "#a0aab4", fontSize: "16px" }}>{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {focusedLog ? (
            // Analisi log specifico
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "16px" }}>
                <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Evento selezionato</div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ ...INTER, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", color: focusedLog.level === "ERROR" ? "#f87171" : focusedLog.level === "WARN" ? "#fbbf24" : "#4ade80", backgroundColor: focusedLog.level === "ERROR" ? "rgba(248,113,113,0.1)" : focusedLog.level === "WARN" ? "rgba(251,191,36,0.1)" : "rgba(74,222,128,0.1)" }}>{focusedLog.level}</span>
                  <span style={{ ...INTER, fontSize: "11px", color: "#4ade80" }}>{focusedLog.service}</span>
                  <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4" }}>{new Date(focusedLog.timestamp).toLocaleString("en-GB", { hour12: false })}</span>
                </div>
                <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: "0 0 12px 0", lineHeight: 1.6 }}>{focusedLog.message}</p>
                {(() => {
                  const msg = focusedLog.message.toLowerCase();
                  const svc = focusedLog.service;
                  let explanation = "";
                  let command = "";
                  if (msg.includes("timeout") || msg.includes("connection")) {
                    explanation = `Questo evento indica un problema di connessione nel servizio ${svc}. Il sistema non è riuscito a completare un'operazione entro il tempo limite configurato.`;
                    command = `# Controlla i log recenti del servizio\ndocker logs ${svc} --tail=50 | grep -i "timeout\\|connection"\n\n# Verifica connettività\ncurl -v --connect-timeout 5 localhost:8000/health`;
                  } else if (msg.includes("memory") || msg.includes("heap") || msg.includes("oom")) {
                    explanation = `Il servizio ${svc} sta consumando memoria in modo anomalo. Potrebbe essere un memory leak o un carico inaspettato.`;
                    command = `# Controlla uso memoria del container\ndocker stats ${svc} --no-stream\n\n# Cerca pattern memory nei log\ndocker logs ${svc} --tail=200 | grep -i "memory\\|heap\\|oom"`;
                  } else if (msg.includes("database") || msg.includes("sql") || msg.includes("postgres")) {
                    explanation = `Errore nel layer database dal servizio ${svc}. Potrebbe essere un problema di connessione al DB, query lenta o pool esaurito.`;
                    command = `# Controlla connessioni attive al DB\ndocker exec infra-db-1 psql -U logtail -d logtail -c "SELECT count(*) FROM pg_stat_activity;"\n\n# Query lente\ndocker exec infra-db-1 psql -U logtail -d logtail -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 5;"`;
                  } else if (msg.includes("404") || msg.includes("not found")) {
                    explanation = `Il servizio ${svc} ha ricevuto una richiesta per una risorsa inesistente. Controlla routing, URL, o se la risorsa è stata eliminata.`;
                    command = `# Filtra tutti i 404 nel servizio\ndocker logs ${svc} --tail=200 | grep -i "404\\|not found"\n\n# Controlla routing configurato\ncurl -I localhost:8000/<PATH>`;
                  } else if (msg.includes("401") || msg.includes("403") || msg.includes("unauthorized") || msg.includes("forbidden")) {
                    explanation = `Problema di autenticazione o autorizzazione nel servizio ${svc}. Token scaduto, credenziali errate, o permessi insufficienti.`;
                    command = `# Verifica validità token\ncurl -H "Authorization: Bearer <TOKEN>" localhost:8000/v1/auth/me\n\n# Cerca errori auth nei log\ndocker logs ${svc} --tail=100 | grep -i "401\\|403\\|auth"`;
                  } else {
                    explanation = `Evento ${focusedLog.level} dal servizio ${svc}. Analizza il contesto degli eventi precedenti e successivi per capire la causa radice.`;
                    command = `# Cerca eventi correlati nello stesso periodo\ndocker logs ${svc} --since 1h | grep -i "${focusedLog.message.split(" ").slice(0,3).join(" ")}"`;
                  }
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: 0, lineHeight: 1.7 }}>{explanation}</p>
                      <CodeBlock code={command} language="bash" />
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            // Analisi generale di tutti i log
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Distribuzione livelli */}
              <div>
                <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Distribuzione per livello</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                  {[
                    { label: "ERROR", count: errorLogs.length, color: "#f87171", bg: "rgba(248,113,113,0.08)" },
                    { label: "WARN",  count: warnLogs.length,  color: "#fbbf24", bg: "rgba(251,191,36,0.08)" },
                    { label: "INFO",  count: infoLogs.length,  color: "#4ade80", bg: "rgba(74,222,128,0.08)" },
                    { label: "DEBUG", count: debugLogs.length, color: "#a0aab4", bg: "rgba(160,170,180,0.08)" },
                  ].map(l => (
                    <div key={l.label} style={{ backgroundColor: l.bg, border: `1px solid ${l.color}22`, borderRadius: "8px", padding: "12px 14px" }}>
                      <div style={{ ...INTER, fontSize: "9px", color: l.color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>{l.label}</div>
                      <div style={{ ...INTER, fontSize: "22px", fontWeight: 600, color: l.count > 0 ? l.color : "#333", fontVariantNumeric: "tabular-nums" }}>{l.count}</div>
                      <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", marginTop: "2px" }}>{logs.length > 0 ? Math.round((l.count / logs.length) * 100) : 0}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health summary */}
              <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: healthColor }} />
                  <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Stato sistema</span>
                </div>
                <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: "0 0 6px 0", fontWeight: 500 }}>
                  {health === "healthy" ? "Sistema operativo — nessun errore rilevato" : health === "degraded" ? `Sistema degradato — ${errorRate}% di eventi sono errori` : `Sistema critico — ${errorRate}% di errori richiede attenzione immediata`}
                </p>
                <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: 0, lineHeight: 1.7 }}>
                  {topService ? `Il servizio più attivo è ${topService[0]} con ${topService[1].total} eventi (${topService[1].errors} errori, ${topService[1].warns} warning).` : ""}
                  {errorRate > 0 ? ` Il tasso di errore è ${errorRate}%.` : " Il tasso di errore è 0%."}
                </p>
              </div>

              {/* Top services */}
              {services.length > 0 && (
                <div>
                  <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Servizi attivi</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {services.slice(0, 5).map(([svc, stats]) => (
                      <div key={svc} style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "7px", padding: "10px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ ...INTER, fontSize: "12px", color: "#4ade80", fontWeight: 500 }}>{svc}</span>
                          <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>{stats.total} eventi</span>
                        </div>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <span style={{ ...INTER, fontSize: "10px", color: stats.errors > 0 ? "#f87171" : "#333" }}>● {stats.errors} errors</span>
                          <span style={{ ...INTER, fontSize: "10px", color: stats.warns > 0 ? "#fbbf24" : "#333" }}>● {stats.warns} warnings</span>
                          <span style={{ ...INTER, fontSize: "10px", color: "#4ade80" }}>● {stats.total - stats.errors - stats.warns} info</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pattern ricorrenti */}
              {topPatterns.length > 0 && (
                <div>
                  <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Pattern più frequenti</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {topPatterns.map(([msg, count], i) => {
                      const grepCmd = `docker compose logs --tail=500 | grep -i "${msg.replace(/"/g, '\\"')}"`;
                      return (
                        <div key={i} style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "7px", overflow: "hidden" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderBottom: "1px solid #111" }}>
                            <span style={{ ...INTER, fontSize: "12px", color: "#e6edf3", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "12px" }}>{msg}</span>
                            <span style={{ ...INTER, fontSize: "11px", fontWeight: 600, color: "#a0aab4", backgroundColor: "#111", border: "1px solid #222", borderRadius: "4px", padding: "2px 8px", flexShrink: 0 }}>×{count}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px", backgroundColor: "#080808" }}>
                            <span style={{ fontFamily: "JetBrains Mono, Fira Code, monospace", fontSize: "10px", color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{grepCmd}</span>
                            <CopyGrepButton cmd={grepCmd} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Comandi utili */}
              <div>
                <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Comandi utili</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <CodeBlock
                    language="bash"
                    code={`# Segui i log in tempo reale di tutti i servizi\ndocker compose logs -f --tail=50\n\n# Filtra solo gli errori\ndocker compose logs --tail=200 | grep -i "error\\|exception\\|fail"\n\n# Conta errori per servizio nell'ultima ora\ndocker compose logs --since 1h | grep -c "ERROR"`}
                  />
                  {topPatterns[0] && (
                    <CodeBlock
                      language="bash"
                      code={`# Cerca il pattern più frequente\ndocker compose logs --tail=500 | grep -i "${topPatterns[0][0].split(" ").slice(0,4).join(" ")}"\n\n# Conta occorrenze\ndocker compose logs --since 24h | grep -c "${topPatterns[0][0].split(" ").slice(0,3).join(" ")}"`}
                    />
                  )}
                </div>
              </div>

              {/* Tip */}
              <div style={{ backgroundColor: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "8px", padding: "12px 16px" }}>
                <p style={{ ...INTER, fontSize: "12px", color: "#4ade80", margin: 0, lineHeight: 1.7 }}>
                  💡 Clicca su un log nella lista per vedere l&apos;analisi specifica di quell&apos;evento con comandi di investigazione contestuali.
                </p>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
