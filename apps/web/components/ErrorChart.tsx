"use client";
import { useEffect, useState, useCallback } from "react";
import { DeepAnalysis } from "@/components/DeepAnalysis";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { getAuthHeadersNoContent, apiUrl } from "@/lib/api";
import { useProjects } from "@/components/ProjectContext";
import { useData } from "@/components/DataContext";
import { LogDrawer, PatternDrawer } from "@/components/LogStream";
import type { LogEvent, PatternGroup } from "@/components/LogStream";
const INTER = { fontFamily: "Inter, sans-serif" };
const MONO  = { fontFamily: "JetBrains Mono, Fira Code, monospace" };

const CHART_RANGES: Record<string, { value: string; label: string; minutes: number }[]> = {
  starter: [
    { value: "24h", label: "24h", minutes: 1440 },
  ],
  indie: [
    { value: "24h", label: "24h", minutes: 1440 },
    { value: "6h",  label: "6h",  minutes: 360  },
    { value: "1h",  label: "1h",  minutes: 60   },
  ],
  pro: [
    { value: "24h",   label: "24h",   minutes: 1440 },
    { value: "6h",    label: "6h",    minutes: 360  },
    { value: "1h",    label: "1h",    minutes: 60   },
    { value: "30min", label: "30m",   minutes: 30   },
  ],
  business: [
    { value: "24h",   label: "24h",   minutes: 1440 },
    { value: "6h",    label: "6h",    minutes: 360  },
    { value: "1h",    label: "1h",    minutes: 60   },
    { value: "30min", label: "30m",   minutes: 30   },
    { value: "10min", label: "10m",   minutes: 10   },
    { value: "1min",  label: "1m",    minutes: 1    },
  ],
};
interface ChartPoint { hour: string; value: number; }
function buildHourlyBuckets(events: LogEvent[]): ChartPoint[] {
  const now = new Date();
  const buckets = new Map<string, number>();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now); d.setHours(d.getHours() - i, 0, 0, 0);
    buckets.set(`${String(d.getHours()).padStart(2, "0")}:00`, 0);
  }
  for (const ev of events) {
    const key = `${String(new Date(ev.timestamp).getHours()).padStart(2, "0")}:00`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([hour, value]) => ({ hour, value }));
}
function HourDrawer({ hour, events, color, onClose }: { hour: string; events: LogEvent[]; color: string; onClose: () => void }) {
  const filtered = events.filter(ev => `${String(new Date(ev.timestamp).getHours()).padStart(2, "0")}:00` === hour);
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "min(520px, 92vw)", backgroundColor: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", animation: "slideIn 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ ...MONO, fontSize: "13px", color, fontWeight: 700 }}>{hour}</span>
            <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>{filtered.length} events</span>
          </div>
          <button onClick={onClose} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "2px 6px" }}>x</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {filtered.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}><span style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>No events this hour</span></div>
          ) : filtered.map((ev, i) => (
            <div key={ev.id ?? i} style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "6px 10px", borderRadius: "4px", borderBottom: "1px solid #0d0d0d" }}>
              <span style={{ ...MONO, fontSize: "10px", color: "#a0aab4", flexShrink: 0, minWidth: "52px" }}>{new Date(ev.timestamp).toLocaleTimeString("en-GB", { hour12: false })}</span>
              <span style={{ ...INTER, fontSize: "10px", color, flexShrink: 0, width: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.service}</span>
              <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.message}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}
function ServiceBreakdown({ events, color }: { events: LogEvent[]; color: string }) {
  const counts = new Map<string, number>();
  for (const ev of events) { if (!ev.service) continue; counts.set(ev.service, (counts.get(ev.service) ?? 0) + 1); }
  const rows = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = rows[0]?.[1] ?? 1;
  if (rows.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>By Service</span>
      {rows.map(([svc, cnt]) => (
        <div key={svc} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", width: "90px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{svc}</span>
          <div style={{ flex: 1, height: "3px", backgroundColor: "#111", borderRadius: "2px" }}>
            <div style={{ height: "100%", width: `${(cnt / max) * 100}%`, backgroundColor: color, borderRadius: "2px", transition: "width 0.3s" }} />
          </div>
          <span style={{ ...INTER, fontSize: "10px", color, fontWeight: 700, width: "28px", textAlign: "right", flexShrink: 0 }}>{cnt}</span>
        </div>
      ))}
    </div>
  );
}
function HourlyPeak({ data, color }: { data: ChartPoint[]; color: string }) {
  const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, 3).filter(p => p.value > 0);
  if (sorted.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Peak Hours</span>
      <div style={{ display: "flex", gap: "8px" }}>
        {sorted.map((p, i) => (
          <div key={p.hour} style={{ flex: 1, backgroundColor: "#0d0d0d", border: "1px solid #111", borderRadius: "5px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ ...MONO, fontSize: "18px", fontWeight: 700, color: i === 0 ? color : "#a0aab4" }}>{p.value}</span>
            <span style={{ ...INTER, fontSize: "9px", color: "#a0aab4" }}>{p.hour}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function ChartSection({ title, total, peak, data, events, loading, color, emptyMsg, plan }: {
  title: string; total: number; peak: number; data: ChartPoint[]; events: LogEvent[]; loading: boolean; color: string; emptyMsg: string; plan: string;
}) {
  const [hourDrawer, setHourDrawer] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEvent | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<PatternGroup | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRange, setModalRange] = useState<string>("24h");
  const activeHours = data.filter(p => p.value > 0).length;
  const patternMap = new Map<string, PatternGroup>();
  for (const ev of events) {
    const key = ev.message;
    const existing = patternMap.get(key);
    if (existing) { existing.count++; existing.events.push(ev); if (ev.timestamp > existing.lastSeen) existing.lastSeen = ev.timestamp; if (ev.timestamp < existing.firstSeen) existing.firstSeen = ev.timestamp; }
    else { patternMap.set(key, { message: ev.message, level: ev.level, service: ev.service, count: 1, firstSeen: ev.timestamp, lastSeen: ev.timestamp, events: [ev] }); }
  }
  const patterns = Array.from(patternMap.values()).sort((a, b) => b.count - a.count);
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", padding: "20px 20px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>{title}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                <span style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total</span>
                <span style={{ ...INTER, fontSize: "16px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{total}</span>
              </div>
              <div style={{ width: "1px", background: "#222", alignSelf: "stretch" }} />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                <span style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Peak/h</span>
                <span style={{ ...INTER, fontSize: "16px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{peak}</span>
              </div>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              title="Expand chart"
              style={{ background: "none", border: "1px solid #222", borderRadius: "5px", color: "#a0aab4", cursor: "pointer", padding: "4px 7px", fontSize: "12px", lineHeight: 1, transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#444"; (e.currentTarget as HTMLButtonElement).style.color = "#e6edf3"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#222"; (e.currentTarget as HTMLButtonElement).style.color = "#a0aab4"; }}
            >⤢</button>
          </div>
        </div>
        {loading ? (
          <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>loading...</span></div>
        ) : total === 0 ? (
          <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>{emptyMsg}</span></div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} margin={{ top: 4, right: 0, left: -28, bottom: 0 }} barCategoryGap="60%" onClick={(d) => { if (d?.activePayload?.[0]?.payload?.value > 0) setHourDrawer(d.activePayload?.[0].payload.hour); }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#222" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: "#a0aab4", fontSize: 9, fontFamily: "Inter, sans-serif" }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fill: "#a0aab4", fontSize: 9, fontFamily: "Inter, sans-serif" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Bar dataKey="value" radius={[1, 1, 0, 0]} cursor="pointer" isAnimationActive={false}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.value === peak && peak > 0 ? color : `${color}30`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      {!loading && total > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", display: "flex", overflow: "hidden" }}>
            {[
              { label: "Total", value: String(total) },
              { label: "Peak / hour", value: String(peak) },
              { label: "Active hours", value: `${activeHours}/24` },
              { label: "Avg / hour", value: (total / 24).toFixed(1) },
            ].map((kpi, i) => (
              <div key={kpi.label} style={{ flex: 1, padding: "14px 18px", display: "flex", flexDirection: "column", gap: "5px", borderRight: i < 3 ? "1px solid #1a1a1a" : "none" }}>
                <span style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>{kpi.label}</span>
                <span style={{ ...INTER, fontSize: "18px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>{kpi.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", padding: "16px 20px" }}>
              <ServiceBreakdown events={events} color={color} />
            </div>
            <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", padding: "16px 20px" }}>
              <HourlyPeak data={data} color={color} />
            </div>
          </div>
          {patterns.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Patterns</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", borderRadius: "5px", overflow: "hidden", border: "1px solid #111" }}>
                {patterns.map((g, i) => (
                  <div key={i} onClick={() => setSelectedGroup(g)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", backgroundColor: "#0d0d0d", borderBottom: "1px solid #111", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#111")} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#0d0d0d")}>
                    <span style={{ ...INTER, fontSize: "11px", color: "#e6edf3", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.message}</span>
                    <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", flexShrink: 0, whiteSpace: "nowrap" }}>last {new Date(g.lastSeen).toLocaleTimeString("en-GB", { hour12: false })}</span>
                    <span style={{ ...INTER, fontSize: "10px", fontWeight: 700, color, backgroundColor: `${color}22`, padding: "1px 8px", borderRadius: "10px", flexShrink: 0 }}>x{g.count}</span>
                    <span style={{ color: "#2a2a2a", fontSize: "10px", flexShrink: 0 }}>›</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DeepAnalysis
            type={color === "#f87171" ? "errors" : "warnings"}
            events={events}
            patterns={patterns.map(p => ({ message: p.message, service: p.service, count: p.count }))}
            total={total}
            peak={peak}
            activeHours={activeHours}
          />
        </div>
      )}
      {modalOpen && (
        <div onClick={() => setModalOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 300, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "14px", width: "100%", maxWidth: "1100px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color }} />
                <span style={{ ...INTER, fontSize: "15px", color: "#e6edf3", fontWeight: 500 }}>{title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", gap: "4px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "3px" }}>
                  {(CHART_RANGES[plan] ?? CHART_RANGES.starter).map(r => (
                    <button key={r.value} onClick={() => setModalRange(r.value)} style={{ ...INTER, fontSize: "11px", padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer", backgroundColor: modalRange === r.value ? "#222" : "transparent", color: modalRange === r.value ? "#e6edf3" : "#a0aab4", fontWeight: modalRange === r.value ? 600 : 400 }}>{r.label}</button>
                  ))}
                </div>
                <button onClick={() => setModalOpen(false)} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "2px 6px" }}>×</button>
              </div>
            </div>
            {/* Modal body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Grafico grande */}
              <div style={{ backgroundColor: "#060606", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "20px 20px 12px" }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={(() => { const ranges = CHART_RANGES[plan] ?? CHART_RANGES.starter; const found = ranges.find(r => r.value === modalRange); const mins = found?.minutes ?? 1440; if (mins >= 1440) return data; const slots = Math.min(Math.ceil(mins / 60), data.length); return data.slice(-slots); })()}
                    margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
                    barCategoryGap="55%"
                    onClick={(d) => { if (d?.activePayload?.[0]?.payload?.value > 0) { setHourDrawer(d.activePayload?.[0].payload.hour); setModalOpen(false); } }}
                  >
                    <CartesianGrid strokeDasharray="2 4" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fill: "#a0aab4", fontSize: 10, fontFamily: "Inter, sans-serif" }} tickLine={false} axisLine={false} interval={modalRange === "24h" ? 3 : 0} />
                    <YAxis tick={{ fill: "#a0aab4", fontSize: 10, fontFamily: "Inter, sans-serif" }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Bar dataKey="value" radius={[1, 1, 0, 0]} cursor="pointer" isAnimationActive={false}>
                      {((() => { const ranges = CHART_RANGES[plan] ?? CHART_RANGES.starter; const found = ranges.find(r => r.value === modalRange); const mins = found?.minutes ?? 1440; if (mins >= 1440) return data; const slots = Math.min(Math.ceil(mins / 60), data.length); return data.slice(-slots); })()).map((entry, index) => (
                        <Cell key={index} fill={entry.value === peak && peak > 0 ? color : `${color}30`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* KPI strip */}
              <div style={{ display: "flex", backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "10px", overflow: "hidden" }}>
                {[
                  { label: "Total", value: String(total) },
                  { label: "Peak / hour", value: String(peak) },
                  { label: "Active hours", value: `${activeHours}/24` },
                  { label: "Avg / hour", value: (total / 24).toFixed(1) },
                ].map((kpi, i) => (
                  <div key={kpi.label} style={{ flex: 1, padding: "14px 20px", borderRight: i < 3 ? "1px solid #1a1a1a" : "none" }}>
                    <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>{kpi.label}</div>
                    <div style={{ ...INTER, fontSize: "20px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              {/* By Service + Peak Hours */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "18px 20px" }}>
                  <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>By Service</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {Array.from(events.reduce((m, e) => { m.set(e.service, (m.get(e.service)||0)+1); return m; }, new Map<string,number>()).entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([svc, cnt]) => {
                      const maxVal = Math.max(...Array.from(events.reduce((m,e)=>{m.set(e.service,(m.get(e.service)||0)+1);return m;},new Map<string,number>()).values()));
                      return (
                        <div key={svc}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span style={{ ...INTER, fontSize: "12px", color: "#ccc" }}>{svc}</span>
                            <span style={{ ...INTER, fontSize: "12px", color, fontWeight: 600 }}>{cnt}</span>
                          </div>
                          <div style={{ height: "4px", backgroundColor: "#1a1a1a", borderRadius: "2px" }}>
                            <div style={{ height: "100%", width: `${(cnt/maxVal)*100}%`, backgroundColor: color, borderRadius: "2px" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "18px 20px" }}>
                  <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Peak Hours</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[...data].sort((a,b)=>b.value-a.value).slice(0,5).filter(p=>p.value>0).map((p,i) => (
                      <div key={p.hour} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: i===0?"#111":"transparent", borderRadius: "6px", border: i===0?`1px solid ${color}22`:"none" }}>
                        <span style={{ ...INTER, fontSize: "12px", color: "#ccc", fontFamily: "Inter, sans-serif" }}>{p.hour}</span>
                        <span style={{ ...INTER, fontSize: "14px", fontWeight: 600, color: i===0?color:"#a0aab4", fontVariantNumeric: "tabular-nums" }}>{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Patterns completi */}
              {patterns.length > 0 && (
                <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "18px 20px" }}>
                  <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Patterns — {patterns.length} rilevati</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    {patterns.map((g, i) => (
                      <div key={i} onClick={() => { setSelectedGroup(g); setModalOpen(false); }} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "6px", cursor: "pointer", transition: "background-color 0.1s" }} onMouseEnter={e=>(e.currentTarget.style.backgroundColor="#111")} onMouseLeave={e=>(e.currentTarget.style.backgroundColor="transparent")}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                        <span style={{ ...INTER, fontSize: "12px", color: "#e6edf3", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.message}</span>
                        <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", flexShrink: 0 }}>{g.service}</span>
                        <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", flexShrink: 0 }}>last {new Date(g.lastSeen).toLocaleTimeString("en-GB",{hour12:false})}</span>
                        <span style={{ ...INTER, fontSize: "11px", fontWeight: 700, color, backgroundColor: `${color}22`, padding: "2px 8px", borderRadius: "10px", flexShrink: 0 }}>×{g.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Ultimi eventi */}
              <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "18px 20px" }}>
                <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>Ultimi eventi — {events.length} totali</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1px", maxHeight: "240px", overflowY: "auto" }}>
                  {events.slice(0, 50).map((ev, i) => (
                    <div key={ev.id??i} style={{ display: "flex", alignItems: "baseline", gap: "12px", padding: "6px 8px", borderRadius: "4px" }} onMouseEnter={e=>(e.currentTarget.style.backgroundColor="#111")} onMouseLeave={e=>(e.currentTarget.style.backgroundColor="transparent")}>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#a0aab4", flexShrink: 0, minWidth: "52px" }}>{new Date(ev.timestamp).toLocaleTimeString("en-GB",{hour12:false})}</span>
                      <span style={{ ...INTER, fontSize: "10px", color: "#4ade80", flexShrink: 0, width: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.service}</span>
                      <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {hourDrawer && <HourDrawer hour={hourDrawer} events={events} color={color} onClose={() => setHourDrawer(null)} />}
      {selectedLog && <LogDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />}
      {selectedGroup && <PatternDrawer group={selectedGroup} onClose={() => setSelectedGroup(null)} />}
    </section>
  );
}
export default function ErrorChart() {
  const { logs, loading: dataLoading } = useData();
  const [plan, setPlan] = useState("starter");
  const events = logs.filter(l => l.level === "ERROR");
  const data = buildHourlyBuckets(events);
  const loading = dataLoading;
  const fetch_ = useCallback(async () => {
    // noop - data viene dal context
  }, []);
  useEffect(() => {
    const t = setInterval(() => {}, 30000);
    fetch(`${apiUrl}/v1/auth/me`, { headers: getAuthHeadersNoContent(), credentials: "include" })
      .then(r => r.json()).then(d => { if (d.plan) setPlan(d.plan); }).catch(() => {});
    return () => clearInterval(t);
  }, [fetch_]);
  const total = data.reduce((s, p) => s + p.value, 0);
  const peak = Math.max(...data.map(p => p.value), 0);
  return <ChartSection title="Errors - Last 24h" total={total} peak={peak} data={data} events={events} loading={loading} color="#c0392b" emptyMsg="No errors in the last 24 hours" plan={plan} />;
}
export function WarningChart() {
  const { logs, loading: dataLoading } = useData();
  const [plan, setPlan] = useState("starter");
  const events = logs.filter(l => l.level === "WARN");
  const data = buildHourlyBuckets(events);
  const loading = dataLoading;
  const fetch_ = useCallback(async () => {}, []);
  useEffect(() => {
    const t = setInterval(() => {}, 30000);
    fetch(`${apiUrl}/v1/auth/me`, { headers: getAuthHeadersNoContent(), credentials: "include" })
      .then(r => r.json()).then(d => { if (d.plan) setPlan(d.plan); }).catch(() => {});
    return () => clearInterval(t);
  }, [fetch_]);
  const total = data.reduce((s, p) => s + p.value, 0);
  const peak = Math.max(...data.map(p => p.value), 0);
  return <ChartSection title="Warnings - Last 24h" total={total} peak={peak} data={data} events={events} loading={loading} color="#b8860b" emptyMsg="No warnings in the last 24 hours" plan={plan} />;
}

function UptimeDrawer({ uptime, totalEvents, errorEvents, onClose, onNavigate }: {
  uptime: number; totalEvents: number; errorEvents: number; onClose: () => void; onNavigate?: (tab: string) => void;
}) {
  const color = uptime > 95 ? "#4ade80" : uptime > 80 ? "#fbbf24" : "#f87171";
  const successEvents = totalEvents - errorEvents;
  const health = uptime > 95 ? "ottimo" : uptime > 80 ? "degradato" : "critico";
  const errorRate = totalEvents > 0 ? Math.round((errorEvents / totalEvents) * 100) : 0;
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "min(440px, 92vw)", backgroundColor: "#0a0a0a", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", animation: "slideInDrawer 0.22s cubic-bezier(0.16,1,0.3,1)" }}>
        <style>{`@keyframes slideInDrawer { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }`}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color }} />
            <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>Uptime · Last 24h</span>
          </div>
          <button onClick={onClose} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ ...INTER, fontSize: "52px", fontWeight: 600, color, letterSpacing: "-2px", fontVariantNumeric: "tabular-nums" }}>{uptime.toFixed(1)}%</span>
            <div style={{ height: "6px", backgroundColor: "#1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${uptime}%`, backgroundColor: color, borderRadius: "3px", transition: "width 0.4s ease" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[{ label: "Total", value: String(totalEvents), c: "#e6edf3" }, { label: "Errors", value: String(errorEvents), c: errorEvents > 0 ? "#f87171" : "#a0aab4" }, { label: "Success", value: String(successEvents), c: successEvents > 0 ? "#4ade80" : "#a0aab4" }].map(k => (
                <div key={k.label} style={{ backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "7px", padding: "10px 12px" }}>
                  <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>{k.label}</div>
                  <div style={{ ...INTER, fontSize: "18px", fontWeight: 600, color: k.c, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #222", borderRadius: "10px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color }} />
              <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Analisi</span>
            </div>
            <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: 0, fontWeight: 500 }}>
              {uptime >= 99 ? "Sistema eccellente — uptime quasi perfetto." : uptime >= 95 ? "Sistema stabile con piccole anomalie." : uptime >= 80 ? "Sistema degradato — intervento consigliato." : "Sistema critico — intervento immediato richiesto."}
            </p>
            <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: 0, lineHeight: 1.7 }}>
              {totalEvents === 0 ? "Nessun evento registrato nelle ultime 24 ore. Integra l SDK per iniziare il monitoraggio." :
              `Su ${totalEvents} eventi totali, ${errorEvents} hanno generato errori (${errorRate}%) e ${successEvents} sono andati a buon fine. ${uptime < 95 ? "Il tasso di errore elevato suggerisce un problema sistemico da investigare." : "Il sistema opera normalmente."}`}
            </p>
            {uptime < 95 && (
              <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "10px" }}>
                <p onClick={() => { onNavigate?.("errors"); onClose(); }} style={{ ...INTER, fontSize: "11px", color: "#f87171", margin: 0, cursor: "pointer" }}>→ Vai alla sezione Errors per analizzare i pattern di errore.</p>
              </div>
            )}
          </div>
          <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #222", borderRadius: "10px", padding: "16px 18px" }}>
            <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Comando monitoraggio</div>
            <pre style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#4ade80", backgroundColor: "#080808", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "10px 12px", margin: 0, overflowX: "auto" }}>{`# Monitora errori in tempo reale\ndocker compose logs -f | grep -i "error\\|exception"\n\n# Conta errori ultima ora\ndocker compose logs --since 1h | grep -c "ERROR"`}</pre>
          </div>
        </div>
      </div>
    </>
  );
}

function ServiceDrawer({ service, count, total, errors, warnings, onClose }: {
  service: string; count: number; total: number; errors: number; warnings: number; onClose: () => void;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const errorRate = count > 0 ? Math.round((errors / count) * 100) : 0;
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "min(440px, 92vw)", backgroundColor: "#0a0a0a", borderLeft: "1px solid #222", display: "flex", flexDirection: "column", animation: "slideInDrawer 0.22s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4ade80" }} />
            <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>{service}</span>
            <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>service</span>
          </div>
          <button onClick={onClose} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {[{ label: "Total events", value: String(count), c: "#e6edf3" }, { label: "% of traffic", value: `${pct}%`, c: "#4ade80" }, { label: "Errors", value: String(errors), c: errors > 0 ? "#f87171" : "#a0aab4" }, { label: "Warnings", value: String(warnings), c: warnings > 0 ? "#fbbf24" : "#a0aab4" }].map(k => (
              <div key={k.label} style={{ backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "7px", padding: "12px 14px" }}>
                <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>{k.label}</div>
                <div style={{ ...INTER, fontSize: "20px", fontWeight: 600, color: k.c, fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #222", borderRadius: "10px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: errorRate > 20 ? "#f87171" : "#4ade80" }} />
              <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Analisi servizio</span>
            </div>
            <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: 0, fontWeight: 500 }}>
              {errorRate === 0 ? `${service} opera correttamente — nessun errore.` : errorRate < 20 ? `${service} ha un tasso di errore basso (${errorRate}%).` : `${service} ha un tasso di errore elevato (${errorRate}%) — richiede attenzione.`}
            </p>
            <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: 0, lineHeight: 1.7 }}>
              {`Il servizio ${service} ha generato ${count} eventi totali, rappresentando il ${pct}% del traffico complessivo. ${errors > 0 ? `${errors} eventi hanno generato errori.` : "Nessun errore rilevato."}`}
            </p>
          </div>
          <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #222", borderRadius: "10px", padding: "16px 18px" }}>
            <div style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Comandi investigazione</div>
            <pre style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#4ade80", backgroundColor: "#080808", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "10px 12px", margin: 0, overflowX: "auto", lineHeight: 1.6 }}>{`# Log in tempo reale del servizio\ndocker logs ${service} -f --tail=50\n\n# Solo errori\ndocker logs ${service} --tail=200 | grep -i "error"\n\n# Stato container\ndocker ps | grep ${service}`}</pre>
          </div>
        </div>
      </div>
    </>
  );
}

export function TopServicesChart() {
  const { logs: allLogs, loading: dataLoading } = useData();
  const [selectedService, setSelectedService] = useState<{ service: string; count: number; errors: number; warnings: number } | null>(null);
  const loading = dataLoading;
  const data = (() => {
    const counts = new Map<string, number>();
    for (const ev of allLogs) { if (!ev.service) continue; counts.set(ev.service, (counts.get(ev.service) ?? 0) + 1); }
    return Array.from(counts.entries()).map(([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  })();
  const max = data[0]?.count ?? 1;
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <span style={{ ...INTER, fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>Top Services</span>
      <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", padding: "20px" }}>
        {loading ? <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>loading...</span></div>
        : data.length === 0 ? <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>No data yet</span></div>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {data.map((s) => (
              <div key={s.service} onClick={() => {
                const svcLogs = allLogs.filter(l => l.service === s.service);
                setSelectedService({ service: s.service, count: s.count, errors: svcLogs.filter(l => l.level === "ERROR").length, warnings: svcLogs.filter(l => l.level === "WARN").length });
              }} style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <span style={{ ...INTER, fontSize: "12px", color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.service}</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexShrink: 0 }}>
                    <span style={{ ...INTER, fontSize: "13px", color: "#4ade80", fontWeight: 600 }}>{s.count}</span>
                    <span style={{ ...INTER, fontSize: "10px", color: "#888" }}>{total > 0 ? Math.round((s.count / total) * 100) : 0}%</span>
                  </div>
                </div>
                <div style={{ height: "5px", backgroundColor: "#1a1a1a", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.count / max) * 100}%`, backgroundColor: "#4ade80", borderRadius: "3px", transition: "width 0.3s" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedService && <ServiceDrawer service={selectedService.service} count={selectedService.count} total={total} errors={selectedService.errors} warnings={selectedService.warnings} onClose={() => setSelectedService(null)} />}
    </section>
  );
}
export function UptimeCard({ onNavigate }: { onNavigate?: (tab: string) => void } = {}) {
  const { logs, loading: dataLoading } = useData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = logs;
  const e = logs.filter(l => l.level === "ERROR");
  const loading = dataLoading;
  const totalEvents = t.length;
  const errorEvents = e.length;
  const uptime = t.length === 0 ? 100 : Math.round(((t.length - e.length) / t.length) * 1000) / 10;

  const color = uptime > 95 ? "#4ade80" : uptime > 80 ? "#fbbf24" : "#f87171";
  const successEvents = totalEvents - errorEvents;
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <span style={{ ...INTER, fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>Uptime · Last 24h</span>
      <div onClick={() => setDrawerOpen(true)} style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", padding: "20px", cursor: "pointer" }}>
        {loading ? <div style={{ height: 80, display: "flex", alignItems: "center" }}><span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>loading...</span></div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>{"Success rate"}</span>
                <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>{"Last 24 hours"} · {totalEvents} {"total events"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: color }} />
                <span style={{ ...INTER, fontSize: "26px", fontWeight: 600, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}>{uptime.toFixed(1)}%</span>
              </div>
            </div>
            <div style={{ height: "4px", backgroundColor: "#1a1a1a", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${uptime}%`, backgroundColor: color, borderRadius: "2px", transition: "width 0.4s ease" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {[
                { label: "Total", value: String(totalEvents), c: "#e6edf3" },
                { label: "Errors", value: String(errorEvents), c: errorEvents > 0 ? "#f87171" : "#a0aab4" },
                { label: "Success", value: String(successEvents), c: successEvents > 0 ? "#4ade80" : "#a0aab4" },
              ].map(k => (
                <div key={k.label} style={{ backgroundColor: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: "7px", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "5px" }}>
                  <span style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>{k.label}</span>
                  <span style={{ ...INTER, fontSize: "18px", fontWeight: 600, color: k.c, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{k.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}