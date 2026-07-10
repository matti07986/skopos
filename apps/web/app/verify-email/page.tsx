"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/logo";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailFromQuery = searchParams.get("email") || "";

    const [email, setEmail] = useState(emailFromQuery);
    const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resending, setResending] = useState(false);
    const [resendMsg, setResendMsg] = useState<string | null>(null);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!email) {
            const stored = sessionStorage.getItem("skopos_pending_email") || localStorage.getItem("skopos_pending_email");
            if (stored) setEmail(stored);
        }
    }, [email]);

    useEffect(() => { inputsRef.current[0]?.focus(); }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    function setDigit(idx: number, value: string) {
        const cleaned = value.replace(/\D/g, "").slice(0, 1);
        const next = [...digits];
        next[idx] = cleaned;
        setDigits(next);
        setError(null);
        if (cleaned && idx < 5) inputsRef.current[idx + 1]?.focus();
        if (next.every((d) => d) && next.join("").length === 6) submit(next.join(""));
    }

    function onKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Backspace" && !digits[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
        if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
        if (e.key === "ArrowRight" && idx < 5) inputsRef.current[idx + 1]?.focus();
    }

    function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted.length) return;
        const next = pasted.split("").concat(Array(6 - pasted.length).fill(""));
        setDigits(next);
        if (pasted.length === 6) submit(pasted);
        else inputsRef.current[pasted.length]?.focus();
    }

    async function submit(code: string) {
        if (!email) { setError("Email missing. Please go back to login."); return; }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: code }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.detail || "Invalid code. Please try again.");
                setDigits(["", "", "", "", "", ""]);
                inputsRef.current[0]?.focus();
                return;
            }
            localStorage.setItem("skopos_access_token", data.access_token);
            sessionStorage.removeItem("skopos_pending_email");
            sessionStorage.removeItem("skopos_pending_password");
            localStorage.removeItem("skopos_pending_email");
            router.push("/projects");
        } catch {
            setError("Connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function resendCode() {
        if (resendCooldown > 0 || resending || !email) return;
        setResending(true);
        setResendMsg(null);
        setError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/resend-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.detail || "Could not resend code."); return; }
            setResendMsg("New code sent!");
            setResendCooldown(60);
            setDigits(["", "", "", "", "", ""]);
            inputsRef.current[0]?.focus();
        } catch {
            setError("Connection error.");
        } finally {
            setResending(false);
        }
    }

    return (
        <div className="w-full max-w-sm">
            {/* Logo */}
            <div className="flex justify-center mb-6">
                <div className="flex items-center gap-2">
                    <Logo size={28} />
                    <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>skopos</span>
                </div>
            </div>

            <div className="bg-brand-surface/70 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-6 pt-8 pb-5 text-center">
                    <h1 className="text-[#e6edf3] font-bold text-lg mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Verify your email</h1>
                    {email && (
                        <p className="text-[#7d8590] text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Code sent to <span className="text-[#e6edf3]">{email}</span>
                        </p>
                    )}
                </div>

                <div className="px-6 pb-8 flex flex-col gap-5">
                    {/* OTP inputs — blocco unito */}
                    <div className="flex justify-center">
                        <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "8px", overflow: "hidden", backgroundColor: "rgba(13,17,23,0.6)" }}>
                        {digits.map((d, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputsRef.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={d}
                                onChange={(e) => setDigit(i, e.target.value)}
                                onKeyDown={(e) => onKeyDown(i, e)}
                                onPaste={onPaste}
                                disabled={loading}
                                style={{
                                    width: "48px", height: "52px", textAlign: "center",
                                    fontSize: "20px", fontWeight: 700,
                                    backgroundColor: d ? "rgba(74,222,128,0.08)" : "transparent",
                                    borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.1)",
                                    borderTop: "none", borderBottom: "none", borderRight: "none",
                                    color: "#4ade80",
                                    fontFamily: "'SF Mono', 'Monaco', monospace",
                                    outline: "none",
                                    transition: "background-color 0.15s",
                                    cursor: "text",
                                }}
                            />
                        ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-[#f87171] text-xs text-center" style={{ fontFamily: "'Inter', sans-serif" }}>{error}</p>
                    )}
                    {resendMsg && !error && (
                        <p className="text-brand-green text-xs text-center" style={{ fontFamily: "'Inter', sans-serif" }}>{resendMsg}</p>
                    )}
                    {loading && (
                        <p className="text-[#7d8590] text-xs text-center" style={{ fontFamily: "'Inter', sans-serif" }}>Verifying...</p>
                    )}

                    <div className="border-t border-white/10 pt-3 flex flex-col items-center gap-2">
                        <button
                            onClick={resendCode}
                            disabled={resendCooldown > 0 || resending || !email}
                            className="text-[#7d8590] hover:text-[#e6edf3] text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            style={{ fontFamily: "'Inter', sans-serif", background: "none", border: "none", cursor: "pointer" }}
                        >
                            {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : resending ? "Sending..." : "Resend code"}
                        </button>
                        <Link href="/login" className="text-[#7d8590] hover:text-[#e6edf3] text-xs transition-colors" style={{ fontFamily: "'Inter', sans-serif" }}>
                            ← Back to login
                        </Link>
                    </div>
                </div>
            </div>

            <p className="text-[#7d8590] text-xs text-center mt-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                Code expires in 15 minutes · Check your spam folder
            </p>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="relative min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden">
            {/* Grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
            {/* Green glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-green/10 rounded-full blur-[120px]" />
            <Suspense fallback={
                <div className="relative z-10">
                    <div className="w-8 h-8 rounded-full border-2 border-[#4ade80] border-t-transparent animate-spin" />
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
