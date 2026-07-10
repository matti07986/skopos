"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Logo from "@/components/ui/logo";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const INTER = { fontFamily: "'Inter', sans-serif" };

interface ShareData {
  project_name: string;
  uptime_24h: number;
  uptime_7d: number;
  total_events_24h: number;
  error_count_24h: number;
  warn_count_24h: number;
  info_count_24h: number;
  status: string;
  generated_at: string;
}

interface ChartPoint {
  time: string;
  errors: number;
  warnings: number;
  info: number;
}

const statusConfig = {
  operational: { label: "All Systems Operational", color: "#4ade80", bg: "rgba(74,222,128,0.06)", dot: "#4ade80" },
  degraded:    { label: "Partial Degradation",      color: "#fbbf24", bg: "rgba(251,191,36,0.06)",  dot: "#fbbf24" },
  outage:      { label: "Major Outage",             color: "#f87171", bg: "rgba(248,113,113,0.06)", dot: "#f87171" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "10px 14px", ...INTER }}>
      <p style={{ fontSize: "10px", color: "#a0aab4", margin: "0 0 6px 0" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: "11px", color: p.color, margin: "2px 0", fontWeight: 500 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function Chart({ data, title, interval = 3 }: { data: ChartPoint[]; title: string; interval?: number }) {
  return (
    <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px" }}>
      <p style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 20px 0", fontWeight: 500 }}>{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gWarn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gInfo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#141414" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: "#a0aab4", fontSize: 9, fontFamily: "'Inter', sans-serif" }} tickLine={false} axisLine={false} interval={interval} />
          <YAxis tick={{ fill: "#a0aab4", fontSize: 9, fontFamily: "'Inter', sans-serif" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="errors" name="Errors" stroke="#f87171" strokeWidth={1.5} fill="url(#gErr)" dot={false} />
          <Area type="monotone" dataKey="warnings" name="Warnings" stroke="#fbbf24" strokeWidth={1.5} fill="url(#gWarn)" dot={false} />
          <Area type="monotone" dataKey="info" name="Info" stroke="#4ade80" strokeWidth={1.5} fill="url(#gInfo)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: "20px", marginTop: "12px", justifyContent: "center" }}>
        {[{ label: "Errors", color: "#f87171" }, { label: "Warnings", color: "#fbbf24" }, { label: "Info", color: "#4ade80" }].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: color }} />
            <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<ShareData | null>(null);
  const [hourly, setHourly] = useState<ChartPoint[]>([]);
  const [minutely, setMinutely] = useState<ChartPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL;

  async function fetchAll() {
    try {
      const [main, h] = await Promise.all([
        fetch(`${api}/v1/share/${token}`).then(r => { if (r.status === 404) throw new Error("404"); return r.json(); }),
        fetch(`${api}/v1/share/${token}/hourly`).then(r => r.json()),
      ]);
      setData(main);
      setHourly(Array.isArray(h) ? h : []);

      // Prova a caricare dati al minuto
      const m = await fetch(`${api}/v1/share/${token}/minutely`);
      if (m.ok) setMinutely(await m.json());
      else setMinutely(null);
    } catch (e: any) {
      if (e.message === "404") setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>Loading...</span>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
      <Logo size={32} />
      <p style={{ ...INTER, fontSize: "16px", color: "#e6edf3", fontWeight: 600 }}>Dashboard not found</p>
      <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4" }}>This shared dashboard does not exist or has been revoked.</p>
      <a href="/" style={{ ...INTER, fontSize: "12px", color: "#4ade80", textDecoration: "none" }}>← skopos.ink</a>
    </div>
  );

  if (!data) return null;
  const config = statusConfig[data.status as keyof typeof statusConfig] ?? statusConfig.operational;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", flexDirection: "column" }}>

      <nav style={{ borderBottom: "1px solid #111", backgroundColor: "rgba(0,0,0,0.95)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 32px", height: "52px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Logo size={22} />
            <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>skopos</span>
            <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>/</span>
            <span style={{ ...INTER, color: "#e6edf3", fontSize: "13px", fontWeight: 600 }}>{data.project_name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: config.dot }} />
            <span style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>
              Updated {new Date(data.generated_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "3px 8px" }}>
              Read only
            </span>
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: "960px", margin: "0 auto", width: "100%", padding: "40px 32px", display: "flex", flexDirection: "column", gap: "24px" }}>

        <div style={{ backgroundColor: config.bg, border: `1px solid ${config.color}20`, borderRadius: "10px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: config.dot, flexShrink: 0, boxShadow: `0 0 8px ${config.dot}` }} />
          <p style={{ ...INTER, fontSize: "15px", color: config.color, fontWeight: 600, margin: 0 }}>{config.label}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            { label: "Uptime 24h", value: `${data.uptime_24h}%`, color: data.uptime_24h >= 99 ? "#4ade80" : data.uptime_24h >= 90 ? "#fbbf24" : "#f87171" },
            { label: "Uptime 7d", value: `${data.uptime_7d}%`, color: data.uptime_7d >= 99 ? "#4ade80" : data.uptime_7d >= 90 ? "#fbbf24" : "#f87171" },
            { label: "Total Events", value: data.total_events_24h.toLocaleString(), color: "#e6edf3" },
            { label: "Error Rate", value: data.total_events_24h > 0 ? `${((data.error_count_24h / data.total_events_24h) * 100).toFixed(1)}%` : "0%", color: data.error_count_24h > 0 ? "#f87171" : "#4ade80" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "18px 20px" }}>
              <p style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px 0", fontWeight: 500 }}>{label}</p>
              <p style={{ ...INTER, fontSize: "22px", color, fontWeight: 700, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {[
            { label: "Errors", value: data.error_count_24h, color: "#f87171", bg: "rgba(248,113,113,0.06)" },
            { label: "Warnings", value: data.warn_count_24h, color: "#fbbf24", bg: "rgba(251,191,36,0.06)" },
            { label: "Info", value: data.info_count_24h, color: "#4ade80", bg: "rgba(74,222,128,0.06)" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ backgroundColor: bg, border: `1px solid ${color}20`, borderRadius: "8px", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", margin: 0 }}>{label}</p>
              <p style={{ ...INTER, fontSize: "24px", color, fontWeight: 700, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        <Chart data={hourly} title="Events — Last 24 Hours (hourly)" interval={3} />

        {minutely !== null && (
          <Chart data={minutely} title="Events — Last 60 Minutes (per minute)" interval={9} />
        )}

      </div>

      <footer style={{ borderTop: "1px solid #111", padding: "20px 32px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: 0 }}>Read-only dashboard · No log data is shared</p>
          <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: 0 }}>
            Powered by <a href="https://skopos.ink" style={{ color: "#4ade80", textDecoration: "none", fontWeight: 500 }}>Skopos</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
