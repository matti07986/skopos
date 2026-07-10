"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProjects } from "@/components/ProjectContext";
import Logo from "@/components/ui/logo";
import HeaderClock from "@/components/HeaderClock";

const INTER = { fontFamily: "Inter, sans-serif" };
const MONO  = { fontFamily: "JetBrains Mono, Fira Code, monospace" };

interface Monitor {
  id: string; name: string; url: string; method: string;
  interval_seconds: number; timeout_seconds: number; expected_status: number;
  keyword?: string; is_active: boolean;
  alert_channel?: string; alert_destination?: string;
  last_checked_at?: string; last_status?: string; last_response_ms?: number;
  uptime_24h?: number;
}

interface Check {
  id: string; checked_at: string; status: string;
  response_ms?: number; status_code?: number; error?: string;
}

function statusDot(status?: string) {
  const color = status === "up" ? "#4ade80" : status === "down" ? "#f87171" : "#a0aab4";
  return <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />;
}

function CheckDrawer({ monitor, onClose }: { monitor: Monitor; onClose: () => void }) {
  const [checks, setChecks] = useState<Check[]>([]);
  useEffect(() => {
    const token = localStorage.getItem("skopos_access_token") ?? "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/monitors/${monitor.id}/checks?limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(setChecks).catch(() => {});
  }, [monitor.id]);
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);
  const upColor = monitor.last_status === "up" ? "#4ade80" : monitor.last_status === "down" ? "#f87171" : "#a0aab4";
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.5)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201, width: "min(520px, 95vw)", backgroundColor: "#0a0a0a", borderLeft: "1px solid #1a1a1a", display: "flex", flexDirection: "column", animation: "slideIn 0.2s ease" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {statusDot(monitor.last_status)}
            <span style={{ ...INTER, fontSize: "14px", color: "#e6edf3", fontWeight: 600 }}>{monitor.name}</span>
          </div>
          <button onClick={onClose} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>x</button>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ ...MONO, fontSize: "12px", color: "#60a5fa", marginBottom: "12px" }}>{monitor.url}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", borderRadius: "5px", overflow: "hidden", border: "1px solid #111" }}>
            {[
              { label: "Status", value: monitor.last_status ? monitor.last_status.toUpperCase() : "PENDING", color: upColor },
              { label: "Uptime 24h", value: monitor.uptime_24h != null ? `${monitor.uptime_24h}%` : "N/A", color: "#e6edf3" },
              { label: "Response", value: monitor.last_response_ms != null ? `${Math.round(monitor.last_response_ms)}ms` : "N/A", color: "#e6edf3" },
              { label: "Interval", value: `${monitor.interval_seconds}s`, color: "#e6edf3" },
            ].map(k => (
              <div key={k.label} style={{ backgroundColor: "#0d0d0d", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ ...INTER, fontSize: "9px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.label}</span>
                <span style={{ ...INTER, fontSize: "15px", fontWeight: 700, color: k.color }}>{k.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          <div style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 10px 4px", fontWeight: 600 }}>Recent Checks</div>
          {checks.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100px" }}><span style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>No checks yet</span></div>
          ) : checks.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "7px 10px", borderBottom: "1px solid #0d0d0d" }}>
              {statusDot(c.status)}
              <span style={{ ...MONO, fontSize: "11px", color: "#a0aab4", flexShrink: 0, minWidth: "56px" }}>{new Date(c.checked_at).toLocaleTimeString("en-GB", { hour12: false })}</span>
              <span style={{ ...INTER, fontSize: "11px", color: c.status === "up" ? "#4ade80" : "#f87171", fontWeight: 600, width: "32px", flexShrink: 0 }}>{c.status.toUpperCase()}</span>
              {c.response_ms != null && <span style={{ ...MONO, fontSize: "10px", color: "#a0aab4", flexShrink: 0 }}>{Math.round(c.response_ms)}ms</span>}
              {c.status_code && <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", flexShrink: 0 }}>HTTP {c.status_code}</span>}
              {c.error && <span style={{ ...INTER, fontSize: "10px", color: "#f87171", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.error}</span>}
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </>
  );
}

export default function MonitorsPage() {
  const router = useRouter();
  const { activeProject, projects, setActiveProject } = useProjects();

  // Auto-seleziona progetto dal localStorage se context è vuoto
  useEffect(() => {
    if (!activeProject && projects.length > 0) {
      const savedId = localStorage.getItem("skopos_active_project");
      const found = projects.find(p => p.id === savedId) ?? projects[0];
      if (found) setActiveProject(found);
    }
  }, [activeProject, projects, setActiveProject]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selected, setSelected] = useState<Monitor | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", interval_seconds: 60, expected_status: 200, keyword: "", alert_channel: "email", alert_destination: "" });
  const [userPlan, setUserPlan] = useState<string>("starter");

  useEffect(() => {
    const token = localStorage.getItem("skopos_access_token") ?? "";
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => { if (d.plan) setUserPlan(d.plan); }).catch(() => {});
  }, []);

  const PLAN_CONFIG: Record<string, { monitors: number; minInterval: number; intervals: {value: number; label: string}[] }> = {
    starter: { monitors: 3,   minInterval: 300, intervals: [{ value: 300, label: "5 minutes" }, { value: 600, label: "10 minutes" }, { value: 1800, label: "30 minutes" }, { value: 3600, label: "1 hour" }] },
    indie:   { monitors: 10,  minInterval: 60,  intervals: [{ value: 60, label: "1 minute" }, { value: 300, label: "5 minutes" }, { value: 600, label: "10 minutes" }, { value: 1800, label: "30 minutes" }] },
    pro:     { monitors: 30,  minInterval: 30,  intervals: [{ value: 30, label: "30 seconds" }, { value: 60, label: "1 minute" }, { value: 300, label: "5 minutes" }, { value: 600, label: "10 minutes" }] },
    business:{ monitors: 999, minInterval: 10,  intervals: [{ value: 10, label: "10 seconds" }, { value: 30, label: "30 seconds" }, { value: 60, label: "1 minute" }, { value: 300, label: "5 minutes" }] },
  };

  const planConfig = PLAN_CONFIG[userPlan] ?? PLAN_CONFIG.starter;

  const saving = false;
  const [savingState, setSavingState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitors = useCallback(async () => {
    if (!activeProject) return;
    const token = localStorage.getItem("skopos_access_token") ?? "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/monitors?project_id=${activeProject.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setMonitors(await res.json());
  }, [activeProject]);

  useEffect(() => { fetchMonitors(); const t = setInterval(fetchMonitors, 30000); return () => clearInterval(t); }, [fetchMonitors]);

  async function createMonitor() {
    if (!activeProject) return;
    setSavingState(true); setError(null);
    try {
      const token = localStorage.getItem("skopos_access_token") ?? "";
      const body = { ...form, project_id: activeProject.id, keyword: form.keyword || undefined, alert_destination: form.alert_destination || undefined };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/monitors`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const errData = await res.json();
        const detail = errData.detail;
        if (typeof detail === "string") throw new Error(detail);
        if (Array.isArray(detail)) throw new Error(detail.map((e: any) => e.msg || JSON.stringify(e)).join(", "));
        throw new Error("Request failed"); }
      setModalOpen(false); setForm({ name: "", url: "", interval_seconds: 60, expected_status: 200, keyword: "", alert_channel: "email", alert_destination: "" });
      fetchMonitors();
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
    finally { setSavingState(false); }
  }

  async function deleteMonitor(id: string) {
    const token = localStorage.getItem("skopos_access_token") ?? "";
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/monitors/${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    fetchMonitors();
  }

  async function toggleMonitor(m: Monitor) {
    const token = localStorage.getItem("skopos_access_token") ?? "";
    // Aggiorna ottimisticamente lo stato UI
    setMonitors(prev => prev.map(mon => mon.id === m.id ? { ...mon, is_active: !mon.is_active } : mon));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/monitors/${m.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: !m.is_active }),
      });
      if (!res.ok) {
        // Rollback se fallisce
        setMonitors(prev => prev.map(mon => mon.id === m.id ? { ...mon, is_active: m.is_active } : mon));
      } else {
        await fetchMonitors();
      }
    } catch {
      setMonitors(prev => prev.map(mon => mon.id === m.id ? { ...mon, is_active: m.is_active } : mon));
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", ...INTER }}>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, borderBottom: "1px solid #111", backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", height: "48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <a href="/projects" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
              <Logo size={24} />
              <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>skopos</span>
            </a>
            <div style={{ width: "1px", height: "14px", backgroundColor: "#1e1e1e", margin: "0 6px" }} />
            <HeaderClock />
            <span style={{ color: "#2a2a2a" }}>/</span>
            <span style={{ color: "#a0aab4", fontSize: "12px" }}>Monitors</span>
          </div>
<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ ...INTER, fontSize: "10px", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "4px", padding: "3px 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{userPlan}</span>
            <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4" }}>{monitors.length}/{planConfig.monitors} monitors</span>
          </div>
        </div>
      </nav>
      <main style={{ paddingTop: "72px", maxWidth: "1280px", margin: "0 auto", padding: "80px 24px 48px" }}>
        {!activeProject ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}><span style={{ ...INTER, fontSize: "13px", color: "#a0aab4" }}>Select a project in the dashboard first</span></div>
        ) : monitors.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh", gap: "12px" }}>
            <span style={{ ...INTER, fontSize: "15px", color: "#e6edf3", fontWeight: 500 }}>No monitors yet</span>
            <span style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>Add a URL to start monitoring uptime</span>
            <button onClick={() => setModalOpen(true)} style={{ ...INTER, marginTop: "8px", backgroundColor: "#4ade80", color: "#000", fontSize: "12px", fontWeight: 700, padding: "8px 16px", borderRadius: "5px", border: "none", cursor: "pointer" }}>+ Add Monitor</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>Uptime Monitors — {monitors.length}</span>
              <button onClick={() => setModalOpen(true)} style={{ ...INTER, backgroundColor: "#4ade80", color: "#000", fontSize: "11px", fontWeight: 700, padding: "5px 12px", borderRadius: "5px", border: "none", cursor: "pointer" }}>+ Add</button>
            </div>
            {monitors.map(m => (
              <div key={m.id} onClick={() => { fetchMonitors(); setSelected(m); }} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", backgroundColor: "#0a0a0a", border: `1px solid ${m.is_active && m.last_status === "up" ? "rgba(74,222,128,0.3)" : "#1a1a1a"}`, borderRadius: "6px", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.borderColor = m.is_active && m.last_status === "up" ? "rgba(74,222,128,0.5)" : "#2a2a2a")} onMouseLeave={e => (e.currentTarget.style.borderColor = m.is_active && m.last_status === "up" ? "rgba(74,222,128,0.3)" : "#1a1a1a")}>
                {statusDot(m.is_active ? m.last_status : undefined)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>{m.name}</span>
                    {!m.is_active && <span style={{ ...INTER, fontSize: "9px", color: "#a0aab4", border: "1px solid #1a1a1a", borderRadius: "3px", padding: "1px 5px" }}>PAUSED</span>}
                  </div>
                  <span style={{ ...MONO, fontSize: "11px", color: "#a0aab4" }}>{m.url}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "20px", flexShrink: 0 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                    <span style={{ ...INTER, fontSize: "12px", fontWeight: 700, color: m.last_status === "up" ? "#4ade80" : m.last_status === "down" ? "#f87171" : "#a0aab4" }}>{m.last_status ? m.last_status.toUpperCase() : "PENDING"}</span>
                    {m.uptime_24h != null && <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4" }}>{m.uptime_24h}% uptime</span>}
                  </div>
                  {m.last_response_ms != null && <span style={{ ...MONO, fontSize: "11px", color: "#a0aab4" }}>{Math.round(m.last_response_ms)}ms</span>}
                  <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4" }}>every {m.interval_seconds}s</span>
                  <button onClick={e => { e.stopPropagation(); toggleMonitor(m); }} style={{ ...INTER, fontSize: "10px", color: m.is_active ? "#4ade80" : "#a0aab4", border: `1px solid ${m.is_active ? "rgba(74,222,128,0.3)" : "#1a1a1a"}`, borderRadius: "4px", padding: "3px 8px", background: "none", cursor: "pointer" }}>{m.is_active ? "on" : "off"}</button>
                  <button onClick={e => { e.stopPropagation(); deleteMonitor(m.id); }} style={{ ...INTER, fontSize: "10px", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "4px", padding: "3px 8px", background: "none", cursor: "pointer" }}>Delete</button>
                </div>
                <span style={{ color: "#2a2a2a", fontSize: "12px" }}>›</span>
              </div>
            ))}
          </div>
        )}
      </main>
      {selected && <CheckDrawer monitor={selected} onClose={() => setSelected(null)} />}
      {modalOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
          <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "10px", width: "100%", maxWidth: "420px", margin: "0 16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ ...INTER, fontSize: "16px", fontWeight: 700, color: "#e6edf3" }}>New Monitor</span>
              <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>Plan: <span style={{ color: "#4ade80", fontWeight: 600 }}>{userPlan}</span> — interval min {planConfig.minInterval}s — max {planConfig.monitors} monitors</span>
            </div>
              <button onClick={() => setModalOpen(false)} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>x</button>
            </div>
            {error && <p style={{ ...INTER, fontSize: "11px", color: "#f87171", backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "5px", padding: "8px 12px", marginBottom: "16px" }}>{error}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Monitor name *", key: "name", placeholder: "", type: "text" },
                { label: "URL *", key: "url", placeholder: "https://yourapp.com/health", type: "text" },
                { label: "Alert email *", key: "alert_destination", placeholder: "you@example.com", type: "text" },
                { label: "Keyword", key: "keyword", placeholder: "", type: "text" },
              ].map(field => (
                <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>{field.label}</label>
                  <input type={field.type} value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} style={{ ...INTER, backgroundColor: "#000", border: "1px solid #1a1a1a", color: "#e6edf3", fontSize: "16px", borderRadius: "5px", padding: "8px 12px", outline: "none" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Check every</label>
                  <select value={form.interval_seconds || planConfig.minInterval} onChange={e => setForm(f => ({ ...f, interval_seconds: Number(e.target.value) }))} style={{ ...INTER, backgroundColor: "#000", border: "1px solid #1a1a1a", color: "#e6edf3", fontSize: "13px", borderRadius: "5px", padding: "8px 12px", outline: "none" }}>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={300}>5 minutes</option>
                    <option value={600}>10 minutes</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Expected status</label>
                  <input type="text" value={form.expected_status} onChange={e => setForm(f => ({ ...f, expected_status: Number(e.target.value) }))} style={{ ...INTER, backgroundColor: "#000", border: "1px solid #1a1a1a", color: "#e6edf3", fontSize: "16px", borderRadius: "5px", padding: "8px 12px", outline: "none" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={() => setModalOpen(false)} style={{ flex: 1, border: "1px solid #1a1a1a", color: "#a0aab4", backgroundColor: "transparent", fontSize: "11px", fontWeight: 700, borderRadius: "5px", padding: "8px", cursor: "pointer" }}>Cancel</button>
                <button onClick={createMonitor} disabled={savingState} style={{ flex: 1, backgroundColor: savingState ? "#2a2a2a" : "#4ade80", color: "#000", fontSize: "11px", fontWeight: 700, borderRadius: "5px", padding: "8px", border: "none", cursor: savingState ? "not-allowed" : "pointer" }}>{savingState ? "Saving..." : "Create"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}