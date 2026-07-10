"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { apiUrl } from "@/lib/api";

const inputCls =
  "w-full bg-brand-bg border border-brand-border text-[#e6edf3] text-xs rounded px-3 py-2 placeholder:text-[#7d8590] focus:outline-none focus:border-brand-green focus:ring-0 transition-colors";

const btnCls =
  "w-full bg-brand-green hover:bg-[#2aad65] disabled:opacity-40 text-brand-bg font-bold text-xs rounded py-2 transition-colors";

type Status = "idle" | "loading" | "success" | "error";

export default function PreregisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [useCase, setUseCase] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/v1/auth/preregister`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
          use_case: useCase.trim() || undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          const seconds = retryAfter ? parseInt(retryAfter, 10) : null;
          if (seconds && seconds > 0) {
            const minutes = Math.ceil(seconds / 60);
            const unit = minutes === 1 ? "minute" : "minutes";
            throw new Error(
              `Too many attempts. Try again in ${minutes} ${unit}.`
            );
          }
          throw new Error("Too many attempts. Try again later.");
        }
        if (res.status === 422) {
          const data = await res.json();
          const detail = Array.isArray(data.detail)
            ? data.detail.map((e: { msg: string }) => e.msg).join(", ")
            : "Please check the form and try again.";
          throw new Error(detail);
        }
        throw new Error("Something went wrong. Please try again.");
      }


      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Grid pattern — same as landing hero */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      {/* Green glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-green/10 rounded-full blur-[120px]" />
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/landing" className="flex justify-center items-center gap-2 mb-1 hover:opacity-80 transition-opacity">
            <Logo size={28} />
            <span className="text-white font-semibold text-sm">skopos</span>
          </Link>
          <p className="text-[#7d8590] text-xs mt-2">
            See what&apos;s breaking. Fix it fast.
          </p>
        </div>

        {/* Card */}
        <div className="bg-brand-surface/70 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-2xl">
          {status === "success" ? (
            // ─── Success state ──────────────────────────────────────────
            <div className="p-8 space-y-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-green/15 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3DDC84"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <h1 className="text-[#e6edf3] text-base font-semibold mb-2">
                  You&apos;re on the list
                </h1>
                <p className="text-[#7d8590] text-xs leading-relaxed">
                  We&apos;ll send you a single email when Skopos launches publicly &mdash;
                  no spam, no drip campaigns.
                </p>
              </div>
              <div className="pt-3 border-t border-brand-border space-y-3">
                <p className="text-[#7d8590] text-[11px]">
                  Want a preview right now?
                </p>
              </div>
            </div>
          ) : (
            // ─── Form state ─────────────────────────────────────────────
            <>
              <div className="px-6 py-5 border-b border-brand-border">
                <h1 className="text-[#e6edf3] text-sm font-semibold">
                  Get early access
                </h1>
                <p className="text-[#7d8590] text-[11px] mt-1 leading-relaxed">
                  We&apos;re polishing the last details before launch. Drop your email and
                  you&apos;ll be the first to know.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {error && (
                  <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">
                    Email <span className="text-brand-green">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className={inputCls}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    disabled={status === "loading"}
                  />
                </div>

                {/* Name (optional) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">
                    Name <span className="text-[#7d8590] normal-case font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="How should we address you?"
                    className={inputCls}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={128}
                    disabled={status === "loading"}
                  />
                </div>

                {/* Use case (optional) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">
                    What brings you here? <span className="text-[#7d8590] normal-case font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    placeholder="e.g. tired of grepping logs across 3 servers..."
                    className={`${inputCls} resize-none`}
                    rows={3}
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    maxLength={500}
                    disabled={status === "loading"}
                  />
                  <p className="text-[10px] text-[#7d8590]">
                    Helps us prioritize features for early users.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={status === "loading" || !email}
                  className={btnCls}
                >
                  {status === "loading" ? "Joining…" : "Join the waiting list"}
                </button>

                <p className="text-[10px] text-[#7d8590] text-center pt-2">
                  No marketing. No newsletter. Just one launch email.
                </p>
              </form>
            </>
          )}
        </div>

        {/* Bottom links */}
        <div className="mt-6 text-center space-x-4">
          <Link
            href="/how-it-works"
            className="text-[#7d8590] hover:text-[#e6edf3] text-[11px] transition-colors"
          >
            How it works
          </Link>
          <span className="text-brand-border">·</span>
          <Link
            href="/landing"
            className="text-[#7d8590] hover:text-[#e6edf3] text-[11px] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
