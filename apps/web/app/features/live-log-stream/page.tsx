"use client";

import { IS_PRE_LAUNCH, PRE_LAUNCH_CTA_HREF, PRE_LAUNCH_CTA_LABEL } from "@/lib/preLaunch";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LiveLogStreamPage() {
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
                            Live Log Stream
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
                                <span className="ml-4 text-xs text-[#7d8590]">skopos.app/dashboard — Live Log Stream</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                                <span className="text-xs text-brand-green font-bold tracking-wider uppercase">● live</span>
                            </div>
                        </div>

                        {/* Filter bar */}
                        <div className="px-4 py-3 flex items-center gap-3 border-b border-brand-border bg-brand-bg/40">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#7d8590] uppercase tracking-widest">Level</span>
                                <select className="bg-brand-bg border border-brand-border text-[#e6edf3] text-xs rounded px-3 py-1.5 cursor-pointer focus:outline-none focus:border-brand-green">
                                    <option>ALL</option>
                                    <option>ERROR</option>
                                    <option>WARN</option>
                                    <option>INFO</option>
                                    <option>DEBUG</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-[10px] text-[#7d8590] uppercase tracking-widest">Service</span>
                                <input
                                    placeholder="filter by service…"
                                    className="flex-1 bg-brand-bg border border-brand-border text-xs rounded px-3 py-1.5 text-[#e6edf3] placeholder:text-[#7d8590] focus:outline-none focus:border-brand-green"
                                    readOnly
                                />
                            </div>
                            <span className="text-[10px] text-[#7d8590] tabular-nums">17 events</span>
                        </div>

                        <div className="p-4 space-y-1 font-mono text-xs max-h-[480px] overflow-y-auto">
                            {[
                                ["21:00:42.118", "ERROR", "user-service", "Database connection failed: timeout after 30s (pool exhausted, 0/20 available)"],
                                ["21:00:42.954", "ERROR", "user-service", "Retry attempt 1/3 failed: ECONNREFUSED on pg-primary.internal:5432"],
                                ["21:00:43.331", "WARN", "api-gateway", "Rate limit approaching: 85% of quota used (8500/10000 req/min)"],
                                ["21:00:43.892", "INFO", "auth-service", "User login successful: user_id=a3f9b2, method=oauth_google"],
                                ["21:00:44.205", "ERROR", "payment-svc", "Stripe webhook signature verification failed (event=evt_1QXK2pAb)"],
                                ["21:00:44.601", "DEBUG", "cache-service", "Cache miss for key: user:profile:a3f9b2 (ttl=0, hit_ratio=0.94)"],
                                ["21:00:45.087", "INFO", "email-service", "Email sent successfully to user@example.com (template=welcome_v2)"],
                                ["21:00:45.512", "ERROR", "user-service", "Database connection failed: timeout after 30s (3rd occurrence in 60s)"],
                                ["21:00:46.001", "WARN", "load-balancer", "Server response time > 500ms threshold (p95=612ms, target=300ms)"],
                                ["21:00:46.480", "INFO", "worker-service", "Background job completed: invoice_generation (ms=842, rows=1247)"],
                                ["21:00:47.119", "DEBUG", "cache-service", "Cache hit for key: session:b8d4f2 (age=2.1s)"],
                                ["21:00:47.703", "ERROR", "payment-svc", "Stripe charge failed: card_declined (charge=ch_3QXK2p, amount=$49.00)"],
                                ["21:00:48.244", "INFO", "auth-service", "JWT token refreshed for user_id=c7e1f9 (exp=+1h)"],
                                ["21:00:48.812", "WARN", "api-gateway", "Slow query detected: GET /v1/users (1240ms, db=primary)"],
                                ["21:00:49.337", "INFO", "worker-service", "Queue depth normal: 14 pending, 2 in-flight, 0 failed"],
                                ["21:00:49.901", "DEBUG", "cache-service", "Cache evicted 142 keys (lru, memory_pressure=0.82)"],
                                ["21:00:50.456", "ERROR", "user-service", "Unhandled exception in /v1/users/me: NoneType has no attribute 'email'"],
                            ].map(([time, level, service, msg], i) => (
                                <div key={i} className="flex gap-3 items-baseline px-2 py-1 rounded hover:bg-brand-muted/20 transition-colors">
                                    <span className="text-[#7d8590] shrink-0 tabular-nums">{time}</span>
                                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold w-14 text-center uppercase ${level === "ERROR" ? "text-red-400 bg-red-400/10" :
                                            level === "WARN" ? "text-yellow-400 bg-yellow-400/10" :
                                                level === "DEBUG" ? "text-[#7d8590] bg-[#7d8590]/10" :
                                                    "text-blue-400 bg-blue-400/10"
                                        }`}>{level}</span>
                                    <span className="text-brand-green shrink-0 w-28 truncate">{service}</span>
                                    <span className="text-[#e6edf3]">{msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="max-w-6xl mx-auto px-6 mb-20">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-12" style={{ letterSpacing: "-0.02em" }}>
                        Everything you need to monitor logs in real-time
                    </h2>
                    <div className="space-y-6 max-w-2xl mx-auto">
                        {[
                            ["Sub-second latency", "Logs appear in your dashboard within milliseconds of being generated. No delays, no batching."],
                            ["Advanced filtering", "Filter by log level, service name, or any custom field. Combine filters for pinpoint precision."],
                            ["Persistent history", "Every log is stored and searchable. Go back in time to debug issues that happened days ago."],
                            ["Multi-service view", "Monitor all your services in one unified stream. Switch between services with a single click."],
                            ["Level highlighting", "ERROR, WARN, INFO, DEBUG — each level is color-coded for instant visual recognition."],
                            ["Export & share", "Export logs as CSV or share a filtered view with your team for collaborative debugging."],
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