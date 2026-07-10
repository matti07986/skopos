"use client";

import { useState, useEffect, useRef } from "react";

const TIMEZONES = {
  ROM: { name: "Rome", tz: "Europe/Rome" },
  SYD: { name: "Sydney", tz: "Australia/Sydney" },
  NYC: { name: "New York", tz: "America/New_York" },
  SFO: { name: "San Francisco", tz: "America/Los_Angeles" },
  PEK: { name: "Beijing", tz: "Asia/Shanghai" },
} as const;

type TimezoneKey = keyof typeof TIMEZONES;

export default function HeaderClock() {
  const [tzKey, setTzKey] = useState<TimezoneKey>("ROM");
  const [time, setTime] = useState("--:--:--");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("skopos:timezone") as TimezoneKey | null;
    if (saved && saved in TIMEZONES) setTzKey(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("skopos:timezone", tzKey);
  }, [tzKey]);

  useEffect(() => {
    const update = () => {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: TIMEZONES[tzKey].tz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      setTime(formatter.format(new Date()));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [tzKey]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Timezone: ${TIMEZONES[tzKey].name}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 6px",
          borderRadius: "4px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "11px",
          lineHeight: 1,
          transition: "background-color 120ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <span style={{ color: "#4ade80", fontWeight: 600 }}>{tzKey}</span>
        <span style={{ color: "#e6edf3" }}>{time}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "180px",
            padding: "4px 0",
            borderRadius: "6px",
            backgroundColor: "#0d0d0d",
            border: "1px solid #1e1e1e",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            zIndex: 100,
          }}
        >
          {(Object.keys(TIMEZONES) as TimezoneKey[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                setTzKey(key);
                setOpen(false);
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "11px",
                color: tzKey === key ? "#4ade80" : "#e6edf3",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <span style={{ fontWeight: 600 }}>{key}</span>
              <span style={{ color: "#6e7681", fontSize: "10px" }}>{TIMEZONES[key].name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
