"use client";

import { IS_PRE_LAUNCH, PRE_LAUNCH_CTA_HREF, PRE_LAUNCH_CTA_LABEL } from "@/lib/preLaunch";
import Link from "next/link";
import { useEffect, useState } from "react";

type SdkTab = "python" | "node";

// ─── syntax-highlighting helpers ──────────────────────────────────────────────

const PY_KEYWORDS = new Set([
    "import", "from", "def", "return", "if", "else", "elif", "try", "except", "finally",
    "async", "await", "for", "in", "while", "with", "as", "True", "False", "None",
    "class", "pass", "raise", "lambda", "and", "or", "not", "is",
]);

const JS_KEYWORDS = new Set([
    "import", "from", "export", "default", "const", "let", "var", "function", "return",
    "if", "else", "try", "catch", "finally", "throw", "new", "class", "extends",
    "async", "await", "for", "of", "in", "while", "do", "switch", "case", "break",
    "true", "false", "null", "undefined", "this", "typeof", "instanceof", "void",
]);

function highlightLine(line: string, keywords: Set<string>): React.ReactNode {
    const trimmed = line.trimStart();
    // Full-line comments
    if (trimmed.startsWith("#") || trimmed.startsWith("//")) {
        return <span className="text-[#6e7681]">{line}</span>;
    }

    const tokens: React.ReactNode[] = [];
    const regex = /("[^"]*"|'[^']*'|`[^`]*`|\/\/[^\n]*|#[^\n]*|\b[a-zA-Z_][a-zA-Z0-9_]*\b|\b\d+\b|\s+|[^\w\s])/g;
    let key = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(line)) !== null) {
        const t = m[0];
        if (t.startsWith('"') || t.startsWith("'") || t.startsWith("`")) {
            tokens.push(<span key={key++} className="text-yellow-300">{t}</span>);
        } else if (t.startsWith("//") || t.startsWith("#")) {
            tokens.push(<span key={key++} className="text-[#6e7681]">{t}</span>);
        } else if (keywords.has(t)) {
            tokens.push(<span key={key++} className="text-brand-green font-semibold">{t}</span>);
        } else if (/^\d+$/.test(t)) {
            tokens.push(<span key={key++} className="text-orange-300">{t}</span>);
        } else {
            tokens.push(<span key={key++} className="text-[#e6edf3]">{t}</span>);
        }
    }
    return <>{tokens}</>;
}

function CodeBlock({ code, language }: { code: string; language: "python" | "node" }) {
    const keywords = language === "python" ? PY_KEYWORDS : JS_KEYWORDS;
    return (
        <pre className="bg-black border border-brand-border rounded p-4 text-[12px] font-mono leading-relaxed overflow-x-auto">
            {code.split("\n").map((line, i) => (
                <div key={i}>{highlightLine(line, keywords) || <>&nbsp;</>}</div>
            ))}
        </pre>
    );
}

const PYTHON_CODE = `# install via pip
import skopos

# initialize once at startup
skopos.init(api_key="sk_live_8f3a...c92e", service="api")

def handle_payment(order_id: str, amount: int):
    skopos.info("Processing payment", {
        "order_id": order_id,
        "amount_cents": amount,
    })
    try:
        charge = stripe.Charge.create(amount=amount)
        return charge
    except StripeError as e:
        skopos.error("Payment failed", {
            "order_id": order_id,
            "stripe_code": e.code,
        })
        raise`;

const NODE_CODE = `// install via npm
import * as skopos from "@skopos/node";

// initialize once at startup
skopos.init("sk_live_8f3a...c92e", undefined, "api");

export async function handlePayment(orderId: string, amount: number) {
    skopos.info("Processing payment", {
        order_id: orderId,
        amount_cents: amount,
    });
    try {
        const charge = await stripe.charges.create({ amount });
        return charge;
    } catch (err) {
        skopos.error("Payment failed", {
            order_id: orderId,
            stripe_code: (err as StripeError).code,
        });
        throw err;
    }
}`;

export default function SdkPage() {
    const [tab, setTab] = useState<SdkTab>("python");
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
                            Simple SDK
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
                                <span className="ml-4 text-xs text-[#7d8590]">
                                    {tab === "python" ? "python — app.py" : "node — server.ts"}
                                </span>
                            </div>
                            <span className="text-xs text-brand-green">
                                {tab === "python" ? "Python" : "TypeScript"}
                            </span>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-brand-border">
                            {([["python", "Python"], ["node", "Node.js"]] as [SdkTab, string][]).map(([id, label]) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setTab(id)}
                                    className={`px-5 py-2.5 text-xs font-semibold transition-colors ${tab === id
                                        ? "text-brand-green border-b-2 border-brand-green bg-brand-green/5"
                                        : "text-[#7d8590] hover:text-[#e6edf3] border-b-2 border-transparent"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-[10px] text-[#7d8590] uppercase tracking-widest mb-2">Install</p>
                                <pre className="bg-black border border-brand-border rounded p-3 text-[12px] font-mono text-[#e6edf3]">
                                    <span className="text-[#6e7681]">$</span>{" "}
                                    {tab === "python"
                                        ? <><span className="text-brand-green">pip install</span> <span className="text-yellow-300">skopos-python</span></>
                                        : <><span className="text-brand-green">npm install</span> <span className="text-yellow-300">@skopos/node</span></>}
                                </pre>
                            </div>

                            <div>
                                <p className="text-[10px] text-[#7d8590] uppercase tracking-widest mb-2">Usage</p>
                                <CodeBlock
                                    language={tab === "python" ? "python" : "node"}
                                    code={tab === "python" ? PYTHON_CODE : NODE_CODE}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="max-w-6xl mx-auto px-6 mb-20">
                    <h2 className="text-2xl sm:text-4xl font-bold text-white text-center mb-12" style={{ letterSpacing: "-0.02em" }}>
                        Built for production, designed for developers
                    </h2>
                    <div className="space-y-6 max-w-2xl mx-auto">
                        {[
                            ["Zero configuration", "One init call. No env files, no service registration, no dashboards to wire up. Send your first log in under 60 seconds."],
                            ["Async batching", "Logs are batched up to 100 per request and flushed every 2 seconds. Your hot path stays hot — never blocks on the network."],
                            ["Automatic retries", "On transient failures, batches are re-queued and retried. You never lose a log because of a network blip."],
                            ["Structured metadata", "Attach any JSON metadata to every log. Filter and query on it later from the dashboard."],
                            ["Thread-safe queue", "Concurrent producers, single async flusher. Safe to call from any thread, coroutine, or worker."],
                            ["No dependencies", "Python SDK uses only stdlib. Node SDK uses native fetch. No transitive supply-chain risk, no version conflicts."],
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
