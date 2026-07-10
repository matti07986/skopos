"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/logo";
import HeaderClock from "@/components/HeaderClock";
import { getAuthHeadersNoContent, apiUrl } from "@/lib/api";

const INTER = { fontFamily: "'Inter', sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

interface LogEvent {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
}

type LevelFilter = "ALL" | "ERROR" | "WARN" | "INFO" | "DEBUG";

const levelColor: Record<string, string> = {
  ERROR: "#f87171",
  WARN:  "#fbbf24",
  INFO:  "#4ade80",
  DEBUG: "#a0aab4",
};

function parseQuery(raw: string): { level?: string; service?: string; message?: string; text: string } {
  const result: { level?: string; service?: string; message?: string; text: string } = { text: "" };
  const remaining: string[] = [];
  raw.trim().split(/\s+/).forEach(token => {
    if (token.startsWith("level:")) result.level = token.slice(6).toUpperCase();
    else if (token.startsWith("service:")) result.service = token.slice(8);
    else if (token.startsWith("message:") || token.startsWith("msg:")) result.message = token.slice(token.indexOf(":") + 1).toLowerCase();
    else remaining.push(token);
  });
  result.text = remaining.join(" ").toLowerCase();
  return result;
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    const tz = typeof window !== "undefined" ? (localStorage.getItem("skopos_timezone") ?? "UTC") : "UTC";
    return d.toLocaleString("en-GB", { hour12: false, timeZone: tz });
  } catch { return iso; }
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const parsed = parseQuery(query);
    const from = fromDate ? new Date(fromDate).getTime() : null;
    const to = toDate ? new Date(toDate).getTime() + 86400000 : null;
    const effectiveLevel = parsed.level ?? (levelFilter !== "ALL" ? levelFilter : undefined);

    return logs.filter(log => {
      if (parsed.text && !log.message?.toLowerCase().includes(parsed.text)) return false;
      if (parsed.message && !log.message?.toLowerCase().includes(parsed.message)) return false;
      if (parsed.service && log.service !== parsed.service) return false;
      if (effectiveLevel && log.level !== effectiveLevel) return false;
      if (from || to) {
        const t = new Date(log.timestamp).getTime();
        if (from && t < from) return false;
        if (to && t > to) return false;
      }
      return true;
    });
  }, [logs, query, levelFilter, fromDate, toDate]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const token = localStorage.getItem("skopos_access_token") ?? "";
      const res = await fetch(`${apiUrl}/v1/logs?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) { router.push("/login"); return; }
      setLogs(await res.json());
    } catch {}
    finally { setLoading(false); }
  }

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
            <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>/</span>
            <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>search</span>
          </div>
          <a href="/projects" style={{ ...INTER, color: "#a0aab4", fontSize: "11px", textDecoration: "none" }}>Dashboard →</a>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "80px 32px 60px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Header */}
        <div>
          <h1 style={{ ...INTER, fontSize: "18px", color: "#e6edf3", fontWeight: 600, margin: 0 }}>Search Logs</h1>
          <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: "4px 0 0 0" }}>Find log entries by message, level, service or date range</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Query input */}
          <div>
            <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Search</label>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='level:ERROR service:api message:timeout — or just type keywords'
              style={{ ...INTER, display: "block", width: "100%", marginTop: "6px", fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "9px 12px", outline: "none", boxSizing: "border-box" }}
            />
            <p style={{ ...INTER, fontSize: "10px", color: "#a0aab4", marginTop: "6px" }}>
              Query language:{" "}
              <code style={{ ...MONO, color: "#4ade80", fontSize: "10px" }}>level:ERROR</code>{" "}
              <code style={{ ...MONO, color: "#4ade80", fontSize: "10px" }}>service:api</code>{" "}
              <code style={{ ...MONO, color: "#4ade80", fontSize: "10px" }}>message:timeout</code>
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>Level</label>
              <select
                value={levelFilter}
                onChange={e => setLevelFilter(e.target.value as LevelFilter)}
                style={{ ...INTER, display: "block", width: "100%", marginTop: "6px", fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 10px", outline: "none" }}
              >
                {["ALL", "ERROR", "WARN", "INFO", "DEBUG"].map(l => (
                  <option key={l} value={l}>{l === "ALL" ? "All levels" : l}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>From</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                style={{ ...INTER, display: "block", width: "100%", marginTop: "6px", fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 10px", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>To</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                style={{ ...INTER, display: "block", width: "100%", marginTop: "6px", fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 10px", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...INTER, fontSize: "12px", fontWeight: 600, color: "#000", backgroundColor: "#4ade80", border: "none", borderRadius: "5px", padding: "10px 20px", cursor: "pointer", opacity: loading ? 0.7 : 1, alignSelf: "flex-start" }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {/* Results */}
        {hasSearched && (
          <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Results</span>
              <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>{filtered.length} log{filtered.length !== 1 ? "s" : ""} found</span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", margin: 0 }}>No logs found</p>
                <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", marginTop: "4px" }}>Try different search terms or filters</p>
              </div>
            ) : (
              <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                {filtered.map(log => (
                  <div
                    key={log.id}
                    style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "8px 16px", borderBottom: "1px solid #0f0f0f", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#111")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span style={{ ...MONO, fontSize: "10px", color: "#2a2a2a", flexShrink: 0, minWidth: "140px" }}>
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span style={{ ...INTER, fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "3px", color: levelColor[log.level] ?? "#a0aab4", backgroundColor: `${levelColor[log.level] ?? "#a0aab4"}15`, flexShrink: 0, minWidth: "44px", textAlign: "center" }}>
                      {log.level}
                    </span>
                    <span style={{ ...INTER, fontSize: "11px", color: "#4ade80", flexShrink: 0, maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.service}
                    </span>
                    <span style={{ ...MONO, fontSize: "11px", color: "#a0aab4", wordBreak: "break-all", lineHeight: 1.5 }}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!hasSearched && (
          <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "8px", height: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", margin: 0 }}>Enter a search term to find logs</p>
            <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", margin: 0 }}>Use query language for advanced filtering</p>
          </div>
        )}

      </div>
    </div>
  );
}
