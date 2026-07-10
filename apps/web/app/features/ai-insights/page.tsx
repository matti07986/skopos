"use client";

import { IS_PRE_LAUNCH, PRE_LAUNCH_CTA_HREF, PRE_LAUNCH_CTA_LABEL } from "@/lib/preLaunch";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AiInsightsPage() {
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
                            Root Cause Analysis
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
                                <span className="ml-4 text-xs text-[#7d8590]">skopos.app/dashboard — Root Cause Analysis</span>
                            </div>
                            <span className="text-xs text-brand-green">✦ 3 new insights</span>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                {
                                    title: "Stripe webhook signature verification failing",
                                    service: "payment-svc",
                                    ago: "2 min ago",
                                    occurrences: 7,
                                    confidence: 92,
                                    rootCause: "Stripe webhook signature verification fails because the raw request body is being parsed by middleware before reaching the verification handler. Stripe's signature is computed against the raw body, so parsing it as JSON breaks the HMAC comparison.",
                                    fix: `- app.use(express.json());
- app.post('/webhook', handleStripeWebhook);
+ app.post('/webhook',
+   express.raw({ type: 'application/json' }),
+   handleStripeWebhook
+ );
+ app.use(express.json());`,
                                },
                                {
                                    title: "Database connection pool exhausted",
                                    service: "user-service",
                                    ago: "12 min ago",
                                    occurrences: 14,
                                    confidence: 84,
                                    rootCause: "A long-running analytics query holds a connection for ~45s while an async retry loop in the request handler keeps requesting new connections from the same pool. With pool_size=20 and avg query time of 50ms, the pool empties in under 2 seconds during traffic spikes.",
                                    fix: `- pool = create_pool(size=20)
+ pool = create_pool(size=20, timeout=5)
+
+ # Move analytics queries to a dedicated pool
+ analytics_pool = create_pool(size=5)
+
- result = await pool.fetch(analytics_query)
+ result = await analytics_pool.fetch(analytics_query)`,
                                },
                                {
                                    title: "Rate-limit middleware reading wrong client IP",
                                    service: "api-gateway",
                                    ago: "1 hr ago",
                                    occurrences: 5,
                                    confidence: 67,
                                    rootCause: "The rate-limit middleware reads the client IP from req.connection.remoteAddress, but the service runs behind a load balancer that terminates TLS. Every request appears to come from the same upstream proxy IP, so per-user rate limits never trigger correctly.",
                                    fix: `- const ip = req.connection.remoteAddress;
+ const forwarded = req.headers['x-forwarded-for'];
+ const ip = (typeof forwarded === 'string'
+   ? forwarded.split(',')[0].trim()
+   : req.connection.remoteAddress);
+ // Ensure 'trust proxy' is set:
+ app.set('trust proxy', 1);`,
                                },
                            ].map((insight, i) => {
                                const confColor =
                                    insight.confidence > 80 ? "bg-brand-green text-brand-green" :
                                    insight.confidence > 60 ? "bg-yellow-400 text-yellow-400" :
                                    "bg-red-400 text-red-400";
                                const [barColor, textColor] = confColor.split(" ");
                                return (
                                    <div
                                        key={i}
                                        className={`bg-brand-bg border rounded-lg p-5 ${i === 0 ? "border-brand-green" : "border-brand-border"}`}
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-[#e6edf3] mb-1">{insight.title}</h3>
                                                <p className="text-[10px] text-[#7d8590]">
                                                    {insight.ago} · <span className="text-brand-green">{insight.service}</span> · {insight.occurrences} occurrences
                                                </p>
                                            </div>
                                            <div className="shrink-0 w-32">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[9px] text-[#7d8590] uppercase tracking-widest">Confidence</span>
                                                    <span className={`text-[10px] font-bold tabular-nums ${textColor}`}>{insight.confidence}%</span>
                                                </div>
                                                <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${barColor} rounded-full`}
                                                        style={{ width: `${insight.confidence}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-[#e6edf3] mb-3 leading-relaxed">
                                            <span className="text-brand-green font-bold">Root cause:</span> {insight.rootCause}
                                        </p>
                                        <p className="text-[10px] text-[#7d8590] uppercase tracking-widest mb-2">Suggested fix</p>
                                        <pre className="bg-black border border-brand-border rounded p-3 text-[11px] text-brand-green overflow-x-auto font-mono leading-relaxed">{insight.fix}</pre>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="max-w-6xl mx-auto px-6 mb-20">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-12" style={{ letterSpacing: "-0.02em" }}>
                        Debug in minutes, not hours
                    </h2>
                    <div className="space-y-6 max-w-2xl mx-auto">
                        {[
                            ["Pattern detection", "Errors are grouped by fingerprint. Once a pattern hits 5+ occurrences, Claude analyzes it automatically."],
                            ["Plain-English explanations", "No more cryptic stack traces. Get a clear narrative of what failed, where, and why — written in human language."],
                            ["Actionable code fixes", "Suggested fixes come as real code diffs you can copy-paste, not vague advice. Built for engineers in a hurry."],
                            ["Confidence scoring", "Every insight ships with a 0–100% confidence score so you know when to trust the AI and when to dig deeper."],
                            ["Language-agnostic", "Works with Python, Node.js, Go, Ruby, Java — anything that produces logs. The model reasons about the failure, not syntax."],
                            ["Cached for cost", "Repeated patterns reuse cached analyses. You pay for the first occurrence, not the next 100."],
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
