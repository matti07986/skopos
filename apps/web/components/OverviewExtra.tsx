"use client";

import { useState, useEffect, useCallback } from "react";
import { getAuthHeadersNoContent, apiUrl } from "@/lib/api";
import { useProjects } from "@/components/ProjectContext";
import { useData } from "@/components/DataContext";

const INTER = { fontFamily: "'Inter', sans-serif" };

const LEVEL_COLOR: Record<string, string> = {
  ERROR: "#cd4040",
  WARN:  "#c49a1a",
  INFO:  "#a0aab4",
  DEBUG: "#555e6b",
};

function timeAgo(ts: string): string {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface LogEvent {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
}

interface Monitor {
  id: string;
  name: string;
  url: string;
  last_status: string | null;
}

interface Check {
  id: string;
  checked_at: string;
  status: string;
  status_code: number | null;
  error: string | null;
  response_ms: number | null;
}

interface Incident {
  monitorName: string;
  monitorUrl: string;
  check: Check;
}

export default function OverviewExtra() {

  const { logs: contextLogs, monitors, monitorChecks, loading: dataLoading } = useData();

  // Recent Logs: ultimi 8
  const displayLogs = contextLogs.slice(0, 8);
  const loadingLogs = dataLoading;

  // Recent Incidents: ricava da monitors + monitorChecks dal context
  const incidents: Incident[] = (() => {
    const all: Incident[] = [];
    monitors.forEach((m) => {
      const checks = monitorChecks[m.id] || [];
      checks
        .filter((c) => c.status === "down" || c.error)
        .forEach((c) => all.push({ monitorName: m.name, monitorUrl: m.url, check: c }));
    });
    all.sort((a, b) => new Date(b.check.checked_at).getTime() - new Date(a.check.checked_at).getTime());
    return all.slice(0, 6);
  })();
  const loadingIncidents = dataLoading;

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#0a0a0a",
    border: "1px solid #222",
    borderRadius: "6px",
    padding: "20px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    color: "#a0aab4",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "16px",
    ...INTER,
  };

  const emptyStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "#555e6b",
    ...INTER,
    textAlign: "center",
    padding: "24px 0",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>

      {/* RECENT LOGS */}
      <div style={cardStyle}>
        <div style={labelStyle}>{"Recent Logs"}</div>
        {loadingLogs ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: "18px", backgroundColor: "#111", borderRadius: "3px", width: i % 2 === 0 ? "70%" : "50%", opacity: 0.6 }} />
            ))}
          </div>
        ) : displayLogs.length === 0 ? (
          <div style={emptyStyle}>{"No logs yet"}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {displayLogs.map((log, i) => (
              <div key={log.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 0",
                borderBottom: i < displayLogs.length - 1 ? "1px solid #141414" : "none",
              }}>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: LEVEL_COLOR[log.level] ?? "#a0aab4",
                  width: "40px",
                  flexShrink: 0,
                  ...INTER,
                }}>{log.level}</span>
                <span style={{
                  fontSize: "12px",
                  color: "#a0aab4",
                  width: "80px",
                  flexShrink: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  ...INTER,
                }}>{log.service}</span>
                <span style={{
                  fontSize: "12px",
                  color: "#e0e6ef",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  ...INTER,
                }}>{log.message}</span>
                <span style={{
                  fontSize: "11px",
                  color: "#555e6b",
                  flexShrink: 0,
                  ...INTER,
                }}>{timeAgo(log.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT INCIDENTS */}
      <div style={cardStyle}>
        <div style={labelStyle}>{"Recent Incidents"}</div>
        {loadingIncidents ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ height: "18px", backgroundColor: "#111", borderRadius: "3px", width: i % 2 === 0 ? "60%" : "45%", opacity: 0.6 }} />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div style={emptyStyle}>{"No incidents — everything is up ✓"}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {incidents.map((inc, i) => (
              <div key={inc.check.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "9px 0",
                borderBottom: i < incidents.length - 1 ? "1px solid #141414" : "none",
              }}>
                <span style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#cd4040",
                  flexShrink: 0,
                  display: "inline-block",
                }} />
                <span style={{
                  fontSize: "12px",
                  color: "#e0e6ef",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  ...INTER,
                }}>{inc.monitorName}</span>
                <span style={{
                  fontSize: "11px",
                  color: "#cd4040",
                  flexShrink: 0,
                  ...INTER,
                }}>{inc.check.status_code ? `${inc.check.status_code}` : "DOWN"}</span>
                <span style={{
                  fontSize: "11px",
                  color: "#555e6b",
                  flexShrink: 0,
                  ...INTER,
                }}>{timeAgo(inc.check.checked_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
