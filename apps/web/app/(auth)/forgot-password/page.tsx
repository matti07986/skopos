"use client";

import { useState, FormEvent, Suspense, useEffect } from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";

const inputCls =
  "w-full bg-brand-bg border border-brand-border text-[#e6edf3] text-xs rounded px-3 py-2 placeholder:text-[#7d8590] focus:outline-none focus:border-brand-green focus:ring-0 transition-colors";
const btnCls =
  "w-full bg-brand-green hover:bg-[#2aad65] disabled:opacity-40 text-brand-bg font-bold text-xs rounded py-2 transition-colors";

function ForgotPasswordForm() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setCooldown(30);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Something went wrong. Please try again.");
      setSent(true);
      setCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm relative z-10">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Logo size={28} />
          <span className="text-white font-semibold text-sm">skopos</span>
        </div>
        <p className="text-[#7d8590] text-xs mt-2">Reset your password</p>
      </div>

      <div className="bg-brand-surface/70 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-2xl">
        <div className="border-b border-brand-border px-6 py-3">
          <span className="text-xs font-semibold text-brand-green">Forgot password</span>
        </div>
        <div className="p-6 space-y-4">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-[#e6edf3] text-xs">Check your inbox.</p>
              <p className="text-[#7d8590] text-xs">
                If an account exists for that email, we sent a reset link. It expires in 1 hour.
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
                className="text-brand-green text-xs hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed mt-2"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? "Sending…" : "Didn't get it? Resend"}
              </button>
              <Link href="/login" className="block text-[#7d8590] text-[10px] hover:text-[#e6edf3] transition-colors mt-3">
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                  {error}
                </p>
              )}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">Email</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className={inputCls}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={loading} className={btnCls}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
              <p className="text-center">
                <Link href="/login" className="text-[#7d8590] text-[10px] hover:text-[#e6edf3] transition-colors">
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-green/5 rounded-full blur-[100px]" />
      <Suspense fallback={<div className="w-8 h-8 rounded-full border-2 border-[#4ade80] border-t-transparent animate-spin" />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
