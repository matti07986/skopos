"use client";
import { useEffect, useState, useCallback } from "react";
import { getAuthHeadersNoContent, apiUrl } from "@/lib/api";
import { useProjects } from "@/components/ProjectContext";
type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";
type LevelFilter = LogLevel | "ALL";
export interface LogEvent {
  id: string; timestamp: string; level: LogLevel; service: string; message: string; metadata?: Record<string, unknown>;
}
export interface PatternGroup {
  message: string; level: LogLevel; service: string; count: number;
  firstSeen: string; lastSeen: string; events: LogEvent[];
}
const INTER = { fontFamily: "Inter, sans-serif" };
const MONO  = { fontFamily: "JetBrains Mono, Fira Code, monospace" };
const levelColor: Record<LogLevel, string> = { ERROR: "#f87171", WARN: "#fbbf24", INFO: "#4ade80", DEBUG: "#a0aab4" };
const levelBg: Record<LogLevel, string> = { ERROR: "rgba(248,113,113,0.08)", WARN: "rgba(251,191,36,0.08)", INFO: "rgba(74,222,128,0.08)", DEBUG: "rgba(74,85,104,0.08)" };
function groupByPattern(logs: LogEvent[]): PatternGroup[] {
  const map = new Map<string, PatternGroup>();
  for (const log of logs) {
    const key = `${log.level}::${log.service}::${log.message}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      existing.events.push(log);
      if (log.timestamp < existing.firstSeen) existing.firstSeen = log.timestamp;
      if (log.timestamp > existing.lastSeen) existing.lastSeen = log.timestamp;
    } else {
      map.set(key, { message: log.message, level: log.level, service: log.service, count: 1, firstSeen: log.timestamp, lastSeen: log.timestamp, events: [log] });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
function fmtTime(ts: string) {
  const tz = typeof window !== "undefined" ? (localStorage.getItem("skopos_timezone") ?? "UTC") : "UTC";
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false, timeZone: tz });
}
function fmtDate(ts: string) {
  const tz = typeof window !== "undefined" ? (localStorage.getItem("skopos_timezone") ?? "UTC") : "UTC";
  return new Date(ts).toLocaleString("en-GB", { hour12: false, timeZone: tz, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: copied ? "#4ade80" : "#a0aab4", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
      {copied ? "✓ copiato" : "copia"}
    </button>
  );
}

function LogDrawerAnalysis({ log }: { log: LogEvent }) {
  const INTER2 = { fontFamily: "Inter, sans-serif" };
  const MONO2 = { fontFamily: "JetBrains Mono, Fira Code, monospace" };
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState("");
  const [cause, setCause] = useState("");
  const [command, setCommand] = useState("");
  const [fix, setFix] = useState("");

  useEffect(() => {
    setLoading(true);
    const prompt = `Sei un assistente per developer. Analizza questo log event e rispondi SOLO con un JSON valido senza markdown, con questi campi esatti:
{
  "explanation": "spiegazione del problema in 1-2 frasi",
  "cause": "causa probabile in 1-2 frasi",
  "command": "comando bash singolo per investigare",
  "fix": "snippet di codice fix se applicabile, stringa vuota se non serve"
}

Log da analizzare:
- Level: ${log.level}
- Service: ${log.service}
- Message: ${log.message}
- Timestamp: ${log.timestamp}
${log.metadata && Object.keys(log.metadata).length > 0 ? "- Metadata: " + JSON.stringify(log.metadata) : ""}

Rispondi solo con il JSON, niente altro.`;

    const token = localStorage.getItem("skopos_access_token") ?? "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/ai/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      credentials: "include",
      body: JSON.stringify({ prompt, max_tokens: 500 })
    })
    .then(r => r.json())
    .then(d => {
      let text = d?.text || "{}";
      text = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
      try {
        const parsed = JSON.parse(text);
        setExplanation(parsed.explanation || "Analisi non disponibile.");
        setCause(parsed.cause || "");
        setCommand(parsed.command || "");
        setFix(parsed.fix || "");
      } catch {
        setExplanation(text);
      }
    })
    .catch(() => setExplanation("Impossibile caricare l'analisi AI."))
    .finally(() => setLoading(false));
  }, [log.id]);

  const Skeleton = ({ w = "100%" }: { w?: string }) => (
    <div style={{ height: "12px", backgroundColor: "#1a1a1a", borderRadius: "4px", width: w, animation: "pulse 1.5s ease-in-out infinite" }} />
  );

  return (
    <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #222", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <style>{`@keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:0.8 } }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: log.level === "ERROR" ? "#f87171" : log.level === "WARN" ? "#fbbf24" : "#4ade80" }} />
        <span style={{ ...INTER2, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Analisi AI</span>
        {loading && <span style={{ ...INTER2, fontSize: "10px", color: "#555", marginLeft: "auto" }}>generando...</span>}
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Skeleton w="90%" /><Skeleton w="75%" /><Skeleton w="60%" />
        </div>
      ) : (
        <p style={{ ...INTER2, fontSize: "12px", color: "#e6edf3", margin: 0, lineHeight: 1.7 }}>{explanation}</p>
      )}
      {!loading && cause && (
        <div>
          <div style={{ ...INTER2, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>Causa probabile</div>
          <p style={{ ...INTER2, fontSize: "12px", color: "#a0aab4", margin: 0, lineHeight: 1.7 }}>{cause}</p>
        </div>
      )}
      {!loading && command && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
            <span style={{ ...INTER2, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Comando investigazione</span>
            <CopyBtn text={command} />
          </div>
          <pre style={{ ...MONO2, fontSize: "11px", color: "#4ade80", backgroundColor: "#080808", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "10px 12px", margin: 0, overflowX: "auto", lineHeight: 1.6 }}>{command}</pre>
        </div>
      )}
      {!loading && fix && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
            <span style={{ ...INTER2, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Fix consigliato</span>
            <CopyBtn text={fix} />
          </div>
          <pre style={{ ...MONO2, fontSize: "11px", color: "#e6edf3", backgroundColor: "#080808", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "10px 12px", margin: 0, overflowX: "auto", lineHeight: 1.6 }}>{fix}</pre>
        </div>
      )}
    </div>
  );
}


export function LogDrawer({ log, onClose }: { log: LogEvent; onClose: () => void }) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const fullDate = fmtDate(log.timestamp);
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  function copyId() { navigator.clipboard.writeText(log.id); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }
  function copyJson() { navigator.clipboard.writeText(JSON.stringify(log, null, 2)); setCopiedJson(true); setTimeout(() => setCopiedJson(false), 2000); }
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "min(480px, 92vw)", backgroundColor: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", animation: "slideIn 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ ...INTER, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "3px", color: levelColor[log.level], backgroundColor: levelBg[log.level], letterSpacing: "0.05em" }}>{log.level}</span>
            <span style={{ ...INTER, fontSize: "12px", color: "#4ade80" }}>{log.service}</span>
          </div>
          <button onClick={onClose} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "2px 6px" }} title="Esc">x</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Message</div>
            <div style={{ ...INTER, fontSize: "13px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "12px 14px", wordBreak: "break-word", lineHeight: "1.6" }}>{log.message}</div>
          </div>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", borderRadius: "6px", overflow: "hidden", border: "1px solid #1a1a1a" }}>
              {[{ label: "Timestamp", value: fullDate }, { label: "Level", value: log.level }, { label: "Service", value: log.service }].map(row => (
                <div key={row.label} style={{ display: "flex", gap: "12px", padding: "9px 14px", backgroundColor: "#0d0d0d", borderBottom: "1px solid #111" }}>
                  <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", width: "80px", flexShrink: 0 }}>{row.label}</span>
                  <span style={{ ...MONO, fontSize: "11px", color: "#e6edf3", wordBreak: "break-all" }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 14px", backgroundColor: "#0d0d0d" }}>
                <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", width: "80px", flexShrink: 0 }}>ID</span>
                <span style={{ ...MONO, fontSize: "11px", color: "#e6edf3", wordBreak: "break-all", flex: 1 }}>{log.id}</span>
                <button onClick={copyId} style={{ ...INTER, fontSize: "10px", color: copiedId ? "#4ade80" : "#a0aab4", background: "none", border: "1px solid #1a1a1a", borderRadius: "3px", padding: "2px 8px", cursor: "pointer", flexShrink: 0 }}>{copiedId ? "Copied!" : "Copy"}</button>
              </div>
            </div>
          </div>
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Metadata</div>
              <pre style={{ ...MONO, fontSize: "11px", color: "#a0aab4", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "12px 14px", overflowX: "auto", margin: 0, lineHeight: "1.6" }}>{JSON.stringify(log.metadata, null, 2)}</pre>
            </div>
          )}
          <LogDrawerAnalysis log={log} />
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #1a1a1a", flexShrink: 0 }}>
          <button onClick={copyJson} style={{ ...INTER, width: "100%", fontSize: "11px", fontWeight: 600, color: copiedJson ? "#4ade80" : "#a0aab4", backgroundColor: "transparent", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px", cursor: "pointer" }}>{copiedJson ? "Copied!" : "Copy JSON"}</button>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}
export function PatternDrawer({ group, onClose }: { group: PatternGroup; onClose: () => void }) {
  const [selectedLog, setSelectedLog] = useState<LogEvent | null>(null);
  const sorted = [...group.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape" && !selectedLog) onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, selectedLog]);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "min(560px, 95vw)", backgroundColor: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", animation: "slideIn 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ ...INTER, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "3px", color: levelColor[group.level], backgroundColor: levelBg[group.level] }}>{group.level}</span>
            <span style={{ ...INTER, fontSize: "11px", color: "#4ade80" }}>{group.service}</span>
            <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>{group.count} occurrences</span>
          </div>
          <button onClick={onClose} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "2px 6px" }}>x</button>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ ...MONO, fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "12px 14px", wordBreak: "break-all", lineHeight: "1.6", marginBottom: "12px" }}>{group.message}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1px", borderRadius: "5px", overflow: "hidden", border: "1px solid #111" }}>
            {[
              { label: "Occurrences", value: String(group.count), color: levelColor[group.level] },
              { label: "First seen", value: fmtDate(group.firstSeen), color: "#a0aab4" },
              { label: "Last seen", value: fmtDate(group.lastSeen), color: "#a0aab4" },
            ].map(k => (
              <div key={k.label} style={{ backgroundColor: "#0d0d0d", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.label}</span>
                <span style={{ ...INTER, fontSize: "12px", fontWeight: 700, color: k.color }}>{k.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 10px 4px", fontWeight: 600 }}>All occurrences</div>
          {sorted.map((ev, i) => (
            <div key={ev.id ?? i} onClick={() => setSelectedLog(ev)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 10px", borderRadius: "4px", cursor: "pointer", borderBottom: "1px solid #0d0d0d" }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#111")} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
              <span style={{ ...MONO, fontSize: "11px", color: "#a0aab4", flexShrink: 0, minWidth: "56px", fontVariantNumeric: "tabular-nums" }}>{fmtTime(ev.timestamp)}</span>
              <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", flexShrink: 0, width: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.service}</span>
              <span style={{ ...MONO, fontSize: "10px", color: "#a0aab4", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.id}</span>
              <span style={{ color: "#2a2a2a", fontSize: "10px", flexShrink: 0 }}>›</span>
            </div>
          ))}
        </div>
      </div>
      {selectedLog && <LogDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}
function useLogStream(level: LevelFilter, service: string) {
  const { activeProject } = useProjects();
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (level !== "ALL") params.set("level", level);
      if (service.trim()) params.set("service", service.trim());
      if (activeProject?.id) params.set("project_id", activeProject.id);
      const res = await fetch(`${apiUrl}/v1/logs?${params}`, { headers: getAuthHeadersNoContent(), credentials: "include" });
      if (!res.ok) return;
      setLogs(await res.json());
    } catch {}
  }, [level, service]);
  useEffect(() => { fetchLogs(); const t = setInterval(fetchLogs, 5000); return () => clearInterval(t); }, [fetchLogs]);
  return logs;
}
export default function LogStream({ onLogsChange }: { onLogsChange?: (logs: LogEvent[]) => void } = {}) {
  const [level, setLevel] = useState<LevelFilter>("ALL");
  const [service, setService] = useState("");
  const [grouped, setGrouped] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEvent | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<PatternGroup | null>(null);
  const logs = useLogStream(level, service);
  const groups = groupByPattern(logs);
  useEffect(() => { onLogsChange?.(logs); }, [logs, onLogsChange]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ position: "relative" }}>
          <select value={level} onChange={e => setLevel(e.target.value as LevelFilter)} style={{ ...INTER, backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", color: level === "ALL" ? "#a0aab4" : levelColor[level as LogLevel] ?? "#a0aab4", fontSize: "11px", borderRadius: "5px", padding: "5px 10px", cursor: "pointer", outline: "none", appearance: "none", paddingRight: "24px" }}>
            {(["ALL", "ERROR", "WARN", "INFO", "DEBUG"] as LevelFilter[]).map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <span style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", color: "#a0aab4", fontSize: "9px", pointerEvents: "none" }}>v</span>
        </div>
        <input type="text" value={service} onChange={e => setService(e.target.value)} placeholder="filter by service..." style={{ ...INTER, flex: 1, backgroundColor: "#0a0a0a", border: "1px solid #222", color: "#e6edf3", fontSize: "11px", borderRadius: "7px", padding: "5px 10px", outline: "none" }} />
        <button onClick={() => setGrouped(v => !v)} style={{ ...INTER, fontSize: "10px", fontWeight: 600, padding: "5px 10px", borderRadius: "5px", border: "1px solid #1a1a1a", backgroundColor: grouped ? "#1a1a1a" : "transparent", color: grouped ? "#4ade80" : "#a0aab4", cursor: "pointer", whiteSpace: "nowrap" }}>{grouped ? "Grouped" : "Raw"}</button>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#4ade80", animation: "pulse 2s infinite" }} />
          <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4" }}>live</span>
        </div>
      </div>
      {logs.length === 0 ? (
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", height: "320px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span style={{ ...INTER, fontSize: "13px", color: "#a0aab4" }}>{"No logs yet"}</span>
          <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>Send your first event via SDK or HTTP</span>
        </div>
      ) : grouped ? (
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", height: "320px", overflowY: "auto", padding: "4px" }}>
          {groups.map((g, i) => (
            <div key={i} onClick={() => setSelectedGroup(g)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "4px", cursor: "pointer", transition: "background-color 0.1s", borderBottom: "1px solid #0d0d0d" }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#111")} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
              <span style={{ ...INTER, fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "3px", color: levelColor[g.level], backgroundColor: levelBg[g.level], flexShrink: 0, width: "40px", textAlign: "center" }}>{g.level}</span>
              <span style={{ ...INTER, fontSize: "10px", color: "#4ade80", flexShrink: 0, width: "70px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.service}</span>
              <span style={{ ...INTER, fontSize: "11px", color: "#e6edf3", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.message}</span>
              <span style={{ ...INTER, fontSize: "10px", fontWeight: 700, color: levelColor[g.level], backgroundColor: levelBg[g.level], padding: "1px 7px", borderRadius: "10px", flexShrink: 0 }}>x{g.count}</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
                <span style={{ ...MONO, fontSize: "9px", color: "#a0aab4" }}>last {fmtTime(g.lastSeen)}</span>
              </div>
              <span style={{ color: "#2a2a2a", fontSize: "10px", flexShrink: 0 }}>›</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", height: "320px", overflowY: "auto", padding: "4px" }}>
          {logs.map(log => (
            <div key={log.id} onClick={() => setSelectedLog(log)} style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", transition: "background-color 0.1s" }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#111111")} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
              <span style={{ ...MONO, fontSize: "10px", color: "#a0aab4", flexShrink: 0, fontVariantNumeric: "tabular-nums", minWidth: "52px" }}>{fmtTime(log.timestamp)}</span>
              <span style={{ ...INTER, fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "3px", color: levelColor[log.level], backgroundColor: levelBg[log.level], flexShrink: 0, width: "40px", textAlign: "center", letterSpacing: "0.05em" }}>{log.level}</span>
              <span style={{ ...INTER, fontSize: "10px", color: "#4ade80", flexShrink: 0, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.service}</span>
              <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.message}</span>
              <span style={{ marginLeft: "auto", color: "#2a2a2a", fontSize: "10px", flexShrink: 0 }}>›</span>
            </div>
          ))}
        </div>
      )}
      {selectedLog && <LogDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
      {selectedGroup && <PatternDrawer group={selectedGroup} onClose={() => setSelectedGroup(null)} />}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}