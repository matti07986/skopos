"use client";

import { IS_PRE_LAUNCH, PRE_LAUNCH_CTA_HREF, PRE_LAUNCH_CTA_LABEL } from "@/lib/preLaunch";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const INTER = { fontFamily: "'Inter', sans-serif" } as const;

function useInView<T extends HTMLElement>(): [React.MutableRefObject<T | null>, boolean] {
    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        if (!ref.current) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setInView(true); obs.disconnect(); }
        }, { threshold: 0.2, rootMargin: "0px 0px -80px 0px" });
        obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return [ref, inView];
}

function revealLeft(inView: boolean, delay = 0): React.CSSProperties {
    return {
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-40px)",
        transition: `opacity 0.8s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 0.8s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
    };
}

function revealRight(inView: boolean, delay = 0): React.CSSProperties {
    return {
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(40px)",
        transition: `opacity 0.8s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 0.8s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
    };
}

function reveal(inView: boolean, delay = 0): React.CSSProperties {
    return {
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.7s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform 0.7s cubic-bezier(.2,.7,.2,1) ${delay}ms`,
    };
}

function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "purple" | "blue" }) {
    const colors = {
        green: { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.3)", text: "#4ade80" },
        purple: { bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.3)", text: "#a855f7" },
        blue: { bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.3)", text: "#3b82f6" },
    }[tone];
    return (
        <span style={{ ...INTER, display: "inline-block", padding: "4px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 600, backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, letterSpacing: "0.3px" }}>
            {children}
        </span>
    );
}

function FeatureSection({ index, badge, title, description, bullets, useCase, children, reverse = false }: {
    index: string; badge: React.ReactNode; title: string; description: string;
    bullets: string[]; useCase: { tag: string; text: string };
    children: React.ReactNode; reverse?: boolean;
}) {
    const [ref, inView] = useInView<HTMLElement>();
    const textReveal = reverse ? revealRight : revealLeft;
    const visualReveal = reverse ? revealLeft : revealRight;
    return (
        <section ref={ref as React.RefObject<HTMLElement>} style={{ padding: "80px 24px", borderTop: "1px solid #111" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "40px", alignItems: "center" }}>
                <div style={{ order: reverse ? 2 : 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", ...textReveal(inView, 0) }}>
                        <span style={{ ...INTER, color: "#4ade80", fontSize: "11px", fontWeight: 600, letterSpacing: "1.5px" }}>{index}</span>
                        {badge}
                    </div>
                    <h2 style={{ ...INTER, color: "#fff", fontSize: "24px", fontWeight: 700, lineHeight: 1.25, margin: "0 0 14px", letterSpacing: "-0.02em", ...textReveal(inView, 100) }}>{title}</h2>
                    <p style={{ ...INTER, color: "#a0aab4", fontSize: "13px", lineHeight: 1.7, margin: "0 0 20px", ...textReveal(inView, 200) }}>{description}</p>

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px" }}>
                        {bullets.map((b, i) => (
                            <li key={i} style={{ ...INTER, color: "#c9d1d9", fontSize: "12px", lineHeight: 1.7, padding: "4px 0", display: "flex", gap: "10px", ...textReveal(inView, 300 + i * 80) }}>
                                <span style={{ color: "#4ade80", flexShrink: 0 }}>→</span>
                                <span>{b}</span>
                            </li>
                        ))}
                    </ul>

                    <div style={{ backgroundColor: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.15)", borderLeft: "2px solid #4ade80", borderRadius: "4px", padding: "10px 14px", ...textReveal(inView, 700) }}>
                        <div style={{ ...INTER, color: "#4ade80", fontSize: "9px", fontWeight: 700, letterSpacing: "1.2px", marginBottom: "4px" }}>{useCase.tag}</div>
                        <p style={{ ...INTER, color: "#c9d1d9", fontSize: "11.5px", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>{useCase.text}</p>
                    </div>
                </div>
                <div style={{ order: reverse ? 1 : 2, ...visualReveal(inView, 200) }}>
                    {children}
                </div>
            </div>
        </section>
    );
}

const LOG_POOL = [
    { level: "INFO", msg: "POST /api/checkout 200 in 142ms", color: "#4ade80" },
    { level: "WARN", msg: "Slow query detected on orders table: 1.2s", color: "#facc15" },
    { level: "ERROR", msg: "PaymentGatewayTimeout at line 42", color: "#f87171" },
    { level: "INFO", msg: "Retry succeeded in 89ms", color: "#4ade80" },
    { level: "INFO", msg: "User 8821 authenticated via Google OAuth", color: "#4ade80" },
    { level: "DEBUG", msg: "Cache hit ratio: 94.2% (last 5m)", color: "#a855f7" },
    { level: "INFO", msg: "GET /api/users/profile 200 in 38ms", color: "#4ade80" },
    { level: "INFO", msg: "Background job queue processed: 24 items", color: "#4ade80" },
    { level: "WARN", msg: "Rate limit approaching: 87% on api/v1", color: "#facc15" },
    { level: "INFO", msg: "Webhook delivered to stripe.com in 215ms", color: "#4ade80" },
    { level: "DEBUG", msg: "Connection pool: 12/50 active", color: "#a855f7" },
    { level: "INFO", msg: "Session refreshed for 234 users", color: "#4ade80" },
    { level: "ERROR", msg: "DB connection refused, retrying...", color: "#f87171" },
    { level: "INFO", msg: "POST /api/orders 201 in 89ms", color: "#4ade80" },
    { level: "INFO", msg: "Email sent to noreply queue · batch #1822", color: "#4ade80" },
];

function formatTime(d: Date) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function LogStreamVisual() {
    const [rows, setRows] = useState(() =>
        Array.from({ length: 10 }).map((_, i) => {
            const pick = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
            const d = new Date(Date.now() - (10 - i) * 800);
            return { ...pick, time: formatTime(d), id: `init-${i}` };
        })
    );

    useEffect(() => {
        const t = setInterval(() => {
            setRows((prev) => {
                const pick = LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)];
                const next = { ...pick, time: formatTime(new Date()), id: `${Date.now()}-${Math.random()}` };
                return [next, ...prev.slice(0, 9)];
            });
        }, 1200);
        return () => clearInterval(t);
    }, []);

    return (
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "20px", fontFamily: "'SF Mono', monospace", fontSize: "10.5px", lineHeight: 1.9, minHeight: "320px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #1e1e1e", ...INTER, fontSize: "10px", color: "#7d8590" }}>
                <span>checkout-api · production</span>
                <span style={{ color: "#4ade80", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#4ade80", display: "inline-block", animation: "pulse 1.5s infinite" }} />
                    Live · 1,247/min
                </span>
            </div>
            <div style={{ overflow: "hidden" }}>
                {rows.map((r, i) => (
                    <div key={r.id} style={{ display: "flex", gap: "12px", opacity: i < 3 ? 1 : Math.max(0.25, 1 - i * 0.1), animation: i === 0 ? "slideIn 0.5s ease-out" : "none" }}>
                        <span style={{ color: "#555" }}>{r.time}</span>
                        <span style={{ color: r.color, fontWeight: 700, minWidth: "44px" }}>{r.level}</span>
                        <span style={{ color: "#c9d1d9" }}>{r.msg}</span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
                @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
            `}</style>
        </div>
    );
}

function AIVisual() {
    return (
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1e1e", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
                <span style={{ ...INTER, color: "#a0aab4", fontSize: "10px", fontWeight: 600, letterSpacing: "1px" }}>NOVA AI · powered by Claude</span>
            </div>
            <div style={{ padding: "20px" }}>
                <div style={{ marginBottom: "14px", padding: "10px 14px", backgroundColor: "#000", border: "1px solid #1e1e1e", borderRadius: "8px" }}>
                    <span style={{ ...INTER, color: "#7d8590", fontSize: "10px", fontWeight: 600 }}>YOU</span>
                    <p style={{ ...INTER, color: "#e6edf3", fontSize: "12px", margin: "4px 0 0" }}>Why is checkout failing at 3am?</p>
                </div>
                <p style={{ ...INTER, color: "#e6edf3", fontSize: "12px", lineHeight: 1.7, margin: 0 }}>
                    Checkout failures spiked <strong style={{ color: "#f87171" }}>+340%</strong> at 03:14. Root cause: <code style={{ color: "#facc15", fontFamily: "'SF Mono', monospace", fontSize: "11px" }}>PaymentGateway</code> retry policy hitting a 5s timeout while your handler waits 3s.
                </p>
                <p style={{ ...INTER, color: "#7d8590", fontSize: "11px", margin: "10px 0 0", fontStyle: "italic" }}>
                    Fix: align timeouts in <code style={{ color: "#a0aab4", fontFamily: "'SF Mono', monospace" }}>config/payments.ts:18</code>
                </p>
            </div>
        </div>
    );
}

function ChartsVisual() {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", ...INTER }}>
                    <span style={{ color: "#a0aab4", fontSize: "10px", fontWeight: 600 }}>ERROR RATE</span>
                    <span style={{ color: "#f87171", fontSize: "10px", fontWeight: 700 }}>+12% vs last week</span>
                </div>
                <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
                    <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" stopOpacity="0.4" /><stop offset="100%" stopColor="#f87171" stopOpacity="0" /></linearGradient></defs>
                    <path d="M0,45 L40,40 L80,42 L120,35 L160,38 L200,20 L240,25 L280,15 L320,22 L360,10 L400,18 L400,60 L0,60 Z" fill="url(#g1)" />
                    <path d="M0,45 L40,40 L80,42 L120,35 L160,38 L200,20 L240,25 L280,15 L320,22 L360,10 L400,18" stroke="#f87171" strokeWidth="1.5" fill="none" />
                </svg>
            </div>
            <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", ...INTER }}>
                    <span style={{ color: "#a0aab4", fontSize: "10px", fontWeight: 600 }}>LATENCY (p95)</span>
                    <span style={{ color: "#4ade80", fontSize: "10px", fontWeight: 700 }}>142ms · healthy</span>
                </div>
                <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
                    <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" /><stop offset="100%" stopColor="#4ade80" stopOpacity="0" /></linearGradient></defs>
                    <path d="M0,40 L40,42 L80,38 L120,35 L160,40 L200,30 L240,32 L280,28 L320,30 L360,25 L400,28 L400,60 L0,60 Z" fill="url(#g2)" />
                    <path d="M0,40 L40,42 L80,38 L120,35 L160,40 L200,30 L240,32 L280,28 L320,30 L360,25 L400,28" stroke="#4ade80" strokeWidth="1.5" fill="none" />
                </svg>
            </div>
            <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "10px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", ...INTER }}>
                    <span style={{ color: "#a0aab4", fontSize: "10px", fontWeight: 600 }}>THROUGHPUT</span>
                    <span style={{ color: "#a855f7", fontSize: "10px", fontWeight: 700 }}>8.2k req/min</span>
                </div>
                <svg width="100%" height="60" viewBox="0 0 400 60" preserveAspectRatio="none">
                    <defs><linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" /><stop offset="100%" stopColor="#a855f7" stopOpacity="0" /></linearGradient></defs>
                    <path d="M0,35 L40,30 L80,35 L120,25 L160,30 L200,18 L240,22 L280,15 L320,20 L360,12 L400,18 L400,60 L0,60 Z" fill="url(#g3)" />
                    <path d="M0,35 L40,30 L80,35 L120,25 L160,30 L200,18 L240,22 L280,15 L320,20 L360,12 L400,18" stroke="#a855f7" strokeWidth="1.5" fill="none" />
                </svg>
            </div>
        </div>
    );
}

function AlertVisual() {
    return (
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "20px" }}>
            <div style={{ marginBottom: "14px", padding: "14px", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "8px", backgroundColor: "rgba(248,113,113,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ ...INTER, color: "#f87171", fontSize: "11px", fontWeight: 700 }}>⚠ High error rate</div>
                    <span style={{ ...INTER, color: "#f87171", fontSize: "9px", fontWeight: 700, letterSpacing: "1px" }}>FIRING · 2m ago</span>
                </div>
                <div style={{ ...INTER, color: "#a0aab4", fontSize: "10.5px", lineHeight: 1.6 }}>
                    <code style={{ color: "#facc15" }}>checkout-api</code> · 5xx rate &gt; 5% (currently <strong style={{ color: "#f87171" }}>8.2%</strong>) over the last 5 minutes
                </div>
            </div>
            <div style={{ marginBottom: "14px", padding: "14px", border: "1px solid rgba(250,204,21,0.3)", borderRadius: "8px", backgroundColor: "rgba(250,204,21,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ ...INTER, color: "#facc15", fontSize: "11px", fontWeight: 700 }}>◐ Slow queries</div>
                    <span style={{ ...INTER, color: "#facc15", fontSize: "9px", fontWeight: 700, letterSpacing: "1px" }}>WARNING</span>
                </div>
                <div style={{ ...INTER, color: "#a0aab4", fontSize: "10.5px", lineHeight: 1.6 }}>
                    Database p95 latency above 800ms
                </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "12px", borderTop: "1px solid #1e1e1e" }}>
                {["Slack #incidents", "team@company.com", "PagerDuty", "Webhook"].map((c) => (
                    <span key={c} style={{ ...INTER, color: "#7d8590", fontSize: "10px", padding: "4px 10px", backgroundColor: "#000", border: "1px solid #1e1e1e", borderRadius: "999px" }}>→ {c}</span>
                ))}
            </div>
        </div>
    );
}

function StatusVisual() {
    const services = [
        { name: "API", status: "Operational", color: "#4ade80", uptime: "99.98%" },
        { name: "Dashboard", status: "Operational", color: "#4ade80", uptime: "99.99%" },
        { name: "Webhooks", status: "Degraded", color: "#facc15", uptime: "98.42%" },
        { name: "CDN", status: "Operational", color: "#4ade80", uptime: "100.00%" },
        { name: "Database", status: "Operational", color: "#4ade80", uptime: "99.97%" },
    ];
    return (
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid #1e1e1e" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
                <span style={{ ...INTER, color: "#e6edf3", fontSize: "13px", fontWeight: 600 }}>All systems mostly operational</span>
            </div>
            {services.map((s) => (
                <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: "1px solid #1e1e1e" }}>
                    <span style={{ ...INTER, color: "#c9d1d9", fontSize: "11.5px" }}>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ ...INTER, color: "#555", fontSize: "10px", fontFamily: "'SF Mono', monospace" }}>{s.uptime}</span>
                        <span style={{ ...INTER, color: s.color, fontSize: "10.5px", fontWeight: 600 }}>{s.status}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

function TeamVisual() {
    const members = [
        { name: "Alice M.", role: "Owner", initial: "A", color: "#4ade80" },
        { name: "Bob R.", role: "Admin · DevOps", initial: "B", color: "#a855f7" },
        { name: "Carla S.", role: "Developer · Backend", initial: "C", color: "#3b82f6" },
        { name: "Dan K.", role: "Viewer · Support", initial: "D", color: "#facc15" },
    ];
    return (
        <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #1e1e1e" }}>
                <span style={{ ...INTER, color: "#a0aab4", fontSize: "10px", fontWeight: 600, letterSpacing: "1px" }}>WORKSPACE · 4 members</span>
                <span style={{ ...INTER, color: "#4ade80", fontSize: "10px", fontWeight: 600 }}>SSO active</span>
            </div>
            {members.map((m) => (
                <div key={m.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderTop: "1px solid #1e1e1e" }}>
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: m.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: "11px", ...INTER }}>{m.initial}</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ ...INTER, color: "#e6edf3", fontSize: "12px", fontWeight: 600 }}>{m.name}</div>
                        <div style={{ ...INTER, color: "#7d8590", fontSize: "10.5px" }}>{m.role}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function HeroAnimatedTitle() {
    const [ref, inView] = useInView<HTMLDivElement>();
    return (
        <div ref={ref as React.RefObject<HTMLDivElement>}>
            <h1 style={{ ...INTER, color: "#fff", fontSize: "36px", fontWeight: 700, lineHeight: 1.2, margin: "0 0 20px", letterSpacing: "-0.02em", ...reveal(inView, 100) }}>
                Watch your apps<br />
                <span style={{ color: "#4ade80" }}>think out loud.</span>
            </h1>
            <p style={{ ...INTER, color: "#a0aab4", fontSize: "14px", lineHeight: 1.7, margin: "0 auto", maxWidth: "620px", ...reveal(inView, 200) }}>
                Skopos turns raw logs into clarity. Real-time visibility, AI that explains in plain English, alerts that fire only when it matters. Built for teams who can't afford to be in the dark.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginTop: "36px", flexWrap: "wrap", ...reveal(inView, 300) }}>
                {[
                    { n: "<200ms", l: "Query latency on millions of logs" },
                    { n: "99.9%", l: "Uptime SLA on Business" },
                    { n: "7 days", l: "Free trial · no card needed" },
                ].map((s) => (
                    <div key={s.n} style={{ textAlign: "center" }}>
                        <div style={{ ...INTER, color: "#4ade80", fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>{s.n}</div>
                        <div style={{ ...INTER, color: "#7d8590", fontSize: "11px", maxWidth: "160px" }}>{s.l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

type FeatureDetail = {
    t: string; d: string; longDesc: string; plans: string; bullets: string[];
};

const HOOD_FEATURES: FeatureDetail[] = [
    {
        t: "REST API",
        d: "Full programmatic access",
        longDesc: "Build your own integrations, dashboards, and automations on top of Skopos. Every action in the UI is also available via API — query logs, manage projects, configure alerts.",
        plans: "Available on all plans · Rate limits scale with tier",
        bullets: [
            "RESTful endpoints with OpenAPI spec",
            "Per-key rate limiting and scoped permissions",
            "Official SDKs for Python and Node.js",
            "Webhook-ready event system",
        ],
    },
    {
        t: "Custom retention",
        d: "Hold logs longer when needed",
        longDesc: "Default retention covers most needs, but some logs you'll want to keep longer — for audits, compliance, or long-term trend analysis. Configure per-project retention windows.",
        plans: "21 days on Indie · 60 on Pro · 90 on Business · Custom on Enterprise",
        bullets: [
            "Per-project retention policies",
            "Hot vs cold storage tiering",
            "Automatic archival to S3 (Business)",
            "GDPR-compliant deletion workflows",
        ],
    },
    {
        t: "Webhooks",
        d: "Push events to your stack",
        longDesc: "Trigger workflows in other tools when something happens in Skopos. Error spikes, alert state changes — pipe them anywhere with a few lines of config.",
        plans: "Available from Indie",
        bullets: [
            "Configurable per event type",
            "Retries with exponential backoff",
            "HMAC signature verification",
            "Delivery logs for debugging",
        ],
    },
    {
        t: "99.9% SLA",
        d: "Uptime guarantee on Business",
        longDesc: "When you depend on us, we depend on ourselves. Business plans come with a contractual 99.9% uptime SLA, service credits for downtime, and a status page you can audit.",
        plans: "Business only",
        bullets: [
            "Contractual 99.9% monthly uptime",
            "Service credits for breaches",
            "Public real-time status page",
            "Multi-region failover architecture",
        ],
    },
    {
        t: "Priority support",
        d: "Human, fast, technical",
        longDesc: "Real engineers answer support tickets, not bots routing to FAQ articles. Average response time under 2 hours during business hours on Pro, under 1 hour on Business.",
        plans: "Email on Indie · Priority on Pro · Dedicated on Business",
        bullets: [
            "Engineers, not first-level scripts",
            "<2h response on Pro, <1h on Business",
            "Shared Slack channel for Business",
            "Onboarding session included on Business",
        ],
    },
    {
        t: "GitHub SSO",
        d: "Sign in with your dev identity · Coming soon",
        longDesc: "Skip password management. Sign in with GitHub or Google. Currently in development — for now, sign up with email and OTP verification.",
        plans: "Coming soon",
        bullets: [
            "GitHub OAuth integration",
            "Google Workspace SSO",
            "Domain auto-join for teams",
            "SAML 2.0 on Business (on request)",
        ],
    },
    {
        t: "Audit logs",
        d: "SOC2-friendly trail",
        longDesc: "Every action in your workspace is recorded: who did what, when, and from where. Filter by action type or time range in your Settings.",
        plans: "Available on all plans · 30 days on Pro · 1 year on Business",
        bullets: [
            "Per-user, per-action tracking",
            "IP address and user agent logging",
            "Export to CSV or via API",
            "SOC2 Type II ready",
        ],
    },
    {
        t: "Data export",
        d: "Your data is yours. Always.",
        longDesc: "No lock-in. Your logs and data are always yours. Export functionality is coming soon — in the meantime, data is accessible via API.",
        plans: "Coming soon · Available on all plans",
        bullets: [
            "Bulk export to JSON, CSV, NDJSON",
            "Streaming export via API",
            "30-day grace period after cancellation",
            "No vendor lock-in commitment",
        ],
    },
    {
        t: "PII redaction",
        d: "Auto-mask sensitive fields · Coming soon",
        longDesc: "Emails, credit cards, API keys — automatically detected and masked in logs before they're stored. This feature is currently in development.",
        plans: "Coming soon · Pro & Business",
        bullets: [
            "Auto-detect common PII patterns",
            "Custom regex rules per project",
            "GDPR & HIPAA-aligned defaults",
            "Reversible masking for authorized users",
        ],
    },
];

function FeatureDrawer({ feature, onClose }: { feature: FeatureDetail | null; onClose: () => void }) {
    const isOpen = feature !== null;
    useEffect(() => {
        if (isOpen) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);
    return (
        <>
            <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: "opacity 0.3s ease", zIndex: 50, backdropFilter: "blur(2px)" }} />
            <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: "440px", backgroundColor: "#0a0a0a", borderLeft: "1px solid #1e1e1e", transform: isOpen ? "translateX(0)" : "translateX(100%)", transition: "transform 0.4s cubic-bezier(.2,.7,.2,1)", zIndex: 51, overflowY: "auto", padding: "32px 28px" }}>
                <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#7d8590", fontSize: "20px", cursor: "pointer", padding: "4px 8px", lineHeight: 1 }}>×</button>
                {feature && (
                    <>
                        <h3 style={{ ...INTER, color: "#fff", fontSize: "22px", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{feature.t}</h3>
                        <p style={{ ...INTER, color: "#4ade80", fontSize: "11px", fontWeight: 600, margin: "0 0 24px", letterSpacing: "0.5px" }}>{feature.plans}</p>
                        <p style={{ ...INTER, color: "#c9d1d9", fontSize: "13px", lineHeight: 1.7, margin: "0 0 24px" }}>{feature.longDesc}</p>
                        <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "20px" }}>
                            <p style={{ ...INTER, color: "#7d8590", fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", margin: "0 0 12px" }}>WHAT'S INCLUDED</p>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {feature.bullets.map((b, i) => (
                                    <li key={i} style={{ ...INTER, color: "#c9d1d9", fontSize: "12.5px", lineHeight: 1.7, padding: "6px 0", display: "flex", gap: "10px" }}>
                                        <span style={{ color: "#4ade80", flexShrink: 0 }}>→</span>
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

function UnderTheHood() {
    const [ref, inView] = useInView<HTMLElement>();
    const [active, setActive] = useState<FeatureDetail | null>(null);
    return (
        <section ref={ref as React.RefObject<HTMLElement>} style={{ padding: "80px 24px", borderTop: "1px solid #111", textAlign: "center" }}>
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                <h2 style={{ ...INTER, color: "#fff", fontSize: "28px", fontWeight: 700, lineHeight: 1.2, margin: "0 0 12px", letterSpacing: "-0.02em", ...reveal(inView, 0) }}>Under the hood</h2>
                <p style={{ ...INTER, color: "#a0aab4", fontSize: "13px", margin: "0 0 36px", ...reveal(inView, 100) }}>The fundamentals you'd expect from a serious tool — and a few you might not. <span style={{ color: "#4ade80" }}>Click any card to learn more.</span></p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "12px", marginBottom: "32px" }}>
                    {HOOD_FEATURES.map((f, i) => (
                        <button
                            key={f.t}
                            onClick={() => setActive(f)}
                            style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "8px", padding: "16px", textAlign: "left", cursor: "pointer", transition: "border-color 0.2s, transform 0.2s", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", ...reveal(inView, 200 + i * 60) }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(74,222,128,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ ...INTER, color: "#e6edf3", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>{f.t}</div>
                                <div style={{ ...INTER, color: "#7d8590", fontSize: "11px" }}>{f.d}</div>
                            </div>
                            <span style={{ ...INTER, color: "#4ade80", fontSize: "14px", flexShrink: 0, marginTop: "-2px" }}>→</span>
                        </button>
                    ))}
                </div>
                <p style={{ ...INTER, color: "#7d8590", fontSize: "13px", fontStyle: "italic", margin: 0, ...reveal(inView, 800) }}>
                    Some things you'll only discover when you start using it.
                </p>
            </div>
            <FeatureDrawer feature={active} onClose={() => setActive(null)} />
        </section>
    );
}

export default function HowItWorksPage() {
    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#000", ...INTER }}>
            <nav style={{ position: "sticky", top: 0, zIndex: 10, borderBottom: "1px solid #111", backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", padding: "16px 0" }}>
                <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Link href="/" className="text-[#7d8590] hover:text-[#e6edf3] transition-colors" style={{ textDecoration: "none", fontSize: "13px", fontWeight: 600, ...INTER }}>← Skopos</Link>
                    <Link href={IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_HREF : "/login"} style={{ backgroundColor: "#4ade80", color: "#000", padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>{IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_LABEL : "Try free for 7 days"}</Link>
                </div>
            </nav>

            <section style={{ position: "relative", padding: "80px 16px 60px", textAlign: "center", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "500px", height: "500px", backgroundColor: "rgba(74,222,128,0.08)", borderRadius: "50%", filter: "blur(120px)", zIndex: 0 }} />
                <div style={{ position: "relative", zIndex: 1, maxWidth: "780px", margin: "0 auto" }}>
                    <HeroAnimatedTitle />
                </div>
            </section>

            <FeatureSection
                index="01"
                badge={<Badge tone="green">Included in all plans</Badge>}
                title="Real-time logs that actually breathe"
                description="Logs stream in milliseconds, color-coded by severity, indexed instantly. No more grep-ing through gigabytes of files at 3am. Search across millions of entries with full-text queries, regex, or structured filters."
                bullets={[
                    "Sub-second search across 10M+ log entries",
                    "Color-coded levels: INFO, WARN, ERROR, DEBUG",
                    "Filter by service, environment, user, or any custom tag",
                    "Live tail mode with auto-scroll and pause-on-hover",
                    "Drop-in SDKs for Node.js, Python, Go, Ruby, PHP",
                ]}
                useCase={{ tag: "USE CASE", text: "A production deploy goes sideways. Open Skopos, filter by service:checkout-api level:ERROR, see exactly which 47 users got 500s in the last 3 minutes." }}
            >
                <LogStreamVisual />
            </FeatureSection>

            <FeatureSection
                index="02"
                badge={<Badge tone="purple">From Indie · Full power on Pro</Badge>}
                title="AI that understands your stack"
                description="Stop pattern-matching logs by hand. Ask Skopos what's wrong, like you'd ask a senior engineer. It reads context, correlates events, and points you to the root cause — with the file and line number when it can."
                bullets={[
                    'Natural language queries: "what broke checkout last night?"',
                    "Automatic anomaly detection on error spikes and latency drift",
                    "Daily insight summaries delivered to Slack or email",
                    "Powered by Claude — context-aware, not just keyword search",
                    "Confidence scores so you know when to dig deeper",
                ]}
                useCase={{ tag: "USE CASE", text: "Friday 6pm. AI flags an unusual error pattern in the payment service before your monitoring threshold even triggers. You catch it before customers complain." }}
                reverse
            >
                <AIVisual />
            </FeatureSection>

            <FeatureSection
                index="03"
                badge={<Badge tone="green">From Indie · Long retention on Pro & Business</Badge>}
                title="Charts that tell a story"
                description="Error rates, latency percentiles, throughput, uptime — visualized so you spot trends at a glance. Compare today to last week. Zoom into a 2am spike. Annotate deploys directly on the timeline."
                bullets={[
                    "Per-service breakdown with one-click drill-down",
                    "p50, p95, p99 latency tracking out of the box",
                    "Custom dashboards with drag-and-drop widgets",
                    "Deploy markers synced from GitHub or your CI",
                    "21-day retention on Indie · 60 on Pro · 90 on Business",
                ]}
                useCase={{ tag: "USE CASE", text: "Engineering review on Monday morning. Pull up last week's dashboards, show the team the latency improvement after the caching refactor — with hard numbers, not vibes." }}
            >
                <ChartsVisual />
            </FeatureSection>

            <FeatureSection
                index="04"
                badge={<Badge tone="purple">From Indie · Unlimited rules on Business</Badge>}
                title="Alerts that don't cry wolf"
                description="Smart thresholds, smart routing, smart deduplication. Get notified on Slack, email, PagerDuty, or any webhook — only when something actually needs your attention. Quiet hours and escalation policies included."
                bullets={[
                    "Trigger on error rate, latency, throughput, or custom metrics",
                    "Multi-channel delivery: Slack, email, webhook, PagerDuty",
                    "Auto-grouping prevents alert storms from a single incident",
                    "Escalation chains: notify primary → secondary → on-call",
                    "5 rules on Indie · 20 on Pro · unlimited on Business",
                ]}
                useCase={{ tag: "USE CASE", text: "Sunday morning, you're at brunch. An alert fires only when error rate stays above 5% for 5 minutes — not a one-off spike. The first person on-call gets paged. Your phone stays in your pocket." }}
                reverse
            >
                <AlertVisual />
            </FeatureSection>

            <FeatureSection
                index="05"
                badge={<Badge tone="purple">From Pro · Custom domain on Business</Badge>}
                title="Status pages that build trust"
                description="A public status page tells customers you take reliability seriously. Auto-updates from your uptime monitors — no manual reporting, no copy-paste incident notes. Embed it on your site or host it on your own domain."
                bullets={[
                    "Auto-sync from your uptime monitors and alert events",
                    "Per-service status: API, dashboard, integrations, CDN",
                    "Historical uptime % over 30, 60, 90 days",
                    "Incident timeline with public updates from your team",
                    "Custom subdomain (Pro) or your own domain (Business)",
                ]}
                useCase={{ tag: "USE CASE", text: "Your enterprise prospect asks about reliability during a sales call. You send them status.yourcompany.com. They see 99.98% uptime over the last quarter. Deal closed." }}
            >
                <StatusVisual />
            </FeatureSection>

            <FeatureSection
                index="06"
                badge={<Badge tone="blue">Business only</Badge>}
                title="Your whole team, one workspace"
                description="Scale from a solo founder to a 50-person engineering org without changing tools. Role-based access, SSO with Google and GitHub, audit logs for SOC2 compliance. The infrastructure you need before you need it."
                bullets={[
                    "Owner, Admin, Developer, Viewer — four roles, fine-grained",
                    "SSO with Google Workspace and GitHub (SAML on request)",
                    "Audit logs of every action: who, what, when",
                    "Per-project access control for client agencies",
                    "Domain capture: anyone with your email domain joins automatically",
                ]}
                useCase={{ tag: "USE CASE", text: "You hire your fifth engineer. They sign in with Google SSO, get auto-assigned to the right projects, and are looking at production logs in under 30 seconds. No IT ticket required." }}
                reverse
            >
                <TeamVisual />
            </FeatureSection>

            <UnderTheHood />

            <footer style={{ borderTop: "1px solid #111", padding: "32px 24px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "12px", flexWrap: "wrap" }}>
                    {[["Privacy", "/legal/privacy"], ["Terms", "/legal/terms"], ["Cookies", "/legal/cookies"], ["DPA", "/legal/dpa"]].map(([label, href]) => (
                        <Link key={label} href={href} className="text-[#555] hover:text-[#a0aab4] transition-colors" style={{ ...INTER, fontSize: "11px", textDecoration: "none" }}>{label}</Link>
                    ))}
                </div>
                <p style={{ ...INTER, color: "#444", fontSize: "11px", margin: 0 }}>
                    © {new Date().getFullYear()} Skopos · See what&apos;s breaking. Fix it fast.
                </p>
            </footer>


        </div>
    );
}
