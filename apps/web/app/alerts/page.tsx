"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getAuthHeaders, getAuthHeadersNoContent, apiUrl } from "@/lib/api";

// ─── types ────────────────────────────────────────────────────────────────────

interface AlertRule {
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

// ─── helpers ──────────────────────────────────────────────────────────────────

const INTER: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

const levelBadge: Record<string, string> = {
    ERROR: "text-red-400 bg-red-400/10",
    WARN: "text-yellow-400 bg-yellow-400/10",
    INFO: "text-blue-400 bg-blue-400/10",
    DEBUG: "text-[#7d8590] bg-[#7d8590]/10",
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

const inputCls =
    "w-full bg-brand-bg border border-brand-border text-[#e6edf3] text-xs rounded px-3 py-2 placeholder:text-[#7d8590] focus:outline-none focus:border-brand-green transition-colors";

// ─── CreateAlertForm ──────────────────────────────────────────────────────────

interface CreateAlertFormProps {
    onSuccess: (rule: AlertRule) => void;
    onCancel: () => void;
}

function CreateAlertForm({ onSuccess, onCancel }: CreateAlertFormProps) {
    const [name, setName] = useState("");
    const [level, setLevel] = useState<AlertLevel>("ERROR");
    const [threshold, setThreshold] = useState("5");
    const [windowSeconds, setWindowSeconds] = useState("60");
    const [channel, setChannel] = useState<AlertChannel>("email");
    const [destination, setDestination] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        const t = parseInt(threshold);
        const w = parseInt(windowSeconds);
        if (!name.trim()) { setError("Name is required."); return; }
        if (!destination.trim()) { setError("Destination is required."); return; }
        if (isNaN(t) || t < 1) { setError("Threshold must be ≥ 1."); return; }
        if (isNaN(w) || w < 10) { setError("Window must be ≥ 10 seconds."); return; }

        setCreating(true);
        try {
            const res = await apiFetch("/v1/alerts", {
                method: "POST",
                body: JSON.stringify({
                    name,
                    level,
                    threshold: t,
                    window_seconds: w,
                    channel,
                    destination,
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as { detail?: string }).detail ?? `HTTP ${res.status}`);
            }
            const created: AlertRule = await res.json();
            onSuccess(created);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setCreating(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-brand-surface border border-brand-border rounded-lg p-5 space-y-4"
        >
            <p className="text-[10px] font-semibold text-[#7d8590] uppercase tracking-[0.15em]" style={INTER}>
                New Alert Rule
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#7d8590] uppercase tracking-[0.12em]" style={INTER}>Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="High error rate"
                        className={inputCls}
                        style={INTER}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#7d8590] uppercase tracking-[0.12em]" style={INTER}>Level</label>
                    <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value as AlertLevel)}
                        className={`${inputCls} cursor-pointer`}
                        style={INTER}
                    >
                        {(["ERROR", "WARN", "INFO", "DEBUG"] as AlertLevel[]).map((l) => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#7d8590] uppercase tracking-[0.12em]" style={INTER}>Threshold (events)</label>
                    <input
                        type="number"
                        min={1}
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        className={inputCls}
                        style={INTER}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#7d8590] uppercase tracking-[0.12em]" style={INTER}>Window (seconds)</label>
                    <input
                        type="number"
                        min={10}
                        value={windowSeconds}
                        onChange={(e) => setWindowSeconds(e.target.value)}
                        className={inputCls}
                        style={INTER}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#7d8590] uppercase tracking-[0.12em]" style={INTER}>Channel</label>
                    <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value as AlertChannel)}
                        className={`${inputCls} cursor-pointer`}
                        style={INTER}
                    >
                        <option value="email">Email</option>
                        <option value="slack">Slack</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-[#7d8590] uppercase tracking-[0.12em]" style={INTER}>
                        {channel === "email" ? "Email address" : "Slack webhook URL"}
                    </label>
                    <input
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder={channel === "email" ? "you@company.com" : "https://hooks.slack.com/…"}
                        className={inputCls}
                        style={INTER}
                    />
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-400" style={INTER}>{error}</p>
            )}

            <div className="flex gap-2 pt-1">
                <button
                    type="submit"
                    disabled={creating}
                    className="text-xs px-4 py-2 rounded bg-brand-green text-brand-bg font-bold hover:bg-[#2aad65] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={INTER}
                >
                    {creating ? "Creating…" : "Create rule"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-xs px-4 py-2 rounded border border-brand-border text-[#7d8590] hover:text-[#e6edf3] hover:border-brand-muted transition-colors"
                    style={INTER}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

// ─── page ──────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchRules = useCallback(async () => {
        try {
            const res = await apiFetch("/v1/alerts");
            if (res.ok) setRules(await res.json());
        } catch {
            // network error — ignora
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    async function handleDelete(id: string) {
        if (!window.confirm("Delete this alert rule? This cannot be undone.")) return;
        setDeleting(id);
        try {
            await apiFetch(`/v1/alerts/${id}`, { method: "DELETE" });
            setRules((r) => r.filter((rule) => rule.id !== id));
        } finally {
            setDeleting(null);
        }
    }

    return (
        <div className="min-h-screen bg-brand-bg" style={INTER}>
            {/* Navbar */}
            <header className="border-b border-brand-border px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="text-brand-green font-bold text-lg tracking-tight" style={INTER}>skopos</Link>
                    <span className="text-brand-muted text-xs">/</span>
                    <span className="text-[#e6edf3] text-sm" style={INTER}>alerts</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xs text-[#7d8590] hover:text-[#e6edf3] transition-colors" style={INTER}>
                        ← Dashboard
                    </Link>
                    <Link href="/settings" className="text-xs text-[#7d8590] hover:text-[#e6edf3] transition-colors" style={INTER}>
                        Settings
                    </Link>
                </div>
            </header>

            <main className="p-6 max-w-3xl mx-auto space-y-6">
                {/* Page header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#e6edf3]" style={{ ...INTER, letterSpacing: "-0.02em" }}>
                            Alert Rules
                        </h1>
                        <p className="text-xs text-[#7d8590] mt-1" style={INTER}>
                            Trigger email or Slack notifications when error thresholds are exceeded.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm((v) => !v)}
                        className="text-xs px-3 py-2 rounded border border-brand-green/40 text-brand-green hover:bg-brand-green/5 transition-colors"
                        style={INTER}
                    >
                        {showForm ? "Cancel" : "+ New rule"}
                    </button>
                </div>

                {/* Create form */}
                {showForm && (
                    <CreateAlertForm
                        onSuccess={(rule) => {
                            setRules((r) => [...r, rule]);
                            setShowForm(false);
                        }}
                        onCancel={() => setShowForm(false)}
                    />
                )}

                {/* Rules list */}
                <div className="bg-brand-surface border border-brand-border rounded-lg overflow-hidden">
                    {loading ? (
                        <p className="p-8 text-center text-xs text-[#7d8590]" style={INTER}>Loading…</p>
                    ) : rules.length === 0 ? (
                        <div className="p-12 flex flex-col items-center gap-3 text-[#7d8590]" style={INTER}>
                            <span className="text-3xl">⚑</span>
                            <p className="text-sm">No alert rules yet.</p>
                            <p className="text-xs">
                                Click <span className="text-brand-green">+ New rule</span> to set up your first one.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-brand-border">
                            {rules.map((rule) => (
                                <div
                                    key={rule.id}
                                    className="flex items-center gap-4 px-5 py-4 hover:bg-brand-muted/10 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                            <span className="text-sm text-[#e6edf3] font-bold" style={INTER}>
                                                {rule.name}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${levelBadge[rule.level] ?? "text-[#7d8590]"}`}
                                                style={INTER}
                                            >
                                                {rule.level}
                                            </span>
                                            <span
                                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${rule.is_active
                                                        ? "text-brand-green bg-brand-green/10"
                                                        : "text-[#7d8590] bg-[#7d8590]/10"
                                                    }`}
                                                style={INTER}
                                            >
                                                {rule.is_active ? "● active" : "○ paused"}
                                            </span>
                                            <span className="text-[10px] text-[#7d8590] bg-brand-muted/30 px-1.5 py-0.5 rounded" style={INTER}>
                                                {rule.channel}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#7d8590]" style={INTER}>
                                            ≥ {rule.threshold} {rule.level} events in {rule.window_seconds}s
                                            <span className="mx-1.5 text-brand-muted">→</span>
                                            <span className="text-[#e6edf3]">{rule.destination}</span>
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(rule.id)}
                                        disabled={deleting === rule.id}
                                        className="shrink-0 text-[11px] text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-40"
                                        style={INTER}
                                    >
                                        {deleting === rule.id ? "Deleting…" : "Delete"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
