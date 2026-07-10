"use client";

import { useEffect, useState } from "react";
import { getAuthHeadersNoContent, apiUrl } from "@/lib/api";
import { useData } from "@/components/DataContext";

const INTER = { fontFamily: "Inter, sans-serif" };
const MONO = { fontFamily: "JetBrains Mono, Fira Code, monospace" };

interface Insight {
  id: string;
  root_cause: string;
  suggested_fix: string;
  confidence: number;
  created_at: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ ...INTER, fontSize: "10px", color: copied ? "#4ade80" : "#a0aab4", background: "none", border: "none", cursor: "pointer" }}>
      {copied ? "✓ copiato" : "copia"}
    </button>
  );
}

function InsightDeepAnalysis({ insights, selected }: { insights: Insight[]; selected: Insight | null }) {
  const [open, setOpen] = useState(true);

  if (insights.length === 0) {
    return (
      <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", overflow: "hidden" }}>
        <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: open ? "1px solid #1a1a1a" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#4ade80", opacity: 0.4 }} />
            <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>Come attivare gli AI Insights</span>
          </div>
          <span style={{ color: "#a0aab4", fontSize: "16px" }}>{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #222", borderRadius: "8px", padding: "16px 18px" }}>
              <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: "0 0 8px 0", fontWeight: 500 }}>Gli insights AI si attivano automaticamente.</p>
              <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: 0, lineHeight: 1.7 }}>
                Il sistema analizza i tuoi log e genera insights quando rileva almeno 5 eventi con lo stesso pattern di errore. Gli insights includono: causa radice, fix suggerito, e livello di confidenza.
              </p>
            </div>
            <div>
              <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Step per generare il primo insight</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { n: "1", title: "Integra l SDK", desc: "Invia log alla tua app usando l SDK npm o HTTP API." },
                  { n: "2", title: "Genera errori ripetuti", desc: "Il sistema si attiva dopo 5+ eventi con lo stesso pattern di errore." },
                  { n: "3", title: "Attendi l analisi", desc: "Gli insights vengono generati automaticamente ogni pochi minuti." },
                ].map(s => (
                  <div key={s.n} style={{ display: "flex", gap: "14px", backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "12px 16px" }}>
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: "#111", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ ...INTER, fontSize: "10px", color: "#4ade80", fontWeight: 700 }}>{s.n}</span>
                    </div>
                    <div>
                      <div style={{ ...INTER, fontSize: "12px", color: "#e6edf3", fontWeight: 500, marginBottom: "3px" }}>{s.title}</div>
                      <div style={{ ...INTER, fontSize: "11px", color: "#a0aab4", lineHeight: 1.6 }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Esempio invio log via HTTP</div>
                <CopyBtn text={`curl -X POST https://api.skopos.ink/v1/logs \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"level":"ERROR","service":"api","message":"Database connection timeout"}'`} />
              </div>
              <pre style={{ ...MONO, fontSize: "11px", color: "#4ade80", backgroundColor: "#080808", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "12px 14px", margin: 0, overflowX: "auto", lineHeight: 1.6 }}>{`curl -X POST https://api.skopos.ink/v1/logs \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"level":"ERROR","service":"api","message":"Database connection timeout"}'`}</pre>
            </div>
            <div style={{ backgroundColor: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "8px", padding: "12px 16px" }}>
              <p style={{ ...INTER, fontSize: "12px", color: "#4ade80", margin: 0, lineHeight: 1.7 }}>
                💡 Quando attivi il credito Anthropic, gli insights diventeranno analisi AI complete con causa radice precisa e fix contestuale per ogni pattern.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!selected) return null;

  const pct = Math.round(selected.confidence * 100);
  const confColor = pct >= 80 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", borderBottom: open ? "1px solid #1a1a1a" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: confColor }} />
          <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>Analisi insight selezionato</span>
          <span style={{ ...INTER, fontSize: "11px", color: confColor, backgroundColor: `${confColor}15`, border: `1px solid ${confColor}30`, borderRadius: "4px", padding: "1px 8px" }}>confidenza {pct}%</span>
        </div>
        <span style={{ color: "#a0aab4", fontSize: "16px" }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "16px 18px" }}>
            <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Causa radice identificata</div>
            <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: 0, lineHeight: 1.7 }}>{selected.root_cause}</p>
          </div>
          <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "-10px" }}>Livello di confidenza</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, height: "6px", backgroundColor: "#1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: confColor, borderRadius: "3px", transition: "width 0.4s ease" }} />
            </div>
            <span style={{ ...INTER, fontSize: "13px", fontWeight: 600, color: confColor, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Fix suggerito</div>
              <CopyBtn text={selected.suggested_fix} />
            </div>
            <pre style={{ ...MONO, fontSize: "11px", color: "#e6edf3", backgroundColor: "#080808", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "12px 14px", margin: 0, overflowX: "auto", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selected.suggested_fix}</pre>
          </div>
          <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "-10px" }}>Generato il</div>
          <div style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>{new Date(selected.created_at).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}</div>
          <div style={{ backgroundColor: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "8px", padding: "12px 16px" }}>
            <p style={{ ...INTER, fontSize: "12px", color: "#4ade80", margin: 0, lineHeight: 1.7 }}>
              💡 Con Anthropic attivo, gli insights includeranno analisi più approfondite con contesto storico e previsioni di ricorrenza.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiInsight() {
  const { insights: allInsights } = useData();
  const insights = allInsights.slice(0, 5);
  const [selected, setSelected] = useState<Insight | null>(null);

  useEffect(() => {
    if (insights.length > 0 && !selected) setSelected(insights[0]);
  }, [insights, selected]);

  const insightsList = Array.isArray(insights) ? insights : (insights as any)?.insights || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {insightsList.length === 0 ? (
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", height: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span style={{ fontSize: "24px" }}>✦</span>
          <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>Nessun insight ancora</span>
          <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>Gli insights appaiono dopo 5+ eventi con lo stesso pattern.</span>
        </div>
      ) : (
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", overflowY: "auto", maxHeight: "320px", padding: "8px" }}>
          {insightsList.map((ins: any) => (
            <div key={ins.id} onClick={() => setSelected(ins)} style={{
              cursor: "pointer", borderRadius: "8px", padding: "14px 16px", border: `1px solid ${selected?.id === ins.id ? "#4ade80" : "#1a1a1a"}`,
              backgroundColor: selected?.id === ins.id ? "rgba(74,222,128,0.04)" : "transparent",
              marginBottom: "6px", transition: "all 0.15s"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4" }}>{new Date(ins.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
                <span style={{ ...INTER, fontSize: "10px", fontWeight: 700, color: ins.confidence >= 0.8 ? "#4ade80" : ins.confidence >= 0.5 ? "#fbbf24" : "#f87171" }}>{Math.round(ins.confidence * 100)}% conf.</span>
              </div>
              <p style={{ ...INTER, fontSize: "12px", color: "#e6edf3", margin: 0, lineHeight: 1.6 }}>{ins.root_cause}</p>
            </div>
          ))}
        </div>
      )}
      <InsightDeepAnalysis insights={insightsList} selected={selected} />
    </div>
  );
}
