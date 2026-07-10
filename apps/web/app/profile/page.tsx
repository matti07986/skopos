"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthHeaders, getAuthHeadersNoContent, apiUrl } from "@/lib/api";
import Logo from "@/components/ui/logo";
import HeaderClock from "@/components/HeaderClock";

const INTER = { fontFamily: "'Inter', sans-serif" };

const planBadge: Record<string, { label: string; color: string; bg: string }> = {
  starter:  { label: "Starter",  color: "#a0aab4", bg: "rgba(125,133,144,0.1)" },
  indie:    { label: "Indie",    color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  pro:      { label: "Pro",      color: "#4ade80", bg: "rgba(74,222,128,0.1)" },
  business: { label: "Business", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
};

function ls(key: string) {
  return typeof window !== "undefined" ? (localStorage.getItem(key) ?? "") : "";
}

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [rotateLoading, setRotateLoading] = useState(false);
  const [rotateMsg, setRotateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const token = ls("skopos_access_token");
    if (!token) { router.replace("/login"); return; }
    fetch(`${apiUrl}/v1/auth/me`, {
      headers: getAuthHeadersNoContent(),
      credentials: "include",
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setEmail(data.email);
        setApiKey(data.api_key);
        setPlan(data.plan ?? "starter");
        setPasswordChangedAt(data.password_changed_at ?? null);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: "err", text: "New passwords don't match" });
      return;
    }
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      const res = await fetch(`${apiUrl}/v1/auth/update-password`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Error");
      setPwdMsg({ type: "ok", text: "Password updated successfully" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err: any) {
      setPwdMsg({ type: "err", text: err.message });
    } finally {
      setPwdLoading(false);
    }
  }

  async function handleRotateKey() {
    setRotateLoading(true);
    setRotateMsg(null);
    try {
      const res = await fetch(`${apiUrl}/v1/auth/rotate-key`, {
        method: "POST",
        headers: getAuthHeadersNoContent(),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Error");
      setApiKey(data.api_key);
      localStorage.setItem("skopos_api_key", data.api_key);
      setRotateMsg({ type: "ok", text: "API key rotated successfully" });
    } catch (err: any) {
      setRotateMsg({ type: "err", text: err.message });
    } finally {
      setRotateLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const badge = planBadge[plan] ?? planBadge.starter;

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>Loading…</span>
    </div>
  );

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: "1px solid #111111",
        backgroundColor: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
      }}>
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

      <div style={{ minHeight: "100vh", backgroundColor: "#000", padding: "80px 24px 40px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div>
            <h1 style={{ ...INTER, fontSize: "18px", color: "#e6edf3", fontWeight: 600, margin: 0 }}>Profile</h1>
            <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: "4px 0 0 0" }}>Manage your account settings</p>
            </div>
          </div>
          <span style={{ ...INTER, fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "4px", color: "#4ade80", backgroundColor: "rgba(74,222,128,0.08)", letterSpacing: "0.05em" }}>
            {badge.label}
          </span>
        </div>

        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Account</span>
          <div>
            <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Email</label>
            <div style={{ ...INTER, fontSize: "13px", color: "#e6edf3", marginTop: "6px", padding: "8px 12px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px" }}>
              {email}
            </div>
          </div>
          <div>
            <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Password</label>
            <div style={{ ...INTER, fontSize: "13px", color: "#e6edf3", marginTop: "6px", padding: "8px 12px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ letterSpacing: "0.2em" }}>••••••••</span>
              <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>
                {passwordChangedAt ? `Last changed ${new Date(passwordChangedAt).toLocaleDateString("en-GB")}` : "Never changed"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>API Key</span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "#4ade80", padding: "8px 12px", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {apiKey}
            </div>
            <button onClick={handleCopy} style={{ ...INTER, fontSize: "11px", color: copied ? "#4ade80" : "#a0aab4", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 14px", cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.2s" }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>Rotating will invalidate your current key</span>
            <button onClick={handleRotateKey} disabled={rotateLoading} style={{ ...INTER, fontSize: "11px", color: "#f87171", backgroundColor: "transparent", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "5px", padding: "6px 12px", cursor: "pointer", opacity: rotateLoading ? 0.5 : 1 }}>
              {rotateLoading ? "Rotating…" : "Rotate key"}
            </button>
          </div>
          {rotateMsg && (
            <span style={{ ...INTER, fontSize: "11px", color: rotateMsg.type === "ok" ? "#4ade80" : "#f87171" }}>{rotateMsg.text}</span>
          )}
        </div>

        {/* Piano attivo */}
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Current Plan</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ ...INTER, fontSize: "14px", color: "#e6edf3", fontWeight: 600 }}>{badge.label}</span>
              <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>
                {plan === "starter" && "10,000 logs/hour · 1 project · 7-day retention · 5 AI insights/month"}
                {plan === "indie" && "100,000 logs/hour · 3 projects · 21-day retention · 5 alert rules"}
                {plan === "pro" && "500,000 logs/hour · 10 projects · 60-day retention · 20 alert rules"}
                {plan === "business" && "5,000,000 logs/hour · Unlimited projects · 90-day retention · Unlimited alerts"}
              </span>
            </div>
            <a
              href="/pricing"
              style={{ ...INTER, fontSize: "12px", fontWeight: 600, color: "#4ade80", backgroundColor: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "5px", padding: "8px 16px", textDecoration: "none", whiteSpace: "nowrap" }}
            >
              {plan === "starter" ? "Upgrade plan →" : "Manage plan →"}
            </a>
          </div>
        </div>

        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Change Password</span>
          <form onSubmit={handlePasswordUpdate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {([
              { label: "Current Password", value: currentPassword, set: setCurrentPassword },
              { label: "New Password", value: newPassword, set: setNewPassword },
              { label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword },
            ] as { label: string; value: string; set: (v: string) => void }[]).map(({ label, value, set }) => (
              <div key={label}>
                <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={e => set(e.target.value)}
                  required
                  style={{ ...INTER, display: "block", width: "100%", marginTop: "6px", fontSize: "13px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 12px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            ))}
            {pwdMsg && (
              <span style={{ ...INTER, fontSize: "11px", color: pwdMsg.type === "ok" ? "#4ade80" : "#f87171" }}>{pwdMsg.text}</span>
            )}
            <button type="submit" disabled={pwdLoading} style={{ ...INTER, fontSize: "12px", fontWeight: 600, color: "#000", backgroundColor: "#4ade80", border: "none", borderRadius: "5px", padding: "10px 20px", cursor: "pointer", opacity: pwdLoading ? 0.7 : 1, alignSelf: "flex-start" }}>
              {pwdLoading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>

      </div>
    </div>
    </>
  );
}
