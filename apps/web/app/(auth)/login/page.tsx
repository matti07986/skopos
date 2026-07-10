"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/logo";

type Tab = "signin" | "register";

const inputCls =
  "w-full bg-brand-bg border border-brand-border text-[#e6edf3] text-xs rounded px-3 py-2 placeholder:text-[#7d8590] focus:outline-none focus:border-brand-green focus:ring-0 transition-colors";

const btnCls =
  "w-full bg-brand-green hover:bg-[#2aad65] disabled:opacity-40 text-brand-bg font-bold text-xs rounded py-2 transition-colors";

function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("signin");

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);

  const searchParams = useSearchParams();
  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");
    if (token) {
      localStorage.setItem("skopos_access_token", token);
      router.push("/projects");
    }
    if (error === "no_email") {
      setError("GitHub account has no verified email. Please use email/password.");
    }
  }, [searchParams, router]);

  function handleTabChange(next: Tab) {
    setTab(next);
    setError(null);
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          const seconds = retryAfter ? parseInt(retryAfter, 10) : null;
          if (seconds && seconds > 0) {
            const minutes = Math.ceil(seconds / 60);
            const unit = minutes === 1 ? "minute" : "minutes";
            throw new Error(`Too many login attempts. Try again in ${minutes} ${unit} — or reset your password.`);
          }
          throw new Error("Too many login attempts. Try again later — or reset your password.");
        }
        throw new Error("Invalid email or password");
      }
      const data = await res.json();
      localStorage.setItem("skopos_access_token", data.access_token);
      localStorage.setItem("skopos_api_key", data.api_key);
      localStorage.setItem("skopos_user_id", String(data.user_id));
      localStorage.setItem("skopos_email", email);
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        const detail = typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail)
                ? data.detail.map((e: any) => e.msg).join(", ")
                : "Registration failed";
        throw new Error(detail);
      }
      const { api_key, user_id } = await res.json();
      localStorage.setItem("skopos_api_key", api_key);
      localStorage.setItem("skopos_user_id", String(user_id));
      localStorage.setItem("skopos_email", email);
      sessionStorage.setItem("skopos_pending_email", email);
      sessionStorage.setItem("skopos_pending_password", password);
      // Dopo la registrazione l'utente deve verificare l'email prima di fare login
      // quindi NON salviamo access_token qui — redirect alla pagina di conferma
      router.push("/verify-email");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm relative z-10">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Logo size={28} />
          <span className="text-white font-semibold text-sm">skopos</span>
        </div>
        <p
          className="text-[#7d8590] text-xs mt-2"
        >
          See what&apos;s breaking. Fix it fast.
        </p>
      </div>

      {/* Card */}
      <div className="bg-brand-surface/70 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden shadow-2xl" style={{ willChange: "auto" }}>
        {/* Tabs */}
        <div className="flex border-b border-brand-border">
          {([["signin", "Sign in"], ["register", "Create account"]] as [Tab, string][]).map(
            ([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                  tab === id
                    ? "text-brand-green border-b-2 border-brand-green bg-brand-green/5"
                    : "text-[#7d8590] hover:text-[#e6edf3]"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* Forms */}
        <div className="p-6 space-y-4">
          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">
                  Email
                </label>
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
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    className={`${inputCls} pr-8`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7d8590] hover:text-[#e6edf3] transition-colors text-sm leading-none"
                    tabIndex={-1}
                  >
                    👁
                  </button>
                </div>
              </div>
                            <div className="flex justify-end -mt-1">
                <Link href="/forgot-password" className="text-[10px] text-[#7d8590] hover:text-brand-green transition-colors">Forgot password?</Link>
              </div>
<button type="submit" disabled={loading} className={btnCls}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">
                  Email
                </label>
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
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    className={`${inputCls} pr-8`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7d8590] hover:text-[#e6edf3] transition-colors text-sm leading-none"
                    tabIndex={-1}
                  >
                    👁
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#7d8590] uppercase tracking-widest">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    className={`${inputCls} pr-8`}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7d8590] hover:text-[#e6edf3] transition-colors text-sm leading-none"
                    tabIndex={-1}
                  >
                    👁
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className={btnCls}>
                {loading ? "Creating account…" : "Get started"}
              </button>
            </form>
          )}
        </div>

        {/* GitHub SSO */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-brand-border" />
            <span className="text-[#7d8590] text-[10px]">or</span>
            <div className="flex-1 h-px bg-brand-border" />
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/github`}
            className="flex items-center justify-center gap-2 w-full border border-brand-border hover:border-white/20 text-[#e6edf3] text-xs font-semibold py-2 rounded transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </a>
        </div>
      </div>

      <p className="text-center text-[#7d8590] text-[10px] mt-6">
        Your API key is generated on registration and never stored in plain text.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
      {/* Green glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-green/5 rounded-full blur-[100px]" />

      <Suspense fallback={<div className="w-8 h-8 rounded-full border-2 border-[#4ade80] border-t-transparent animate-spin" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
