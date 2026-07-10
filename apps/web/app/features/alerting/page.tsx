"use client";

import { IS_PRE_LAUNCH, PRE_LAUNCH_CTA_HREF, PRE_LAUNCH_CTA_LABEL } from "@/lib/preLaunch";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AlertingPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const heroStyle: React.CSSProperties = {
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.6s ease",
    };

    return (
        <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/landing" className="text-brand-green font-bold text-xl">skopos</Link>
                    <div className="flex items-center gap-4">
                        <Link href="/landing#features" className="text-sm text-[#7d8590] hover:text-white transition-colors">← Back to features</Link>
                        <Link href={IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_HREF : "/login"} className="bg-brand-green hover:bg-[#2aad65] text-black font-bold text-sm px-4 py-2 rounded transition-colors">{IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_LABEL : "Start free trial"}</Link>
                    </div>
                </div>
            </nav>

            <main className="pt-24 pb-24">
                {/* Hero */}
                <section className="max-w-4xl mx-auto px-6 text-center mb-20">
                    <div style={heroStyle}>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6" style={{ letterSpacing: "-0.02em" }}>
                            Smart Alerting
                        </h1>
                    </div>
                </section>

                {/* Mock */}
                <section className="max-w-2xl mx-auto px-6 mb-20 transform scale-90 space-y-6">
                    {/* Rules card */}
                    <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-2xl">
                        <div className="border-b border-brand-border px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                <span className="ml-4 text-xs text-[#7d8590]">skopos.app/alerts — Active Rules</span>
                            </div>
                            <span className="text-xs text-[#7d8590]">4 rules · 3 active · 1 paused</span>
                        </div>
                        <div className="p-6 space-y-3">
                            {[
                                { name: "High error rate", level: "ERROR", threshold: 10, window: 60, channel: "email", dest: "ops@company.com", active: true },
                                { name: "Auth service warnings", level: "WARN", threshold: 50, window: 300, channel: "slack", dest: "#alerts", active: true },
                                { name: "Critical payment failures", level: "ERROR", threshold: 3, window: 60, channel: "email", dest: "oncall@company.com", active: true },
                                { name: "API gateway anomalies", level: "ERROR", threshold: 20, window: 120, channel: "slack", dest: "#api-team", active: false },
                            ].map((rule) => (
                                <div key={rule.name} className="bg-brand-bg border border-brand-border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                            <span className="text-sm text-[#e6edf3] font-bold">{rule.name}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${rule.level === "ERROR" ? "text-red-400 bg-red-400/10" : "text-yellow-400 bg-yellow-400/10"}`}>{rule.level}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${rule.active ? "text-brand-green bg-brand-green/10" : "text-[#7d8590] bg-[#7d8590]/10"}`}>
                                                {rule.active ? "● active" : "○ paused"}
                                            </span>
                                            <span className="text-[10px] text-[#7d8590] bg-brand-muted/30 px-1.5 py-0.5 rounded uppercase">{rule.channel}</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-[#7d8590]">
                                        ≥ {rule.threshold} {rule.level} events in {rule.window}s
                                        <span className="mx-1.5 text-brand-muted">→</span>
                                        <span className="text-[#e6edf3]">{rule.dest}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent fired alerts */}
                    <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-2xl">
                        <div className="border-b border-brand-border px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                <span className="ml-4 text-xs text-[#7d8590]">Recently fired alerts</span>
                            </div>
                            <span className="text-xs text-[#7d8590]">last 24h</span>
                        </div>
                        <div className="divide-y divide-brand-border">
                            {[
                                {
                                    rule: "Critical payment failures",
                                    ago: "1 min ago",
                                    service: "payment-svc",
                                    message: "28 ERROR events in last 60s — threshold was 3",
                                    channel: "email → oncall@company.com",
                                    status: "delivered",
                                },
                                {
                                    rule: "High error rate",
                                    ago: "47 min ago",
                                    service: "user-service",
                                    message: "14 ERROR events in last 60s — threshold was 10 (db pool exhausted)",
                                    channel: "slack → #incidents",
                                    status: "delivered",
                                },
                                {
                                    rule: "Auth service warnings",
                                    ago: "3 hr ago",
                                    service: "auth-service",
                                    message: "67 WARN events in last 5m — threshold was 50 (jwt clock skew)",
                                    channel: "slack → #alerts",
                                    status: "delivered",
                                },
                            ].map((a, i) => (
                                <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-brand-muted/10 transition-colors">
                                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1.5 animate-pulse" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                            <span className="text-sm font-bold text-[#e6edf3]">{a.rule}</span>
                                            <span className="text-[10px] text-[#7d8590]">{a.ago}</span>
                                            <span className="text-[10px] text-brand-green">{a.service}</span>
                                        </div>
                                        <p className="text-xs text-[#7d8590] mb-1">{a.message}</p>
                                        <p className="text-[10px] text-[#7d8590]">
                                            <span className="text-brand-muted">{a.channel}</span>
                                            <span className="mx-1.5 text-brand-muted">·</span>
                                            <span className="text-brand-green">✓ {a.status}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="max-w-6xl mx-auto px-6 mb-20">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-12" style={{ letterSpacing: "-0.02em" }}>
                        Built for on-call sanity
                    </h2>
                    <div className="space-y-6 max-w-2xl mx-auto">
                        {[
                            ["Email & Slack channels", "Route any rule to email addresses or Slack webhooks. Different rules can go to different channels — ops, oncall, frontend, whatever fits your team."],
                            ["Threshold-based triggers", "Fire only when N events of a given level happen within a time window. No more pages for transient blips."],
                            ["Configurable time windows", "60 seconds for critical paths, 5 minutes for warnings, 1 hour for trends. You set what matters."],
                            ["Per-service granularity", "Scope alerts to specific services with one filter. Stop the auth-service spam from drowning out your payments alerts."],
                            ["Auto-deduplication", "Once an alert fires, it won't fire again for the same pattern in the same window. Quiet inboxes, signal-rich pages."],
                            ["Audit trail", "Every fired alert is logged with timestamp, payload, and delivery status. Replay history during postmortems."],
                        ].map(([title, desc]) => (
                            <div key={title} className="flex gap-4 items-start">
                                <span className="text-[#3fb950] text-lg shrink-0 mt-0.5">
                                    —
                                </span>
                                <div>
                                    <h3 className="text-white font-bold text-base mb-1">{title}</h3>
                                    <p className="text-[#7d8590] text-sm leading-relaxed">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Back link */}
                <section className="max-w-3xl mx-auto px-6 text-center">
                    <Link href="/landing#features" className="text-sm text-[#7d8590] hover:text-white transition-colors">
                        ← Back to features
                    </Link>
                </section>
            </main>
        </div>
    );
}
