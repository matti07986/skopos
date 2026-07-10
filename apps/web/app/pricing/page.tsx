"use client";

import { IS_PRE_LAUNCH, PRE_LAUNCH_CTA_HREF, PRE_LAUNCH_CTA_LABEL } from "@/lib/preLaunch";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";

const inter = { fontFamily: "'Inter', sans-serif" };

function useInView(ref: React.RefObject<Element | null>): boolean {
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => setInView(entry.isIntersecting),
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);
    return inView;
}

const plans = [
    {
        name: "Starter",
        price: "€0",
        period: "forever",
        description: "Perfect for side projects and exploration.",
        cta: "Start free",
        highlight: false,
        badge: null,
        stripeLink: null,
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
        name: "Indie",
        price: "€22",
        period: "/ month",
        description: "For solo developers with apps in production.",
        cta: "Try free for 3 days",
        highlight: false,
        badge: null,
        stripeLink: "https://skopos.lemonsqueezy.com/buy/indie",
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
        name: "Pro",
        price: "€59",
        period: "/ month",
        description: "For teams who need real observability.",
        cta: "Try free for 3 days",
        highlight: true,
        badge: "Most popular",
        stripeLink: "https://skopos.lemonsqueezy.com/buy/pro",
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
        name: "Business",
        price: "€169",
        period: "/ month",
        description: "For companies shipping at scale.",
        cta: "Try free for 3 days",
        highlight: false,
        badge: null,
        stripeLink: "https://skopos.lemonsqueezy.com/buy/business",
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

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7L5.5 10L11.5 4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 4L10 10M10 4L4 10" stroke="#a0aab4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function PricingNavbarLinks() {
    return (
        <>
            <Link href="/projects" className="text-[#7d8590] hover:text-white text-xs transition-colors" style={inter}>Dashboard</Link>
        </>
    );
}

export default function PricingPage() {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref);

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#000000" }}>
            {/* Navbar */}
            <nav style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
                borderBottom: "1px solid #111111",
                backgroundColor: "rgba(0,0,0,0.92)",
                backdropFilter: "blur(12px)",
            }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", height: "48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Logo size={24} />
                        <span style={{ color: "#ffffff", fontSize: "13px", fontWeight: 600, letterSpacing: "-0.2px", ...inter }}>skopos</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                        <PricingNavbarLinks />
                        <Link href={IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_HREF : "/login"} className="bg-[#4ade80] hover:bg-[#2aad65] text-black font-bold text-xs px-4 py-2 rounded-lg transition-colors" style={inter}>{IS_PRE_LAUNCH ? PRE_LAUNCH_CTA_LABEL : "Start free"}</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <div style={{ paddingTop: "120px", paddingBottom: "64px", textAlign: "center" }}>
                <h2 style={{ ...inter, fontSize: "30px", color: "#4ade80", fontWeight: 700, marginBottom: "8px" }}>Pricing</h2>
                <h1 className="text-xl md:text-2xl font-bold text-white mb-4" style={inter}>Simple, transparent pricing</h1>
                <p className="text-[#7d8590] text-sm max-w-md mx-auto leading-relaxed" style={inter}>
                    Start free. Scale when you need to. No hidden fees, no surprises.
                </p>
            </div>

            {/* Plans */}
            <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px 80px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                {plans.map((plan, i) => (
                    <div
                        key={plan.name}
                        style={{
                            backgroundColor: plan.highlight ? "#0a0f0a" : "#0a0a0a",
                            border: `1px solid ${plan.highlight ? "#4ade80" : "#1a1a1a"}`,
                            borderRadius: "10px",
                            padding: "28px 24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "20px",
                            opacity: inView ? 1 : 0,
                            transform: inView ? "translateY(0)" : "translateY(20px)",
                            transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
                            position: "relative",
                        }}
                    >
                        {plan.badge && (
                            <span style={{ ...inter, position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#4ade80", color: "#000", fontSize: "10px", fontWeight: 700, padding: "3px 12px", borderRadius: "20px", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
                                {plan.badge}
                            </span>
                        )}

                        <div>
                            <p style={{ ...inter, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>{plan.name}</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" }}>
                                <span style={{ ...inter, fontSize: "28px", color: "#e6edf3", fontWeight: 700 }}>{plan.price}</span>
                                <span style={{ ...inter, fontSize: "12px", color: "#a0aab4" }}>{plan.period}</span>
                            </div>
                            <p style={{ ...inter, fontSize: "12px", color: "#a0aab4", lineHeight: 1.6 }}>{plan.description}</p>
                        </div>

                        {IS_PRE_LAUNCH ? (


                          <Link href={PRE_LAUNCH_CTA_HREF} style={{


                            ...inter,


                            display: "block",


                            textAlign: "center",


                            padding: "10px 16px",


                            borderRadius: "6px",


                            fontSize: "12px",


                            fontWeight: 700,


                            textDecoration: "none",


                            backgroundColor: "transparent",


                            color: "#a0aab4",


                            border: "1px solid #1a1a1a",


                          }}>


                            Available at launch


                          </Link>


                        ) : (<a
                            href={plan.stripeLink ?? "/login"}
                            style={{
                                ...inter,
                                display: "block",
                                textAlign: "center",
                                padding: "10px 16px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: 700,
                                textDecoration: "none",
                                backgroundColor: plan.highlight ? "#4ade80" : "transparent",
                                color: plan.highlight ? "#000" : "#e6edf3",
                                border: plan.highlight ? "none" : "1px solid #1a1a1a",
                                transition: "opacity 0.2s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                        >
                            {plan.cta}
                        </a>


                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {plan.features.map(f => (
                                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {f.included ? <CheckIcon /> : <XIcon />}
                                    <span style={{ ...inter, fontSize: "12px", color: f.included ? "#e6edf3" : "#a0aab4" }}>{f.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>


            {/* Compare matrix */}
            <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px 80px" }}>
                <p style={{ ...inter, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: "8px" }}>Compare plans</p>
                <h2 style={{ ...inter, fontSize: "24px", fontWeight: 700, color: "#e6edf3", textAlign: "center", marginBottom: "48px" }}>Everything you need, nothing you don&apos;t</h2>
                <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", ...inter }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", padding: "12px 16px", color: "#a0aab4", fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #1a1a1a", width: "35%" }}>Feature</th>
                            {["Starter", "Indie", "Pro", "Business"].map((p, i) => (
                                <th key={p} style={{ textAlign: "center", padding: "12px 16px", borderBottom: "1px solid #1a1a1a", width: "16.25%" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: i === 2 ? "#4ade80" : "#e6edf3" }}>{p}</div>
                                    <div style={{ fontSize: "11px", color: "#a0aab4", marginTop: "2px" }}>{["€0", "€22", "€59", "€169"][i]}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[
                            { category: "Logs & Storage", rows: [
                                { label: "Logs / hour", values: ["10K", "100K", "500K", "5M"] },
                                { label: "Log retention", values: ["7 days", "21 days", "60 days", "90 days"] },
                                { label: "Projects", values: ["1", "3", "10", "Unlimited"] },
                            ]},
                            { category: "AI Features", rows: [
                                { label: "AI insights / month", values: ["5", "Unlimited", "Unlimited", "Unlimited"] },
                                { label: "AI chatbot (msg/day)", values: ["3", "15", "60", "200"] },
                                { label: "Context-aware analysis", values: [false, true, true, true] },
                            ]},
                            { category: "Monitoring", rows: [
                                { label: "Uptime monitors", values: ["—", "2", "10", "Unlimited"] },
                                { label: "Alert rules", values: [false, "5", "20", "Unlimited"] },
                                { label: "Email alerts", values: [false, true, true, true] },
                            ]},
                            { category: "Support & SLA", rows: [
                                { label: "Community support", values: [true, true, true, true] },
                                { label: "Email support", values: [false, true, true, true] },
                                { label: "Priority support", values: [false, false, true, true] },
                                { label: "SLA guarantee", values: [false, false, false, true] },
                            ]},
                        ].map(({ category, rows }) => (
                            <>
                                <tr key={category}>
                                    <td colSpan={5} style={{ padding: "20px 16px 8px", fontSize: "10px", fontWeight: 600, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.1em" }}>{category}</td>
                                </tr>
                                {rows.map(({ label, values }) => (
                                    <tr key={label} style={{ borderBottom: "1px solid #0d0d0d" }}>
                                        <td style={{ padding: "12px 16px", fontSize: "13px", color: "#a0aab4" }}>{label}</td>
                                        {values.map((v, i) => (
                                            <td key={i} style={{ padding: "12px 16px", textAlign: "center", fontSize: "13px", color: "#e6edf3", backgroundColor: i === 2 ? "rgba(74,222,128,0.03)" : "transparent" }}>
                                                {v === true ? (
                                                    <span style={{ display: "inline-flex", justifyContent: "center" }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                                                ) : v === false ? (
                                                    <span style={{ color: "#333", fontSize: "16px" }}>—</span>
                                                ) : (
                                                    <span style={{ fontWeight: i === 2 ? 600 : 400 }}>{v}</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            {/* FAQ */}
            <div style={{ maxWidth: "600px", margin: "0 auto", padding: "0 24px 80px" }}>
                <p style={{ ...inter, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: "32px" }}>FAQ</p>
                {[
                    { q: "Can I upgrade or downgrade anytime?", a: "Yes. Plan changes take effect immediately. Downgrades are prorated." },
                    { q: "What happens if I exceed my log limit?", a: "We will notify you. Logs above the limit are dropped — your app keeps running normally." },
                    { q: "Is there a free trial for paid plans?", a: "Yes — all paid plans include a 3-day free trial. Card required to start, no charges during the trial, cancel anytime." },
                    { q: "Do you offer discounts for annual billing?", a: "Annual billing gives you 2 months free. Contact us for details." },
                ].map(({ q, a }) => (
                    <div key={q} style={{ borderBottom: "1px solid #1a1a1a", padding: "20px 0" }}>
                        <p style={{ ...inter, fontSize: "13px", color: "#e6edf3", fontWeight: 500, marginBottom: "8px" }}>{q}</p>
                        <p style={{ ...inter, fontSize: "12px", color: "#a0aab4", lineHeight: 1.7 }}>{a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
