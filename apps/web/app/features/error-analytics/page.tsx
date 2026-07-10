"use client";

import { IS_PRE_LAUNCH, PRE_LAUNCH_CTA_HREF, PRE_LAUNCH_CTA_LABEL } from "@/lib/preLaunch";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ErrorAnalyticsPage() {
    const bars = [2, 5, 3, 8, 12, 6, 4, 9, 15, 7, 3, 6, 8, 11, 4, 2, 7, 9, 5, 3, 8, 6, 4, 2];
    const total = bars.reduce((s, n) => s + n, 0);
    const peak = Math.max(...bars);

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
                            Error Analytics
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
                                <span className="ml-4 text-xs text-[#7d8590]">skopos.app/dashboard — Error Analytics</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                                <span className="text-[#7d8590]">total <span className="text-red-400 font-bold tabular-nums">{total}</span></span>
                                <span className="text-[#7d8590]">peak <span className="text-red-400 font-bold tabular-nums">{peak}/h</span></span>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-[10px] text-[#7d8590] uppercase tracking-widest mb-4">Errors — Last 24 Hours</p>
                            <div className="h-48 bg-brand-bg border border-brand-border rounded-lg flex items-end gap-1 px-3 py-3 mb-2 relative">
                                {bars.map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                        <span className="absolute -top-5 text-[9px] text-[#7d8590] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">{h}</span>
                                        <div
                                            style={{ height: `${(h / peak) * 100}%` }}
                                            className={`w-full rounded-sm transition-colors ${h >= peak * 0.66 ? "bg-red-400/80 group-hover:bg-red-400" : h >= peak * 0.33 ? "bg-red-400/50 group-hover:bg-red-400/80" : "bg-red-400/30 group-hover:bg-red-400/60"}`}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-[#7d8590] tabular-nums px-3 mb-6">
                                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>now</span>
                            </div>

                            {/* Top 5 errors table */}
                            <p className="text-[10px] text-[#7d8590] uppercase tracking-widest mb-3">Top 5 errors</p>
                            <div className="bg-brand-bg border border-brand-border rounded-lg overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="border-b border-brand-border">
                                        <tr>
                                            <th className="text-left px-4 py-2 text-[10px] font-semibold text-[#7d8590] uppercase tracking-[0.12em]">Message</th>
                                            <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#7d8590] uppercase tracking-[0.12em]">Count</th>
                                            <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#7d8590] uppercase tracking-[0.12em]">First seen</th>
                                            <th className="text-right px-4 py-2 text-[10px] font-semibold text-[#7d8590] uppercase tracking-[0.12em]">Last seen</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-brand-border">
                                        {[
                                            ["Database connection failed: timeout after 30s", 47, "23h ago", "1m ago"],
                                            ["Stripe webhook signature verification failed", 28, "6h ago", "1m ago"],
                                            ["Redis command timed out: cluster_down", 18, "11h ago", "12m ago"],
                                            ["NullPointer in /v1/users/me handler", 14, "4h ago", "32m ago"],
                                            ["JWT verification failed: token expired", 9, "8h ago", "1h ago"],
                                        ].map(([msg, count, first, last], i) => (
                                            <tr key={i} className="hover:bg-brand-muted/10 transition-colors">
                                                <td className="px-4 py-2.5 text-[#e6edf3] truncate max-w-md">{msg}</td>
                                                <td className="px-4 py-2.5 text-red-400 font-bold tabular-nums text-right">{count}</td>
                                                <td className="px-4 py-2.5 text-[#7d8590] tabular-nums text-right">{first}</td>
                                                <td className="px-4 py-2.5 text-[#7d8590] tabular-nums text-right">{last}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="max-w-6xl mx-auto px-6 mb-20">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-12" style={{ letterSpacing: "-0.02em" }}>
                        Numbers that tell a story
                    </h2>
                    <div className="space-y-6 max-w-2xl mx-auto">
                        {[
                            ["Hourly buckets", "24 hours of error counts at one-hour resolution. Spot patterns by time of day — is your 3am job leaking, or is it user traffic at lunch?"],
                            ["Peak detection", "Total errors and peak rate displayed at a glance. Know whether you're trending up, holding steady, or stable."],
                            ["Service breakdown", "See which service contributed the most errors. Stop debugging the wrong codebase."],
                            ["Auto-refresh", "Chart updates every 30 seconds in the background. No manual reloads, no stale numbers."],
                            ["Hover tooltips", "Mouse over any bar for the exact count and timestamp. Built for fast triage."],
                            ["Powered by TimescaleDB", "Sub-second queries on millions of events. The chart loads even when your error count doesn't."],
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
