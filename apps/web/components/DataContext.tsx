"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getAuthHeadersNoContent, apiUrl } from "@/lib/api";
import { useProjects } from "@/components/ProjectContext";

export interface LogEvent {
    id: string;
    timestamp: string;
    level: "ERROR" | "WARN" | "INFO" | "DEBUG";
    message: string;
    service: string;
    metadata?: Record<string, unknown>;
    fingerprint?: string;
}

export interface Insight {
    id: string;
    pattern_id: string;
    project_id: string;
    root_cause: string;
    suggested_fix: string;
    confidence: number;
    created_at: string;
}

export interface Monitor {
    id: string;
    name: string;
    url: string;
    last_status: string | null;
}

export interface MonitorCheck {
    id: string;
    checked_at: string;
    status: string;
    status_code: number | null;
    error: string | null;
    response_ms: number | null;
}

interface DataContextType {
    logs: LogEvent[];
    insights: Insight[];
    monitors: Monitor[];
    monitorChecks: Record<string, MonitorCheck[]>;
    loading: boolean;
    refresh: () => void;
}

const DataContext = createContext<DataContextType>({
    logs: [],
    insights: [],
    monitors: [],
    monitorChecks: {},
    loading: true,
    refresh: () => { },
});

export function useData() {
    return useContext(DataContext);
}

const POLL_INTERVAL_MS = 5000;

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { activeProject } = useProjects();
    const [logs, setLogs] = useState<LogEvent[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [monitors, setMonitors] = useState<Monitor[]>([]);
    const [monitorChecks, setMonitorChecks] = useState<Record<string, MonitorCheck[]>>({});
    const [loading, setLoading] = useState(true);
    const fetchingRef = useRef(false);
    const lastFetchRef = useRef(0);
    const MIN_INTERVAL_MS = 3000;

    const fetchAll = useCallback(async (force: boolean = false) => {
        if (!activeProject?.id) return;
        if (fetchingRef.current) return;
        const now = Date.now();
        if (!force && now - lastFetchRef.current < MIN_INTERVAL_MS) return;
        lastFetchRef.current = now;
        fetchingRef.current = true;
        try {
            const headers = getAuthHeadersNoContent();
            const pid = `project_id=${activeProject.id}`;

            const [logsRes, insRes, monRes] = await Promise.all([
                fetch(`${apiUrl}/v1/logs?limit=1000&${pid}`, { headers, credentials: "include" }),
                fetch(`${apiUrl}/v1/insights?limit=100&${pid}`, { headers, credentials: "include" }),
                fetch(`${apiUrl}/v1/monitors?${pid}`, { headers, credentials: "include" }),
            ]);

            const newLogs: LogEvent[] = logsRes.ok ? await logsRes.json() : [];
            const newInsights: Insight[] = insRes.ok ? await insRes.json() : [];
            const newMonitors: Monitor[] = monRes.ok ? await monRes.json() : [];

            setLogs(Array.isArray(newLogs) ? newLogs : []);
            setInsights(Array.isArray(newInsights) ? newInsights : []);
            setMonitors(Array.isArray(newMonitors) ? newMonitors : []);

            // Fetch ultimi checks per ogni monitor (per Recent Incidents)
            if (Array.isArray(newMonitors) && newMonitors.length > 0) {
                const checks: Record<string, MonitorCheck[]> = {};
                await Promise.all(newMonitors.map(async (m) => {
                    try {
                        const r = await fetch(`${apiUrl}/v1/monitors/${m.id}/checks?limit=10`, { headers, credentials: "include" });
                        if (r.ok) checks[m.id] = await r.json();
                    } catch {}
                }));
                setMonitorChecks(checks);
            } else {
                setMonitorChecks({});
            }
        } catch (e) {
            console.error("[DataContext] fetch failed:", e);
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, [activeProject?.id]);

    // Reset al cambio progetto + fetch immediato
    useEffect(() => {
        if (!activeProject?.id) return;
        setLoading(true);
        setLogs([]);
        setInsights([]);
        setMonitors([]);
        setMonitorChecks({});
        fetchAll();
    }, [activeProject?.id, fetchAll]);

    // Polling
    useEffect(() => {
        if (!activeProject?.id) return;
        const interval = setInterval(fetchAll, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [activeProject?.id, fetchAll]);

    // Refetch immediato quando il tab torna visibile
    useEffect(() => {
        if (!activeProject?.id) return;
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                fetchAll();
            }
        };
        const onFocus = () => { fetchAll(); };
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);
        return () => {
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
        };
    }, [activeProject?.id, fetchAll]);

    return (
        <DataContext.Provider value={{ logs, insights, monitors, monitorChecks, loading, refresh: fetchAll }}>
            {children}
        </DataContext.Provider>
    );
}
