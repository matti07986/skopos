"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { apiUrl, getAuthHeadersNoContent } from "@/lib/api";

const INTER = { fontFamily: "'Inter', sans-serif" };

type RangeKey = "1h" | "6h" | "24h" | "7d";

const RANGES: { value: RangeKey; label: string }[] = [
  { value: "1h",  label: "1h"  },
  { value: "6h",  label: "6h"  },
  { value: "24h", label: "24h" },
  { value: "7d",  label: "7d"  },
];

interface MetricPoint {
  timestamp: string;
  value: number | null;
}

interface MetricsResponse {
  error_rate:   MetricPoint[];
  latency_p95:  MetricPoint[];
  throughput:   MetricPoint[];
  range: string;
  bucket_size: string;
}

/* ─── helpers ──────────────────────────────────────────────────────── */

function buildSvgPath(
  points: (number | null)[],
  width = 400,
  height = 60,
  pad = 4,
): { area: string; line: string; hasData: boolean } {
  const valid = points
    .map((v, i) => (v !== null && Number.isFinite(v) ? { i, v } : null))
    .filter((x): x is { i: number; v: number } => x !== null);

  if (valid.length < 2) return { area: "", line: "", hasData: false };

  const max = Math.max(...valid.map(p => p.v), 0.0001);
  const min = Math.min(...valid.map(p => p.v));
  const range = max - min || 1;
  const lastIdx = points.length - 1 || 1;

  const xy = valid.map(p => {
    const x = (p.i / lastIdx) * width;
    const y = height - pad - ((p.v - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const line = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${xy[xy.length - 1].x.toFixed(1)},${height} L${xy[0].x.toFixed(1)},${height} Z`;

  return { area, line, hasData: true };
}

function lastNonNull(points: MetricPoint[]): number | null {
  for (let i = points.length - 1; i >= 0; i--) {
    if (points[i].value !== null) return points[i].value;
  }
  return null;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function latencyTone(ms: number | null): string {
  if (ms === null) return "#a0aab4";
  if (ms < 200) return "#4ade80";
  if (ms < 500) return "#facc15";
  return "#f87171";
}

function formatErrorRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(2)}%`;
}

function errorRateTone(rate: number | null): string {
  if (rate === null) return "#a0aab4";
  if (rate < 0.01) return "#4ade80";
  if (rate < 0.05) return "#facc15";
  return "#f87171";
}

function sumThroughput(points: MetricPoint[]): number {
  return points.reduce((acc, p) => acc + (p.value ?? 0), 0);
}

function formatThroughputTotal(total: number, range: RangeKey): string {
  // Compute logs/min average over window
  const windowMinutes = { "1h": 60, "6h": 360, "24h": 1440, "7d": 10080 }[range];
  const perMin = total / windowMinutes;
  if (perMin >= 1000) return `${(perMin / 1000).toFixed(1)}k logs/min`;
  if (perMin >= 1) return `${perMin.toFixed(1)} logs/min`;
  return `${total} total in ${range}`;
}

/* ─── mini chart card ──────────────────────────────────────────────── */

function MiniChart({
  label,
  color,
  rightHeader,
  points,
  emptyHint,
  loading,
}: {
  label: string;
  color: string;
  rightHeader: { text: string; color: string };
  points: (number | null)[];
  emptyHint?: string;
  loading: boolean;
}) {
  const gradId = useMemo(() => `mc-grad-${label.replace(/\s/g, "")}-${Math.random().toString(36).slice(2, 7)}`, [label]);
  const { area, line, hasData } = buildSvgPath(points);

  return (
    <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", ...INTER }}>
        <span style={{ color: "#a0aab4", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ color: rightHeader.color, fontSize: "10px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {rightHeader.text}
        </span>
      </div>

      {loading ? (
        <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", ...INTER, color: "#555e6b", fontSize: 10 }}>
          Loading…
        </div>
      ) : !hasData ? (
        <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", ...INTER, color: "#555e6b", fontSize: 10, textAlign: "center", padding: "0 12px" }}>
          {emptyHint ?? "No data in this range"}
        </div>
      ) : (
        <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradId})`} />
          <path d={line} stroke={color} strokeWidth="1.5" fill="none" />
        </svg>
      )}
    </div>
  );
}

/* ─── main component ───────────────────────────────────────────────── */

export function MetricsCharts({ projectId }: { projectId: string }) {
  const [range, setRange] = useState<RangeKey>("24h");
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${apiUrl}/v1/projects/${projectId}/metrics?range=${range}`,
        { headers: getAuthHeadersNoContent(), credentials: "include" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as MetricsResponse;
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "fetch failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, range]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  const errorRatePoints = data?.error_rate.map(p => p.value) ?? [];
  const latencyPoints   = data?.latency_p95.map(p => p.value) ?? [];
  const throughputPoints = data?.throughput.map(p => p.value) ?? [];

  const currentErrorRate = data ? lastNonNull(data.error_rate) : null;
  const currentLatency   = data ? lastNonNull(data.latency_p95) : null;
  const totalThroughput  = data ? sumThroughput(data.throughput) : 0;

  const latencyHasAnyData = data ? data.latency_p95.some(p => p.value !== null) : false;

  return (
    <section>
      {/* Range selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 className="text-[10px] font-semibold text-[#7d8590] uppercase tracking-[0.15em]" style={INTER}>
          Live metrics
        </h2>
        <div style={{ display: "inline-flex", border: "1px solid #1e1e1e", borderRadius: 6, overflow: "hidden" }}>
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              style={{
                ...INTER,
                fontSize: 10,
                fontWeight: 600,
                padding: "5px 10px",
                background: range === r.value ? "#1e1e1e" : "transparent",
                color: range === r.value ? "#e6edf3" : "#7d8590",
                border: "none",
                cursor: "pointer",
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ ...INTER, fontSize: 11, color: "#f87171", marginBottom: 8 }}>
          Failed to load metrics: {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <MiniChart
          label="ERROR RATE"
          color="#f87171"
          rightHeader={{
            text: formatErrorRate(currentErrorRate),
            color: errorRateTone(currentErrorRate),
          }}
          points={errorRatePoints}
          loading={loading}
        />
        <MiniChart
          label="LATENCY (p95)"
          color="#4ade80"
          rightHeader={{
            text: latencyHasAnyData ? `${formatLatency(currentLatency)} · p95` : "no data",
            color: latencyTone(currentLatency),
          }}
          points={latencyPoints}
          emptyHint={
            !latencyHasAnyData && !loading
              ? "Send `latency_ms` in event metadata to enable this chart. See /docs."
              : undefined
          }
          loading={loading}
        />
        <MiniChart
          label="THROUGHPUT"
          color="#a855f7"
          rightHeader={{
            text: formatThroughputTotal(totalThroughput, range),
            color: "#a855f7",
          }}
          points={throughputPoints}
          loading={loading}
        />
      </div>
    </section>
  );
}
