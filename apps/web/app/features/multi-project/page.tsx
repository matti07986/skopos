"use client";

import { IS_PRE_LAUNCH, PRE_LAUNCH_CTA_HREF, PRE_LAUNCH_CTA_LABEL } from "@/lib/preLaunch";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MultiProjectPage() {
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
                            Multi-Project
                        </h1>
                    </div>
                </section>

                {/* Mock */}
                <section className="max-w-2xl mx-auto px-6 mb-20 transform scale-90">
                    <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-2xl">
                        <div className="border-b border-brand-border px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                                <span className="ml-4 text-xs text-[#7d8590]">skopos.app/projects</span>
                            </div>
                            <button className="text-[10px] text-brand-green border border-brand-green/40 rounded px-3 py-1 hover:bg-brand-green/10 transition-colors">+ New project</button>
                        </div>
                        <div className="p-6 space-y-3">
                            {[
                                {
                                    name: "production-api",
                                    status: "active",
                                    logs: 12421,
                                    errors: 47,
                                    key: "sk_live_8f3a••••••••••••c92e",
                                    description: "main customer-facing API",
                                    statusColor: "bg-brand-green",
                                },
                                {
                                    name: "staging-env",
                                    status: "active",
                                    logs: 843,
                                    errors: 2,
                                    key: "sk_test_a1b2••••••••••••d4e5",
                                    description: "pre-prod testing environment",
                                    statusColor: "bg-brand-green",
                                },
                                {
                                    name: "mobile-backend",
                                    status: "active",
                                    logs: 3104,
                                    errors: 12,
                                    key: "sk_live_99ff••••••••••••0011",
                                    description: "iOS + Android backend",
                                    statusColor: "bg-yellow-400",
                                },
                                {
                                    name: "worker-jobs",
                                    status: "idle",
                                    logs: 0,
                                    errors: 0,
                                    key: "sk_live_4422••••••••••••8855",
                                    description: "background queue processor",
                                    statusColor: "bg-[#7d8590]",
                                },
                            ].map((p) => (
                                <div key={p.name} className="bg-brand-bg border border-brand-border rounded-lg p-4 hover:border-brand-green/30 transition-colors">
                                    <div className="flex items-start justify-between mb-3 gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.statusColor} ${p.status === "active" ? "animate-pulse" : ""}`} />
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-[#e6edf3] font-bold">{p.name}</span>
                                                    <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${p.status === "active" ? "text-brand-green bg-brand-green/10" : "text-[#7d8590] bg-[#7d8590]/10"}`}>
                                                        {p.status}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-[#7d8590] mt-0.5">{p.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs shrink-0">
                                            <div className="text-right">
                                                <p className="text-[9px] text-[#7d8590] uppercase tracking-widest">Logs today</p>
                                                <p className="text-[#e6edf3] font-bold tabular-nums">{p.logs.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-[#7d8590] uppercase tracking-widest">Errors</p>
                                                <p className={`font-bold tabular-nums ${p.errors === 0 ? "text-[#7d8590]" : "text-red-400"}`}>{p.errors}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-[#7d8590] uppercase tracking-widest shrink-0">API Key</span>
                                        <code className="text-[10px] text-brand-green bg-black border border-brand-border rounded px-2 py-0.5 truncate flex-1 font-mono">{p.key}</code>
                                        <span className="text-[10px] text-[#7d8590] shrink-0">copy</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="max-w-6xl mx-auto px-6 mb-20">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-12" style={{ letterSpacing: "-0.02em" }}>
                        One account. All your services.
                    </h2>
                    <div className="space-y-6 max-w-2xl mx-auto">
                        {[
                            ["Isolated API keys", "Each project ships with its own scoped key. A leaked key on staging never exposes your production logs."],
                            ["Per-project dashboards", "Switch context with one click in the navbar. Each project has its own metrics, logs, insights, and alert rules."],
                            ["Granular alert routing", "Production alerts go to oncall. Staging alerts go to dev. Configure rules per project, not per team."],
                            ["Independent retention", "Keep production logs for 90 days, staging for 7. Cost-optimize without sacrificing where it matters."],
                            ["Unified billing", "All projects under one subscription. No surprise bills, no per-project fees, no add-ons."],
                            ["Rapid onboarding", "Spin up a new project in seconds. Copy the API key, drop it into your SDK init, done."],
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
