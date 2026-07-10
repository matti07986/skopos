"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/logo";

const inputCls =
  "w-full bg-brand-bg border border-brand-border text-[#e6edf3] text-xs rounded px-3 py-2 placeholder:text-[#7d8590] focus:outline-none focus:border-brand-green focus:ring-0 transition-colors";
const btnCls =
  "w-full bg-brand-green hover:bg-[#2aad65] disabled:opacity-40 text-brand-bg font-bold text-xs rounded py-2 transition-colors";

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  if (!token) {
    return (
      <div className="w-full max-w-sm relative z-10 text-center space-y-3">
        <p className="text-red-400 text-xs">Invalid or missing reset token.</p>
        <Link href="/login" className="text-brand-green text-xs hover:underline block">← Back to sign in</Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password || !confirm) { setError("Please fill in both password fields."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!res.ok) {
        const data = await res.json();
        const detail = typeof data.detail === "string"
          ? data.detail
          : Array.isArray(data.detail)
            ? data.detail.map((e: any) => e.msg.replace(/^Value error, /, "")).join(", ")
            : "Invalid or expired reset link.";
        throw new Error(detail);
      }
      router.push("/login?reset=success");
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
        <p className="text-[#7d8590] text-xs mt-2">Choose a new password</p>
      </div>

      <div className="bg-brand-surface/70 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-2xl">
        <div className="border-b border-brand-border px-6 py-3">
          <span className="text-xs font-semibold text-brand-green">Reset password</span>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">{error}</p>
          )}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">New Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  className={`${inputCls} pr-8`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required autoFocus
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7d8590] hover:text-[#e6edf3] transition-colors text-sm leading-none" tabIndex={-1}>👁</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className={`${inputCls} pr-8`}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7d8590] hover:text-[#e6edf3] transition-colors text-sm leading-none" tabIndex={-1}>👁</button>
              </div>
            </div>
            <p className="text-[10px] text-[#7d8590]">Min. 8 characters, 1 uppercase, 1 number.</p>
            <button type="submit" disabled={loading} className={btnCls}>
              {loading ? "Updating…" : "Set new password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-green/5 rounded-full blur-[100px]" />
      <Suspense fallback={<div className="w-8 h-8 rounded-full border-2 border-[#4ade80] border-t-transparent animate-spin" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
