"use client";

import { IS_PRE_LAUNCH, PRE_LAUNCH_CTA_HREF, PRE_LAUNCH_CTA_LABEL } from "@/lib/preLaunch";
import Link from "next/link";
import { useState, useEffect, useRef, type RefObject } from "react";
import Logo from "@/components/ui/logo";

// ─── scroll-reveal hook ───────────────────────────────────────────────────────

function useInView<T extends Element>(ref: RefObject<T | null>): boolean {
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setInView(entry.isIntersecting);
            },
            { threshold: 0.15 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);
    return inView;
}

function revealStyle(
    inView: boolean,
    delay = 0,
    mode: "slide" | "scale" = "slide",
): React.CSSProperties {
    return {
        opacity: inView ? 1 : 0,
        transform: inView
            ? mode === "scale" ? "scale(1)" : "translateY(0)"
            : mode === "scale" ? "scale(0.95)" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        transitionDelay: `${delay}ms`,
    };
}

// ─── nav ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
];

function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/95">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Logo size={28} />
                    <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>skopos</span>
                </div>

                {/* Desktop links */}
                <div className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((l) => (
                        <a key={l.label} href={l.href} style={{ fontFamily: "'Inter', sans-serif" }} className="text-sm text-[#7d8590] hover:text-[#e6edf3] transition-colors font-bold text-white">
                            {l.label}
                        </a>
                    ))}
                </div>

                {/* Desktop CTAs */}
                <div className="hidden md:flex items-center gap-3">
                    {!IS_PRE_LAUNCH && (
                      <Link href="/login" style={{ fontFamily: "'Inter', sans-serif" }} className="text-sm text-[#7d8590] hover:text-[#e6edf3] transition-colors font-bold text-white">
                        {"Log in"}
                      </Link>
                    )}
                    <Link href={IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_HREF : "/login"} style={{ fontFamily: "'Inter', sans-serif" }} className="bg-brand-green hover:bg-[#2aad65] text-black font-bold font-bold text-sm px-4 py-2 rounded transition-colors">
                        {IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_LABEL : "Start free"}
                    </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-label="Toggle menu"
                    aria-expanded={open}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    className="md:hidden text-white text-2xl leading-none w-9 h-9 flex items-center justify-center rounded hover:bg-white/5 transition-colors"
                >
                    {open ? "✕" : "☰"}
                </button>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden bg-black border-t border-white/10">
                    <div className="px-6 py-4 flex flex-col gap-3">
                        {NAV_LINKS.map((l) => (
                            <a
                                key={l.label}
                                href={l.href}
                                onClick={() => setOpen(false)}
                                style={{ fontFamily: "'Inter', sans-serif" }}
                                className="text-sm text-[#7d8590] hover:text-white transition-colors py-2"
                            >
                                {l.label}
                            </a>
                        ))}
                        <div className="h-px bg-white/10 my-1" />
                        {!IS_PRE_LAUNCH && (
                          <Link
                            href="/login"
                            onClick={() => setOpen(false)}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                            className="text-sm text-[#7d8590] hover:text-white transition-colors py-2"
                          >
                            Sign in
                          </Link>
                        )}
                        <Link
                            href={IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_HREF : "/login"}
                            onClick={() => setOpen(false)}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                            className="bg-brand-green hover:bg-[#2aad65] text-black font-bold text-sm px-4 py-2.5 rounded transition-colors text-center"
                        >
                            {IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_LABEL : "Start free"}
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}

// ─── hero ─────────────────────────────────────────────────────────────────────

function Hero() {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref);

    return (
        <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20">
            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
            {/* Green glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-green/10 rounded-full blur-[120px]" />

            <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
                <h1
                    style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em", ...revealStyle(inView, 100) }}
                    className="text-3xl sm:text-4xl font-bold text-white font-bold text-white leading-tight mb-6"
                >
                    {"See what's breaking."}<br />
                    <span style={{ fontFamily: "'Inter', sans-serif" }} className="text-brand-green">{"Fix it fast."}</span>
                </h1>

                <p
                    style={{ fontFamily: "'Inter', sans-serif", ...revealStyle(inView, 200) }}
                    className="text-sm text-[#7d8590] max-w-2xl mx-auto mb-12"
                >
                    {"Stop guessing. Start fixing. Real-time log monitoring with Smart insights."}
                </p>

                <div
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    style={revealStyle(inView, 300)}
                >
                    <Link href={IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_HREF : "/login"} style={{ fontFamily: "'Inter', sans-serif" }} className="w-full sm:w-auto bg-brand-green hover:bg-[#2aad65] text-black font-bold font-bold text-base px-8 py-3.5 rounded transition-colors">
                        {IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_LABEL : "Start free trial"}
                    </Link>
                    <Link href="/how-it-works" style={{ fontFamily: "'Inter', sans-serif" }} className="w-full sm:w-auto border border-white/20 hover:border-white/40 text-white font-bold text-white text-base px-8 py-3.5 rounded transition-colors">
                        {"See how it works"}
                    </Link>
                </div>

                <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-[#7d8590] text-xs mt-6">
                    3-day free trial · All plans included · Cancel anytime
                </p>
            </div>
        </section>
    );
}

// ─── product preview ──────────────────────────────────────────────────────────

function ProductPreview() {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref);

    const metrics: { label: string; value: string; color: string }[] = [
        { label: "ERRORS", value: "24", color: "text-red-400" },
        { label: "WARNINGS", value: "142", color: "text-white" },
        { label: "UPTIME", value: "99.1%", color: "text-white" },
        { label: "INSIGHTS", value: "3", color: "text-white" },
    ];

    const bullets = [
        "Real-time log ingestion at sub-second latency",
        "Automated anomaly detection across services",
        "Root cause analysis with code-level fixes",
    ];

    // 24 hours of errors
    const bars = [
        12, 18, 9, 14, 22, 16, 28, 32, 24, 18, 36, 48,
        42, 30, 55, 68, 52, 38, 26, 44, 60, 34, 20, 14,
    ];

    const leftStyle: React.CSSProperties = {
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
    };
    const rightStyle: React.CSSProperties = {
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
    };

    return (
        <section ref={ref} className="relative bg-black py-32 overflow-hidden">
            {/* Top + bottom fade overlays */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto px-6">
                {/* Left column — copy */}
                <div style={leftStyle}>
                    <h2
                        style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }}
                        className="text-2xl font-bold text-white"
                    >
                        Monitor everything. Fix it instantly.
                    </h2>
                    <p
                        style={{ fontFamily: "'Inter', sans-serif" }}
                        className="text-[#7d8590] text-sm mt-3 leading-relaxed"
                    >
                        Live dashboards stay in sync with every service you run. Spot the spike, drill into the root cause, ship a fix — all without leaving the page.
                    </p>

                    <ul className="mt-8 space-y-3">
                        {bullets.map((b) => (
                            <li
                                key={b}
                                style={{ fontFamily: "'Inter', sans-serif" }}
                                className="flex items-start gap-3 text-sm text-[#e6edf3]"
                            >
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-green shrink-0" />
                                <span style={{ fontFamily: "'Inter', sans-serif" }}>{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right column — browser mock */}
                <div style={rightStyle}>
                    <div className="relative">
                        <div className="bg-[#0D1117] border border-[#21262D] rounded-2xl shadow-2xl overflow-hidden">
                        {/* Browser top bar */}
                        <div className="px-4 py-3 flex items-center gap-2 border-b border-[#21262D]">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                            <span
                                style={{ fontFamily: "'Inter', sans-serif" }}
                                className="ml-4 text-[11px] text-[#7d8590]"
                            >
                                skopos.app/dashboard
                            </span>
                        </div>

                        {/* Metrics row */}
                        <div className="px-6 pt-6 pb-4 grid grid-cols-4 gap-4">
                            {metrics.map((m) => (
                                <div key={m.label}>
                                    <p
                                        style={{ fontFamily: "'Inter', sans-serif" }}
                                        className="text-[9px] uppercase tracking-widest text-[#7d8590] mb-1"
                                    >
                                        {m.label}
                                    </p>
                                    <p
                                        style={{ fontFamily: "'Inter', sans-serif" }}
                                        className={`text-base font-bold tabular-nums ${m.color}`}
                                    >
                                        {m.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Bar chart */}
                        <div className="px-6 pb-6">
                            <p
                                style={{ fontFamily: "'Inter', sans-serif" }}
                                className="text-[10px] uppercase tracking-widest text-[#7d8590] mb-3"
                            >
                                Errors — last 24 hours
                            </p>
                            <div className="flex items-end justify-between gap-1 h-32">
                                {bars.map((h, i) => {
                                    // continuous opacity tied to bar height
                                    const opacity = Math.max(0.25, Math.min(0.95, 0.3 + (h / 100) * 0.9));
                                    return (
                                        <div
                                            key={i}
                                            style={{ height: `${h}%`, opacity }}
                                            className="w-2 rounded-sm bg-gradient-to-t from-[#3fb950]/80 to-[#3fb950]/20"
                                        />
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-[#7d8590] tabular-nums">
                                <span style={{ fontFamily: "'Inter', sans-serif" }}>-24h</span>
                                <span style={{ fontFamily: "'Inter', sans-serif" }}>-12h</span>
                                <span style={{ fontFamily: "'Inter', sans-serif" }}>now</span>
                            </div>
                        </div>
                        </div>
                        {/* Edge fade gradients */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black to-transparent rounded-t-2xl" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black to-transparent rounded-b-2xl" />
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black to-transparent rounded-l-2xl" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black to-transparent rounded-r-2xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── analytics preview ────────────────────────────────────────────────────────

function AnalyticsPreview() {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref);

    const bullets = [
        "7-day error trend with hourly breakdown",
        "Automatic spike detection and alerting",
        "Service-level performance tracking",
    ];

    const logs: { time: string; level: "ERROR" | "WARN" | "INFO" | "DEBUG"; service: string; message: string }[] = [
        { time: "10:42:01", level: "ERROR", service: "payment-svc",  message: "Stripe webhook: signature mismatch on event evt_3Nx" },
        { time: "10:42:02", level: "INFO",  service: "auth-service", message: "Token validated for user_id=8f2a · latency=12ms" },
        { time: "10:42:03", level: "ERROR", service: "payment-svc",  message: "Retry 2/3 failed · ECONNRESET" },
        { time: "10:42:04", level: "WARN",  service: "api-gateway",  message: "Rate limit 92% · threshold=1000req/min" },
        { time: "10:42:05", level: "ERROR", service: "user-service", message: "DB pool exhausted · active=20/20" },
        { time: "10:42:06", level: "INFO",  service: "worker-svc",   message: "Job invoice_gen completed · 847ms" },
        { time: "10:42:07", level: "DEBUG", service: "cache-svc",    message: "Miss on key user:profile:8f2a · TTL expired" },
        { time: "10:42:08", level: "ERROR", service: "user-service", message: "DB pool exhausted · active=20/20" },
    ];

    const levelClass: Record<typeof logs[number]["level"], string> = {
        ERROR: "bg-red-500/10 text-red-400",
        WARN:  "bg-yellow-500/10 text-yellow-400",
        INFO:  "bg-blue-500/10 text-blue-400",
        DEBUG: "bg-gray-500/10 text-gray-400",
    };

    // Mock slides in from the left, copy slides in from the right
    const leftStyle: React.CSSProperties = {
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
    };
    const rightStyle: React.CSSProperties = {
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
    };

    return (
        <section ref={ref} className="relative bg-black py-32 overflow-hidden">
            {/* Top + bottom fade overlays */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto px-6">
                {/* Left column — log stream mock */}
                <div style={leftStyle} className="order-2 lg:order-1">
                    <div className="relative">
                        <div className="bg-[#0D1117] border border-[#21262D] rounded-2xl shadow-2xl overflow-hidden">
                        {/* Browser top bar */}
                        <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-[#21262D]">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                                <span
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                    className="ml-3 text-[10px] text-[#7d8590]"
                                >
                                    skopos.app/logs
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                                <span
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                    className="text-[10px] font-bold text-brand-green uppercase tracking-widest"
                                >
                                    ● live
                                </span>
                            </div>
                        </div>

                        {/* Log rows */}
                        <div className="py-2">
                            {logs.map((log, i) => (
                                <div
                                    key={i}
                                    className="flex items-baseline gap-3 px-4 py-1.5 hover:bg-[#161B22] transition-colors"
                                >
                                    <span className="text-[#7d8590] font-mono text-[11px] shrink-0 tabular-nums">
                                        {log.time}
                                    </span>
                                    <span
                                        className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase w-14 text-center ${levelClass[log.level]}`}
                                    >
                                        {log.level}
                                    </span>
                                    <span className="text-[#3fb950] text-[11px] font-mono shrink-0">
                                        {log.service}
                                    </span>
                                    <span className="text-[#e6edf3] text-[11px] font-mono truncate">
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                        </div>
                        {/* Edge fade gradients */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black to-transparent rounded-t-2xl" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black to-transparent rounded-b-2xl" />
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black to-transparent rounded-l-2xl" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black to-transparent rounded-r-2xl" />
                    </div>
                </div>

                {/* Right column — copy */}
                <div style={rightStyle} className="order-1 lg:order-2">
                    <h2
                        style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }}
                        className="text-2xl font-bold text-white"
                    >
                        Spot patterns before they become incidents.
                    </h2>
                    <p
                        style={{ fontFamily: "'Inter', sans-serif" }}
                        className="text-[#7d8590] text-sm mt-3 leading-relaxed"
                    >
                        Trend lines, peak detection, and per-service breakdowns make recurring problems impossible to miss. Catch the next spike before your users feel it.
                    </p>

                    <ul className="mt-8 space-y-3">
                        {bullets.map((b) => (
                            <li
                                key={b}
                                style={{ fontFamily: "'Inter', sans-serif" }}
                                className="flex items-start gap-3 text-sm text-[#e6edf3]"
                            >
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-green shrink-0" />
                                <span style={{ fontFamily: "'Inter', sans-serif" }}>{b}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}

// ─── stats ────────────────────────────────────────────────────────────────────

function Stats() {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref);

    const items: [string, string][] = [
        ["10x", "Faster incident response"],
        ["< 2s", "Log ingestion latency"],
        ["99.9%", "Uptime SLA"],
        ["14 days", "Free trial, no card"],
    ];

    return (
        <section ref={ref} className="bg-black border-y border-white/10 py-16">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {items.map(([stat, label], i) => (
                    <div key={stat} style={revealStyle(inView, i * 100)}>
                        <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-3xl font-bold text-white font-bold text-brand-green mb-1">{stat}</p>
                        <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-sm text-[#7d8590]">{label}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ─── features ─────────────────────────────────────────────────────────────────

function Features() {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref);

    const features = [
        {
            icon: "LS",
            title: "Live Log Stream",
            description: "Real-time log streaming with sub-second latency. Filter by level, service, or custom fields instantly.",
            href: "/features/live-log-stream",
        },
        {
            icon: "AI",
            title: "Root Cause Analysis",
            description: "Automated AI automatically detects patterns and suggests fixes before your users notice.",
            href: "/features/ai-insights",
        },
        {
            icon: "AL",
            title: "Smart Alerting",
            description: "Get notified via email or Slack when error thresholds are exceeded.",
            href: "/features/alerting",
        },
        {
            icon: "EA",
            title: "Error Analytics",
            description: "24-hour error trend charts with peak detection. Understand your error patterns at a glance.",
            href: "/features/error-analytics",
        },
        {
            icon: "MP",
            title: "Multi-Project",
            description: "Manage multiple services and environments from a single dashboard with isolated API keys.",
            href: "/features/multi-project",
        },
        {
            icon: "SDK",
            title: "Simple SDK",
            description: "Drop-in Python and Node.js SDKs. Start sending logs in under 60 seconds.",
            href: "/features/sdk",
        },
    ];

    return (
        <section id="features" ref={ref} className="bg-black py-24">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }} className="text-xl sm:text-3xl font-bold text-white font-bold text-white mb-4">
                        Everything you need to<br />
                        <span style={{ fontFamily: "'Inter', sans-serif" }} className="text-brand-green">ship with confidence</span>
                    </h2>
                    <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-[#7d8590] max-w-xl mx-auto">
                        Built for developers who care about production reliability.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <Link key={f.title} href={f.href} style={revealStyle(inView, i * 100, "scale")}>
                            <div className="border-l-2 border-brand-green pl-4 py-2 hover:border-brand-green/60 transition-colors cursor-pointer">
                                <h3 style={{ fontFamily: "'Inter', sans-serif" }} className="text-white font-bold text-base mb-1.5">{f.title}</h3>
                                <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-[#7d8590] text-sm leading-relaxed">{f.description}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── pricing ──────────────────────────────────────────────────────────────────


// ─── pricing section ──────────────────────────────────────────────────────────

const PRICING_PLANS = [
    {
        name: "Starter", price: "€0", period: "forever",
        description: "Perfect for side projects and exploration.",
        cta: "Start free", highlight: false, badge: null,
        href: "/login",
        features: [
            { label: "10,000 logs / hour", included: true },
            { label: "1 project", included: true },
            { label: "7-day retention", included: true },
            { label: "5 AI insights / month", included: true },
            { label: "Alert rules", included: false },
            { label: "Community support", included: true },
            { label: "Priority support", included: false },
        ],
    },
    {
        name: "Indie", price: "€22", period: "/ month",
        description: "For solo developers with apps in production.",
        cta: "Try free for 3 days", highlight: false, badge: null,
        href: "https://skopos.lemonsqueezy.com/checkout/buy/33d3db2f-0940-4e7b-b0ef-5c7c7830c71a",
        features: [
            { label: "100,000 logs / hour", included: true },
            { label: "3 projects", included: true },
            { label: "21-day retention", included: true },
            { label: "Unlimited AI insights", included: true },
            { label: "5 alert rules", included: true },
            { label: "Email support", included: true },
            { label: "Priority support", included: false },
        ],
    },
    {
        name: "Pro", price: "€59", period: "/ month",
        description: "For teams who need real observability.",
        cta: "Try free for 3 days", highlight: true, badge: "Most popular",
        href: "https://skopos.lemonsqueezy.com/checkout/buy/d2670f7c-f5e2-409d-9bb9-049b631b5d1d",
        features: [
            { label: "500,000 logs / hour", included: true },
            { label: "10 projects", included: true },
            { label: "60-day retention", included: true },
            { label: "Unlimited AI insights", included: true },
            { label: "20 alert rules", included: true },
            { label: "Priority support", included: true },
            { label: "SLA guarantee", included: false },
        ],
    },
    {
        name: "Business", price: "€169", period: "/ month",
        description: "For companies shipping at scale.",
        cta: "Try free for 3 days", highlight: false, badge: null,
        href: "https://skopos.lemonsqueezy.com/checkout/buy/11c100d9-f1d3-4f02-a17f-e05f33255725",
        features: [
            { label: "5,000,000 logs / hour", included: true },
            { label: "Unlimited projects", included: true },
            { label: "90-day retention", included: true },
            { label: "Unlimited AI insights", included: true },
            { label: "Unlimited alert rules", included: true },
            { label: "Priority support", included: true },
            { label: "SLA guarantee", included: true },
        ],
    },
];

function PricingCheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function PricingXIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 4L10 10M10 4L4 10" stroke="#a0aab4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function PricingSection() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);
    return (
        <section id="pricing" style={{ padding: "80px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
                <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: "30px", color: "#4ade80", fontWeight: 700, marginBottom: "8px" }}>Pricing</h2>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "20px", color: "#ffffff", fontWeight: 600, marginBottom: "12px" }}>Simple, transparent pricing</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "#7d8590" }}>Start free. Scale when you need to. No hidden fees.</p>
            </div>
            <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                {PRICING_PLANS.map((plan, i) => (
                    <div key={plan.name} style={{
                        backgroundColor: plan.highlight ? "#0a0f0a" : "#0a0a0a",
                        border: `1px solid ${plan.highlight ? "#4ade80" : "#1a1a1a"}`,
                        borderRadius: "10px", padding: "28px 24px",
                        display: "flex", flexDirection: "column", gap: "20px",
                        opacity: inView ? 1 : 0,
                        transform: inView ? "translateY(0)" : "translateY(20px)",
                        transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
                        position: "relative",
                    }}>
                        {plan.badge && (
                            <span style={{ fontFamily: "'Inter', sans-serif", position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#4ade80", color: "#000", fontSize: "10px", fontWeight: 700, padding: "3px 12px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                                {plan.badge}
                            </span>
                        )}
                        <div>
                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{plan.name}</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "28px", color: "#e6edf3", fontWeight: 700 }}>{plan.price}</span>
                                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#a0aab4" }}>{plan.period}</span>
                            </div>
                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#a0aab4", lineHeight: 1.6 }}>{plan.description}</p>
                        </div>
                        {IS_PRE_LAUNCH ? (
                          <Link href={PRE_LAUNCH_CTA_HREF} style={{
                            fontFamily: "'Inter', sans-serif", display: "block", textAlign: "center",
                            padding: "10px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 700,
                            textDecoration: "none",
                            backgroundColor: "transparent", color: "#a0aab4", border: "1px solid #1a1a1a",
                          }}>
                            Available at launch
                          </Link>
                        ) : (
                          <Link href={plan.href} style={{
                            fontFamily: "'Inter', sans-serif", display: "block", textAlign: "center",
                            padding: "10px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 700,
                            textDecoration: "none",
                            backgroundColor: plan.highlight ? "#4ade80" : "transparent",
                            color: plan.highlight ? "#000" : "#e6edf3",
                            border: plan.highlight ? "none" : "1px solid #1a1a1a",
                          }}>
                            {plan.cta}
                          </Link>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {plan.features.map(f => (
                                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {f.included ? <PricingCheckIcon /> : <PricingXIcon />}
                                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: f.included ? "#e6edf3" : "#a0aab4" }}>{f.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}


function FAQ() {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref);
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    const items = [
        {
            q: "Is there a free trial?",
            a: "Yes, every plan includes a 3-day free trial with full access to all features. No credit card required. After the trial, you can choose the plan that fits your needs or cancel with no penalties.",
        },
        {
            q: "How is log data ingested?",
            a: "You send logs via our lightweight SDK (Python or Node.js) using a simple HTTP call. Logs are processed in real-time with sub-second latency and immediately available in your dashboard. We support structured JSON logs with custom fields.",
        },
        {
            q: "How long are logs retained?",
            a: "Retention depends on your plan: 7 days on Starter, 21 days on Indie, 60 days on Pro, and 90 days on Business. All logs are stored encrypted.",
        },
        {
            q: "Can I set up custom alerts?",
            a: "Yes. You can create alert rules based on log level (ERROR, WARN, INFO), threshold (e.g. more than 5 errors in 60 seconds), and send notifications via email or Slack webhook.",
        },
        {
            q: "Is my data secure?",
            a: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We never share your data with third parties. Each project has an isolated API key and logs are scoped per user account.",
        },
        {
            q: "Can I use Skopos with multiple services?",
            a: "Yes. The Multi-Project feature lets you create separate projects for each service or environment (production, staging, etc.), each with its own API key and isolated log stream.",
        },
    ];

    return (
        <section ref={ref} className="bg-black py-24 border-t border-white/10">
            <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }} className="text-xl sm:text-3xl font-bold text-white mb-4">
                        FAQ
                    </h2>
                    <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-[#7d8590]">
                        Everything you need to know before getting started.
                    </p>
                </div>

                <div className="space-y-3">
                    {items.map((item, i) => {
                        const isOpen = openIdx === i;
                        return (
                            <div
                                key={item.q}
                                style={revealStyle(inView, i * 80)}
                                className="bg-brand-surface border border-brand-border rounded-lg overflow-hidden"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenIdx(isOpen ? null : i)}
                                    aria-expanded={isOpen}
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left hover:bg-brand-muted/10 transition-colors"
                                >
                                    <span style={{ fontFamily: "'Inter', sans-serif" }} className="text-sm text-white font-bold">
                                        {item.q}
                                    </span>
                                    <span
                                        style={{ fontFamily: "'Inter', sans-serif" }}
                                        className={`text-brand-green text-lg shrink-0 transition-transform ${isOpen ? "rotate-45" : ""}`}
                                    >
                                        +
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="px-5 pb-4 -mt-1">
                                        <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-sm text-[#7d8590] leading-relaxed">
                                            {item.a}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── cta ──────────────────────────────────────────────────────────────────────

function CTA() {
    const ref = useRef<HTMLElement>(null);
    const inView = useInView(ref);

    return (
        <section ref={ref} className="bg-black py-24 border-t border-white/10">
            <div className="max-w-3xl mx-auto px-6 text-center" style={revealStyle(inView, 0)}>
                <h2 style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em" }} className="text-xl sm:text-3xl font-bold text-white font-bold text-white mb-4">
                    Start monitoring in<br />
                    <span style={{ fontFamily: "'Inter', sans-serif" }} className="text-brand-green">60 seconds</span>
                </h2>
                <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-[#7d8590] mb-8">
                    Drop in our SDK and get full visibility into your production logs today.
                </p>
                <Link href={IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_HREF : "/login"} style={{ fontFamily: "'Inter', sans-serif" }} className="inline-block bg-brand-green hover:bg-[#2aad65] text-black font-bold font-bold text-base px-8 py-3.5 rounded transition-colors">
                    {IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_LABEL : "Start free trial — no card required"}
                </Link>
                <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-[#7d8590] text-xs mt-4">3-day free trial · Cancel anytime</p>
            </div>
        </section>
    );
}

function Footer() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div>
            <p className="text-white font-bold text-sm mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>{"Product"}</p>
            <ul className="space-y-3">
              {[["Log monitoring", "#features"], ["Smart insights", "#features"], ["Pricing", "/pricing"]].map(([l, h]) => (
                <li key={l}><a href={h} className="text-[#7d8590] hover:text-white text-sm transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>{l}</a></li>
              ))}
            </ul>
          </div>
          {!IS_PRE_LAUNCH && (
            <div>
              <p className="text-white font-bold text-sm mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>{"Account"}</p>
              <ul className="space-y-3">
                {[["Sign in", "/login"], ["Start free trial", "/login"], ["Dashboard", "/"]].map(([l, h]) => (
                  <li key={l}><a href={h} className="text-[#7d8590] hover:text-white text-sm transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>{l}</a></li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="text-white font-bold text-sm mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>{"Developers"}</p>
            <ul className="space-y-3">
              {[["GitHub", "https://github.com/matti07986/skopos-saas"]].map(([l, h]) => (
                <li key={l}><a href={h} target="_blank" className="text-[#7d8590] hover:text-white text-sm transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-bold text-sm mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>{"Legal"}</p>
            <ul className="space-y-3">
              {[["Privacy Policy", "/legal/privacy"], ["Terms of Service", "/legal/terms"], ["Cookie Policy", "/legal/cookies"], ["DPA", "/legal/dpa"]].map(([l, h]) => (
                <li key={l}><a href={h} className="text-[#7d8590] hover:text-white text-sm transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>{l}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-brand-green font-bold text-xl" style={{ fontFamily: "'Inter', sans-serif" }}>skopos</span>
          <p className="text-[#7d8590] text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>© 2026 Skopos. {"All rights reserved."}</p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
    const pricingRef = useRef<HTMLDivElement>(null);
    const pricingInView = useInView(pricingRef);

    return (
        <div className="bg-black min-h-screen">
            <Navbar />
            <Hero />
            <ProductPreview />
            <Stats />
            <Features />
            <PricingSection />
            <FAQ />
            <AnalyticsPreview />
            <CTA />
            <Footer />
        </div>
    );
}
