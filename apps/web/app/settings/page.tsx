"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/logo";
import HeaderClock from "@/components/HeaderClock";
import { getAuthHeaders, getAuthHeadersNoContent, apiUrl } from "@/lib/api";

const INTER = { fontFamily: "'Inter', sans-serif" };

interface AlertRule {
  webhook_secret?: string | null;
  id: string;
  name: string;
  level: string;
  threshold: number;
  window_seconds: number;
  channel: string;
  destination: string;
  is_active: boolean;
}

type AlertLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";
type AlertChannel = "email" | "slack";

interface NewRuleForm {
  name: string;
  level: AlertLevel;
  threshold: string;
  window_seconds: string;
  channel: AlertChannel;
  destination: string;
}

const levelColor: Record<string, string> = {
  ERROR: "#f87171",
  WARN:  "#fbbf24",
  INFO:  "#4ade80",
  DEBUG: "#a0aab4",
};

const planBadge: Record<string, { label: string; color: string; bg: string }> = {
  starter:  { label: "Starter",  color: "#a0aab4", bg: "rgba(125,133,144,0.1)" },
  indie:    { label: "Indie",    color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  pro:      { label: "Pro",      color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  business: { label: "Business", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
};

function apiFetch(path: string, init?: RequestInit) {
  const hasBody = init?.body !== undefined;
  return fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(hasBody ? getAuthHeaders() : getAuthHeadersNoContent()),
      ...(init?.headers ?? {}),
    },
  });
}

const emptyForm: NewRuleForm = {
  name: "", level: "ERROR", threshold: "1",
  window_seconds: "60", channel: "email", destination: "",
};

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("starter");
  const [projectCount, setProjectCount] = useState(0);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [form, setForm] = useState<NewRuleForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const [auditLogs, setAuditLogs] = useState<{id:string;action:string;resource:string|null;ip_address:string|null;created_at:string}[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLoaded, setAuditLoaded] = useState(false);

  async function loadAuditLogs() {
    if (auditLoaded) return;
    setAuditLoading(true);
    try {
      const res = await apiFetch("/v1/audit?limit=50");
      if (res.ok) { setAuditLogs(await res.json()); setAuditLoaded(true); }
    } finally { setAuditLoading(false); }
  }
  const [timezone, setTimezone] = useState("UTC");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyAlerts, setNotifyAlerts] = useState(true);
  const [prefSaved, setPrefSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("skopos_access_token");
    if (!token) { router.replace("/login"); return; }
    Promise.all([
      apiFetch("/v1/auth/me").then(r => r.json()),
      apiFetch("/v1/alerts").then(r => r.json()),
      apiFetch("/v1/projects").then(r => r.json()),
    ]).then(([me, alertRules, projects]) => {
      setEmail(me.email ?? "");
      setPlan(me.plan ?? "starter");
      const lang = me.language ?? "en";
      setLanguage(lang);
      setTimezone(me.timezone ?? "UTC");
      localStorage.setItem("skopos_timezone", me.timezone ?? "UTC");
      localStorage.setItem("skopos_language", me.language ?? "en");
      setNotifyEmail(me.notify_email ?? true);
      setNotifyAlerts(me.notify_alerts ?? true);
      setRules(Array.isArray(alertRules) ? alertRules : []);
      setProjectCount(Array.isArray(projects) ? projects.length : 0);
    }).catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSaveRule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/v1/alerts", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          threshold: parseInt(form.threshold),
          window_seconds: parseInt(form.window_seconds),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Error");
      setRules(prev => [...prev, data]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRule(id: string) {
    await apiFetch(`/v1/alerts/${id}`, { method: "DELETE" });
    setRules(prev => prev.filter(r => r.id !== id));
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>Loading...</span>
    </div>
  );

  const badge = planBadge[plan] ?? planBadge.starter;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, borderBottom: "1px solid #111", backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", height: "48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Logo size={24} />
            <span style={{ ...INTER, color: "#fff", fontSize: "13px", fontWeight: 600, letterSpacing: "-0.2px" }}>skopos</span>
            <div style={{ width: "1px", height: "14px", backgroundColor: "#1e1e1e", margin: "0 6px" }} />
            <HeaderClock />
          </div>
          <a href="/projects" style={{ ...INTER, color: "#a0aab4", fontSize: "11px", textDecoration: "none" }}>Dashboard →</a>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 32px 80px", display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ ...INTER, fontSize: "18px", color: "#e6edf3", fontWeight: 600, margin: 0 }}>Settings</h1>
            <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: "4px 0 0 0" }}>Manage your account and integrations</p>
          </div>
          <span style={{ ...INTER, fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "4px", color: "#4ade80", backgroundColor: "rgba(74,222,128,0.08)" }}>
            {badge.label}
          </span>
        </div>

        {/* Alert Rules */}
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Alert Rules</span>
            <button onClick={() => setShowForm(!showForm)} style={{ ...INTER, fontSize: "11px", color: "#4ade80", backgroundColor: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "5px", padding: "5px 12px", cursor: "pointer" }}>
              + New Rule
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSaveRule} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px", backgroundColor: "#111", borderRadius: "6px", border: "1px solid #1a1a1a" }}>
              {error && <span style={{ ...INTER, fontSize: "11px", color: "#f87171" }}>{error}</span>}
              {([
                { label: "Name", key: "name", type: "text", placeholder: "e.g. High error rate" },
                { label: "Destination (email, Slack URL, or HTTPS webhook URL)", key: "destination", type: "text", placeholder: "email@example.com / https://hooks.slack.com/... / https://your-server.com/webhook" },
                { label: "Threshold (events)", key: "threshold", type: "number", placeholder: "1" },
                { label: "Window (seconds)", key: "window_seconds", type: "number", placeholder: "60" },
              ] as {label:string;key:string;type:string;placeholder:string}[]).map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    required
                    style={{ ...INTER, display: "block", width: "100%", marginTop: "6px", fontSize: "12px", color: "#e6edf3", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "7px 10px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Level</label>
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as AlertLevel }))} style={{ ...INTER, display: "block", width: "100%", marginTop: "6px", fontSize: "12px", color: "#e6edf3", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "7px 10px", outline: "none" }}>
                    {["ERROR", "WARN", "INFO", "DEBUG"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Channel</label>
                  <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value as AlertChannel }))} style={{ ...INTER, display: "block", width: "100%", marginTop: "6px", fontSize: "12px", color: "#e6edf3", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "7px 10px", outline: "none" }}>
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="webhook">Custom Webhook</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button type="submit" disabled={saving} style={{ ...INTER, fontSize: "12px", fontWeight: 600, color: "#000", backgroundColor: "#4ade80", border: "none", borderRadius: "5px", padding: "8px 16px", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : "Save Rule"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setError(""); }} style={{ ...INTER, fontSize: "12px", color: "#a0aab4", backgroundColor: "transparent", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 16px", cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {rules.length === 0 && !showForm ? (
            <div style={{ textAlign: "center", padding: "24px" }}>
              <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", margin: 0 }}>No alert rules yet</p>
              <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", marginTop: "4px" }}>Create a rule to get notified when errors spike</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {rules.map(rule => (
                <div key={rule.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", backgroundColor: "#111", borderRadius: "6px", border: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ ...INTER, fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", color: levelColor[rule.level] ?? "#a0aab4", backgroundColor: `${levelColor[rule.level]}15` }}>{rule.level}</span>
                    <span style={{ ...INTER, fontSize: "12px", color: "#e6edf3" }}>{rule.name}</span>
                    <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>{rule.threshold} events / {rule.window_seconds}s · {rule.channel}</span>
                    {rule.channel === "webhook" && rule.webhook_secret && (
                      <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4" }}>secret: <code style={{ fontFamily: "monospace", color: "#4ade80" }}>{rule.webhook_secret.slice(0, 8)}...</code></span>
                    )}
                  </div>
                  <button onClick={() => handleDeleteRule(rule.id)} style={{ ...INTER, fontSize: "11px", color: "#f87171", backgroundColor: "transparent", border: "none", cursor: "pointer", padding: "4px 8px" }}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account */}
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Account</span>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3" }}>{email}</span>
              <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", margin: "4px 0 0 0" }}>{projectCount} project{projectCount !== 1 ? "s" : ""}</p>
            </div>
            <a href="/profile" style={{ ...INTER, fontSize: "11px", color: "#a0aab4", textDecoration: "none", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "6px 12px" }}>Edit profile →</a>
          </div>
        </div>

        {/* Preferences */}
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Preferences</span>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Language</label>
              <div style={{ ...INTER, fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 10px", marginTop: "6px" }}>English</div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Timezone</label>
              <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ ...INTER, display: "block", width: "100%", marginTop: "6px", fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 10px", outline: "none" }}>
                <option value="UTC">UTC</option>
                <option value="Europe/Rome">Europe/Rome (CET)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
          </div>
          <button onClick={async () => {
            await apiFetch("/v1/auth/update-preferences", {
              method: "POST",
              body: JSON.stringify({ language, timezone }),
            });
            localStorage.setItem("skopos_timezone", timezone);
            localStorage.setItem("skopos_language", language);
            setPrefSaved(true);
            setTimeout(() => setPrefSaved(false), 2000);
          }} style={{ ...INTER, fontSize: "12px", fontWeight: 600, color: "#000", backgroundColor: "#4ade80", border: "none", borderRadius: "5px", padding: "9px 20px", cursor: "pointer", alignSelf: "flex-start" }}>
            {prefSaved ? "Saved!" : "Save preferences"}
          </button>
        </div>

        {/* Notifications */}
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Notifications</span>
          {([
            { key: "lifecycle", label: "Product updates & tips", desc: "Occasional emails from us — new features, usage tips, and product announcements. You can opt out anytime.", value: notifyEmail, set: setNotifyEmail },
            { key: "alerts", label: "Alert emails", desc: "Receive an email when one of your alert rules, anomaly detection, or uptime monitors fires.", value: notifyAlerts, set: setNotifyAlerts },
          ] as {key:string;label:string;desc:string;value:boolean;set:(v:boolean)=>void}[]).map(({ key, label, desc, value, set }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #111" }}>
              <div>
                <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: 0 }}>{label}</p>
                <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", margin: "3px 0 0 0" }}>{desc}</p>
              </div>
              <div onClick={async () => {
                const newVal = !value;
                set(newVal);
                await apiFetch("/v1/auth/update-preferences", {
                  method: "POST",
                  body: JSON.stringify({ notify_email: key === "lifecycle" ? newVal : notifyEmail, notify_alerts: key === "alerts" ? newVal : notifyAlerts }),
                });
              }} style={{ width: "36px", height: "20px", borderRadius: "10px", backgroundColor: value ? "#4ade80" : "#1a1a1a", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, marginLeft: "16px" }}>
                <div style={{ position: "absolute", top: "3px", left: value ? "19px" : "3px", width: "14px", height: "14px", borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s" }} />
              </div>
            </div>
          ))}
          <p style={{ ...INTER, fontSize: "11px", color: "#7d8590", margin: "12px 0 0 0", lineHeight: "1.5" }}>
            Verification, welcome, password reset, and other account-security emails are always sent.
          </p>
        </div>

        {/* Audit Log */}
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Audit Log</span>
            <button onClick={loadAuditLogs} disabled={auditLoading} style={{ ...INTER, fontSize: "11px", color: "#4ade80", backgroundColor: "transparent", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "5px", padding: "5px 12px", cursor: "pointer" }}>
              {auditLoading ? "Loading..." : auditLoaded ? "Refresh" : "Load logs"}
            </button>
          </div>
          {auditLoaded && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxHeight: "320px", overflowY: "auto" }}>
              {auditLogs.length === 0 && <p style={{ ...INTER, fontSize: "12px", color: "#7d8590", margin: 0 }}>No activity yet.</p>}
              {auditLogs.map(log => (
                <div key={log.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 10px", borderRadius: "5px", backgroundColor: "#111" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ ...INTER, fontSize: "11px", color: "#e6edf3", fontWeight: 600 }}>{log.action}</span>
                    {log.resource && <span style={{ ...INTER, fontSize: "10px", color: "#7d8590", marginLeft: "8px" }}>{log.resource.slice(0,20)}</span>}
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
                    {log.ip_address && <span style={{ ...INTER, fontSize: "10px", color: "#555", fontFamily: "monospace" }}>{log.ip_address}</span>}
                    <span style={{ ...INTER, fontSize: "10px", color: "#555" }}>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ ...INTER, fontSize: "10px", color: "#f87171", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Danger Zone</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: 0 }}>Delete account</p>
              <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", margin: "3px 0 0 0" }}>Permanently delete your account and all data. This cannot be undone.</p>
            </div>
            <button onClick={() => setDeleting(!deleting)} style={{ ...INTER, fontSize: "11px", color: "#f87171", backgroundColor: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "5px", padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap", marginLeft: "16px" }}>
              Delete account
            </button>
          </div>
          {deleting && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", backgroundColor: "#111", borderRadius: "6px", border: "1px solid rgba(248,113,113,0.2)" }}>
              <p style={{ ...INTER, fontSize: "12px", color: "#f87171", margin: 0 }}>Type your email to confirm deletion:</p>
              <input
                type="email"
                placeholder={email}
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                style={{ ...INTER, fontSize: "12px", color: "#e6edf3", backgroundColor: "#0a0a0a", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "5px", padding: "8px 12px", outline: "none" }}
              />
              <button
                disabled={deleteConfirm !== email}
                onClick={async () => {
                const res = await apiFetch("/v1/auth/delete-account", { method: "DELETE" });
                if (res.ok) {
                  localStorage.clear();
                  useRouter().push("/login");
                } else {
                  alert("Error deleting account. Please contact support@skopos.ink");
                }
              }}
                style={{ ...INTER, fontSize: "12px", fontWeight: 600, color: "#fff", backgroundColor: deleteConfirm === email ? "#f87171" : "#2a2a2a", border: "none", borderRadius: "5px", padding: "9px 16px", cursor: deleteConfirm === email ? "pointer" : "not-allowed", alignSelf: "flex-start", transition: "background 0.2s" }}
              >
                Permanently delete account
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
