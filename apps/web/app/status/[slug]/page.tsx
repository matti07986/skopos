"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Logo from "@/components/ui/logo";

const INTER = { fontFamily: "'Inter', sans-serif" };

interface StatusData {
  project_name: string;
  slug: string;
  range: string;
  uptime: number;
  total_events: number;
  error_events: number;
  uptime_24h: number;
  uptime_7d: number;
  uptime_30d: number;
  total_events_24h: number;
  error_events_24h: number;
  status: string;
  last_updated: string;
}

const statusConfig = {
  operational: { label: "All Systems Operational", color: "#4ade80", bg: "rgba(74,222,128,0.1)", dot: "#4ade80" },
  degraded:    { label: "Partial Degradation",      color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  dot: "#fbbf24" },
  outage:      { label: "Major Outage",             color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171" },
};

export default function StatusPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/status/${slug}?range=${range}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setData(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/status/${slug}?range=${range}`)
        .then(r => r.json()).then(setData).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [slug, range]);

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>Loading...</span>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      <Logo size={32} />
      <p style={{ ...INTER, fontSize: "16px", color: "#e6edf3", fontWeight: 600 }}>Status page not found</p>
      <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4" }}>This status page is not enabled or does not exist.</p>
      <a href="/" style={{ ...INTER, fontSize: "12px", color: "#4ade80", textDecoration: "none" }}>← Back to Skopos</a>
    </div>
  );

  if (!data) return null;

  const config = statusConfig[data.status as keyof typeof statusConfig] ?? statusConfig.operational;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>

      {/* Navbar */}
      <nav style={{ borderBottom: "1px solid #111", backgroundColor: "rgba(0,0,0,0.92)" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 24px", height: "48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Logo size={20} />
            <span style={{ ...INTER, color: "#a0aab4", fontSize: "12px" }}>skopos</span>
            <span style={{ ...INTER, color: "#a0aab4", fontSize: "12px" }}>/</span>
            <span style={{ ...INTER, color: "#e6edf3", fontSize: "12px", fontWeight: 500 }}>{data.project_name}</span>
          </div>
          <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4" }}>
            Updated {new Date(data.last_updated).toLocaleTimeString()}
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "48px 24px", display: "flex", flexDirection: "column", gap: "32px" }}>

        {/* Status banner */}
        <div style={{ backgroundColor: config.bg, border: `1px solid ${config.color}30`, borderRadius: "10px", padding: "24px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: config.dot, flexShrink: 0 }} />
          <div>
            <p style={{ ...INTER, fontSize: "18px", color: config.color, fontWeight: 700, margin: 0 }}>{config.label}</p>
            <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: "4px 0 0 0" }}>{data.project_name} status</p>
          </div>
        </div>

        {/* Range selector */}
        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
          {(["24h", "7d", "30d"] as const).map(r => (
            <button key={r} onClick={() => setRange(r)}
              style={{
                ...INTER, fontSize: "11px", padding: "6px 14px", borderRadius: "6px", cursor: "pointer",
                border: range === r ? "1px solid #4ade80" : "1px solid #1a1a1a",
                backgroundColor: range === r ? "rgba(74,222,128,0.1)" : "transparent",
                color: range === r ? "#4ade80" : "#a0aab4",
                fontWeight: range === r ? 600 : 400,
              }}>
              {r === "24h" ? "24 hours" : r === "7d" ? "7 days" : "30 days"}
            </button>
          ))}
        </div>

        {/* Uptime cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          {[
            { label: "Uptime — 24h", value: `${data.uptime_24h}%`, color: data.uptime_24h >= 99 ? "#4ade80" : data.uptime_24h >= 90 ? "#fbbf24" : "#f87171", active: range === "24h" },
            { label: "Uptime — 7 days", value: `${data.uptime_7d}%`, color: data.uptime_7d >= 99 ? "#4ade80" : data.uptime_7d >= 90 ? "#fbbf24" : "#f87171", active: range === "7d" },
            { label: "Uptime — 30 days", value: `${data.uptime_30d}%`, color: data.uptime_30d >= 99 ? "#4ade80" : data.uptime_30d >= 90 ? "#fbbf24" : "#f87171", active: range === "30d" },
          ].map(({ label, value, color, active }) => (
            <div key={label} style={{ backgroundColor: "#0a0a0a", border: active ? "1px solid #4ade8030" : "1px solid #1a1a1a", borderRadius: "8px", padding: "20px" }}>
              <p style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px 0" }}>{label}</p>
              <p style={{ ...INTER, fontSize: "26px", color, fontWeight: 700, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Event stats */}
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{range === "24h" ? "Last 24 Hours" : range === "7d" ? "Last 7 Days" : "Last 30 Days"}</p>
          {[
            { label: "Total events", value: data.total_events, color: "#e6edf3" },
            { label: "Error events", value: data.error_events, color: data.error_events > 0 ? "#f87171" : "#4ade80" },
            { label: "Success rate", value: `${data.uptime}%`, color: data.uptime >= 99 ? "#4ade80" : "#fbbf24" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #111" }}>
              <span style={{ ...INTER, fontSize: "13px", color: "#a0aab4" }}>{label}</span>
              <span style={{ ...INTER, fontSize: "13px", color, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>
            Powered by <a href="https://skopos.ink" style={{ color: "#4ade80", textDecoration: "none" }}>Skopos</a>
          </p>
        </div>

      </div>
    </div>
  );
}
