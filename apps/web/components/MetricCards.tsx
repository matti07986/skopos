"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuthHeadersNoContent, apiUrl } from "@/lib/api";
import { useProjects } from "@/components/ProjectContext";
import { useData } from "@/components/DataContext";

const INTER = { fontFamily: "'Inter', sans-serif" };

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return <svg width="56" height="28" />;
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const range = max - min || 1;
  const w = 56, h = 28, pad = 2;
  const xs = points.map((_, i) => pad + (i / (points.length - 1)) * (w - pad * 2));
  const ys = points.map(v => h - pad - ((v - min) / range) * (h - pad * 2));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

interface DrawerData {
  type: "errors" | "warnings" | "uptime" | "insights";
  total: number;
  peak: number;
  activeHours: number;
  topService: string;
  topPattern: string;
  uptime: number;
  totalEvents: number;
  errorEvents: number;
  insights: number;
  color: string;
}


function OverviewDrawer({ data, onClose, onNavigate }: {
  data: DrawerData;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}) {
  const [aiText, setAiText] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(true);
  const tabMap: Record<string, string> = {
    errors: "errors", warnings: "warnings", uptime: "errors", insights: "insights"
  };

  useEffect(() => {
    setAiLoading(true);
    setAiText("");
    const prompt = `Sei un assistente per developer. Analizza questi dati di monitoring e rispondi in 3-4 frasi chiare e utili in italiano.
Tipo metrica: ${data.type}
${data.type === "uptime" ? `Uptime: ${data.uptime.toFixed(1)}%, Totale eventi: ${data.totalEvents}, Errori: ${data.errorEvents}` : `Totale: ${data.total}, Picco/h: ${data.peak}, Ore attive: ${data.activeHours}/24, Servizio principale: ${data.topService || "n/a"}, Pattern: ${data.topPattern || "n/a"}`}
${data.type === "insights" ? `Insights generati: ${data.insights}` : ""}
Spiega cosa significano questi dati, la causa probabile se ci sono problemi, e cosa dovrebbe fare il developer.`;
    const token = localStorage.getItem("skopos_access_token") ?? "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/ai/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      credentials: "include",
      body: JSON.stringify({ prompt, max_tokens: 300 })
    })
    .then(r => r.json())
    .then(d => {
      setAiText(d?.text || "Analisi non disponibile.");
    })
    .catch(() => setAiText("Impossibile caricare l'analisi AI."))
    .finally(() => setAiLoading(false));
  }, [data.type, data.total, data.peak, data.topService, data.topPattern, data.uptime, data.totalEvents, data.errorEvents, data.insights]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const titles: Record<string, string> = {
    errors: "Errors · Last 24h",
    warnings: "Warnings · Last 24h",
    uptime: "Errors · Last 24h",
    insights: "AI Insights",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.4)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
        width: "min(440px, 92vw)",
        backgroundColor: "#0a0a0a",
        borderLeft: "1px solid #222",
        display: "flex", flexDirection: "column",
        animation: "slideInDrawer 0.22s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <style>{`@keyframes slideInDrawer { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: data.color }} />
            <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>{titles[data.type]}</span>
          </div>
          <button onClick={onClose} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

          {/* Valore principale */}
          <div style={{ marginBottom: "24px" }}>
            {data.type === "uptime" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ ...INTER, fontSize: "42px", fontWeight: 600, color: data.color, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}>{data.uptime.toFixed(1)}%</span>
                <div style={{ height: "6px", backgroundColor: "#1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${data.uptime}%`, backgroundColor: data.color, borderRadius: "3px" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {[
                    { label: "Total", value: String(data.totalEvents), c: "#e6edf3" },
                    { label: "Errors", value: String(data.errorEvents), c: data.errorEvents > 0 ? "#f87171" : "#a0aab4" },
                    { label: "Success", value: String(data.totalEvents - data.errorEvents), c: "#4ade80" },
                  ].map(k => (
                    <div key={k.label} style={{ backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "7px", padding: "10px 12px" }}>
                      <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>{k.label}</div>
                      <div style={{ ...INTER, fontSize: "18px", fontWeight: 600, color: k.c, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : data.type === "insights" ? (
              <span style={{ ...INTER, fontSize: "52px", fontWeight: 600, color: data.color, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}>{data.insights}</span>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <span style={{ ...INTER, fontSize: "52px", fontWeight: 600, color: data.color, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}>{data.total}</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  {[
                    { label: "Peak/h", value: String(data.peak) },
                    { label: "Active hours", value: `${data.activeHours}/24` },
                    { label: "Avg/h", value: data.total > 0 ? (data.total / 24).toFixed(1) : "0" },
                  ].map(k => (
                    <div key={k.label} style={{ backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "7px", padding: "10px 12px" }}>
                      <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>{k.label}</div>
                      <div style={{ ...INTER, fontSize: "16px", fontWeight: 600, color: data.color, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
                    </div>
                  ))}
                </div>
                {data.topService && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "7px", padding: "10px 14px" }}>
                    <span style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", flexShrink: 0 }}>Top service</span>
                    <span style={{ ...INTER, fontSize: "12px", color: "#4ade80", fontWeight: 500 }}>{data.topService}</span>
                  </div>
                )}
                {data.topPattern && (
                  <div style={{ backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "7px", padding: "10px 14px" }}>
                    <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Pattern ricorrente</div>
                    <div style={{ ...INTER, fontSize: "12px", color: "#e6edf3" }}>{data.topPattern}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Analisi AI */}
          <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #222", borderRadius: "10px", padding: "16px 18px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#4ade80" }} />
              <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Analisi AI</span>
            </div>
            {aiLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[100, 85, 70].map((w, i) => (
                  <div key={i} style={{ height: "12px", backgroundColor: "#1a1a1a", borderRadius: "4px", width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite" }} />
                ))}
                <style>{`@keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:0.8 } }`}</style>
              </div>
            ) : (
              <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: 0, lineHeight: 1.7 }}>{aiText}</p>
            )}
          </div>

        </div>

        {/* Footer CTA */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #1a1a1a", flexShrink: 0 }}>
            <button
              onClick={() => { onNavigate(tabMap[data.type] || "errors"); onClose(); }}
              style={{ ...INTER, width: "100%", padding: "10px", backgroundColor: "#4ade80", color: "#000", fontSize: "12px", fontWeight: 700, border: "none", borderRadius: "7px", cursor: "pointer" }}
            >
              Vai a {titles[data.type]} →
            </button>
          </div>
      </div>
    </>
  );
}

export default function MetricCards({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const [errors, setErrors] = useState(0);
  const [warnings, setWarnings] = useState(0);
  const [insights, setInsights] = useState(0);
  const [uptime, setUptime] = useState<number | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [errorEvents, setErrorEvents] = useState(0);
  const [topService, setTopService] = useState("");
  const [topPattern, setTopPattern] = useState("");
  const [warnTopService, setWarnTopService] = useState("");
  const [warnTopPattern, setWarnTopPattern] = useState("");
  const [errActiveHours, setErrActiveHours] = useState(0);
  const [warnActiveHours, setWarnActiveHours] = useState(0);
  const [errPeak, setErrPeak] = useState(0);
  const [warnPeak, setWarnPeak] = useState(0);
  const [prevErrors, setPrevErrors] = useState<number | null>(null);
  const [prevWarnings, setPrevWarnings] = useState<number | null>(null);
  const [errHistory, setErrHistory] = useState<number[]>([]);
  const [warnHistory, setWarnHistory] = useState<number[]>([]);
  const [uptHistory, setUptHistory] = useState<number[]>([]);
  const [drawer, setDrawer] = useState<DrawerData | null>(null);

  const { activeProject } = useProjects();
  const { logs: allLogs, insights: allInsights } = useData();

  useEffect(() => {
    // Filtra log dal context invece di rifare fetch
    const errs = allLogs.filter(l => l.level === "ERROR");
    const warns = allLogs.filter(l => l.level === "WARN");

    // ERRORS
    const errCount = errs.length;
    setErrors(prev => { setPrevErrors(prev); return errCount; });
    setErrHistory(h => [...h.slice(-11), errCount]);
    {
      const svcMap = new Map<string, number>();
      const msgMap = new Map<string, number>();
      const now = new Date();
      const buckets = new Map<string, number>();
      for (let i = 23; i >= 0; i--) { const dd = new Date(now); dd.setHours(dd.getHours() - i, 0, 0, 0); buckets.set(`${String(dd.getHours()).padStart(2,"0")}:00`, 0); }
      for (const ev of errs) {
        if (ev.service) svcMap.set(ev.service, (svcMap.get(ev.service) ?? 0) + 1);
        if (ev.message) msgMap.set(ev.message, (msgMap.get(ev.message) ?? 0) + 1);
        const key = `${String(new Date(ev.timestamp).getHours()).padStart(2,"0")}:00`;
        if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      const bucketVals = Array.from(buckets.values());
      setErrPeak(Math.max(...bucketVals, 0));
      setErrActiveHours(bucketVals.filter(v => v > 0).length);
      setTopService(svcMap.size > 0 ? Array.from(svcMap.entries()).sort((a,b)=>b[1]-a[1])[0][0] : "");
      setTopPattern(msgMap.size > 0 ? Array.from(msgMap.entries()).sort((a,b)=>b[1]-a[1])[0][0] : "");
    }

    // WARNINGS
    const warnCount = warns.length;
    setWarnings(prev => { setPrevWarnings(prev); return warnCount; });
    setWarnHistory(h => [...h.slice(-11), warnCount]);
    {
      const svcMap = new Map<string, number>();
      const msgMap = new Map<string, number>();
      const now = new Date();
      const buckets = new Map<string, number>();
      for (let i = 23; i >= 0; i--) { const dd = new Date(now); dd.setHours(dd.getHours() - i, 0, 0, 0); buckets.set(`${String(dd.getHours()).padStart(2,"0")}:00`, 0); }
      for (const ev of warns) {
        if (ev.service) svcMap.set(ev.service, (svcMap.get(ev.service) ?? 0) + 1);
        if (ev.message) msgMap.set(ev.message, (msgMap.get(ev.message) ?? 0) + 1);
        const key = `${String(new Date(ev.timestamp).getHours()).padStart(2,"0")}:00`;
        if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
      }
      const bucketVals = Array.from(buckets.values());
      setWarnPeak(Math.max(...bucketVals, 0));
      setWarnActiveHours(bucketVals.filter(v => v > 0).length);
      setWarnTopService(svcMap.size > 0 ? Array.from(svcMap.entries()).sort((a,b)=>b[1]-a[1])[0][0] : "");
      setWarnTopPattern(msgMap.size > 0 ? Array.from(msgMap.entries()).sort((a,b)=>b[1]-a[1])[0][0] : "");
    }

    // INSIGHTS
    setInsights(allInsights.length);

    // UPTIME
    const total = allLogs.length;
    setTotalEvents(total);
    setErrorEvents(errCount);
    const upt = total === 0 ? 100 : Math.round(((total - errCount) / total) * 1000) / 10;
    setUptime(upt);
    setUptHistory(h => [...h.slice(-11), upt]);
  }, [allLogs, allInsights]);

  const errDelta = prevErrors === null || prevErrors === errors ? null : errors - prevErrors;
  const warnDelta = prevWarnings === null || prevWarnings === warnings ? null : warnings - prevWarnings;
  const uptColor = uptime === null ? "#a0aab4" : uptime > 95 ? "#4ade80" : uptime > 80 ? "#fbbf24" : "#f87171";

  function openDrawer(type: DrawerData["type"]) {
    setDrawer({
      type, total: type === "errors" ? errors : warnings,
      peak: type === "errors" ? errPeak : warnPeak,
      activeHours: type === "errors" ? errActiveHours : warnActiveHours,
      topService: type === "errors" ? topService : warnTopService,
      topPattern: type === "errors" ? topPattern : warnTopPattern,
      uptime: uptime ?? 100, totalEvents, errorEvents,
      insights,
      color: type === "errors" ? "#f87171" : type === "warnings" ? "#fbbf24" : type === "uptime" ? uptColor : "#4ade80",
    });
  }

  const items = [
    { type: "errors" as const, label: "ERRORS · 1H", value: String(errors), valueColor: errors > 0 ? "#f87171" : "#e6edf3", deltaLabel: errDelta === null ? "" : errDelta > 0 ? `+${errDelta}` : String(errDelta), deltaColor: errDelta === null ? "transparent" : errDelta > 0 ? "#f87171" : "#4ade80", sparkColor: "#f87171", history: errHistory },
    { type: "warnings" as const, label: "WARNINGS · 1H", value: String(warnings), valueColor: warnings > 0 ? "#fbbf24" : "#e6edf3", deltaLabel: warnDelta === null ? "" : warnDelta > 0 ? `+${warnDelta}` : String(warnDelta), deltaColor: warnDelta === null ? "transparent" : warnDelta > 0 ? "#fbbf24" : "#4ade80", sparkColor: "#fbbf24", history: warnHistory },
    { type: "uptime" as const, label: "UPTIME · LAST 24H", value: uptime === null ? "—" : `${uptime.toFixed(1)}%`, valueColor: uptColor, deltaLabel: "", deltaColor: "transparent", sparkColor: uptColor, history: uptHistory },
    { type: "insights" as const, label: "AI INSIGHTS", value: String(insights), valueColor: insights > 0 ? "#4ade80" : "#a0aab4", deltaLabel: insights > 0 ? "active" : "idle", deltaColor: insights > 0 ? "#4ade80" : "#a0aab4", sparkColor: "#4ade80", history: [] },
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(50%, 160px), 1fr))", backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", overflow: "hidden" }}>
        {items.map((item, i) => (
          <div
            key={item.label}
            onClick={() => openDrawer(item.type)}
            style={{ padding: "12px 14px", borderRight: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", cursor: "pointer", transition: "background-color 0.15s", minWidth: 0 }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#111")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ ...INTER, fontSize: "9px", letterSpacing: "0.08em", color: "#a0aab4", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "7px" }}>
                <span style={{ ...INTER, fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 600, color: item.valueColor, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>{item.value}</span>
                {item.deltaLabel && <span style={{ ...INTER, fontSize: "11px", fontWeight: 600, color: item.deltaColor }}>{item.deltaLabel}</span>}
              </div>
            </div>
            {item.history.length >= 2 ? <Sparkline points={item.history} color={item.sparkColor} /> : (
              <div style={{ width: "56px", height: "28px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: item.valueColor, opacity: 0.5 }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {drawer && (
        <OverviewDrawer
          data={drawer}
          onClose={() => setDrawer(null)}
          onNavigate={(tab) => { onTabChange?.(tab); }}
        />
      )}
    </>
  );
}
