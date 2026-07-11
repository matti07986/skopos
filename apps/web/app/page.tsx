import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skopos — Real-time log monitoring with AI insights",
  description:
    "A portfolio project by Mattia Garello. Self-hostable log monitoring with automatic AI pattern analysis. Full source on GitHub.",
};

const GITHUB_URL = "https://github.com/matti07986/skopos";
const CONTACT_EMAIL = "garellomattia.firm@gmail.com";
const LINKEDIN_URL = "https://www.linkedin.com/in/mattia-garello-2b7869258/";

// TODO: replace when you record the walkthrough
// Suggested: Loom (loom.com), 60-90 seconds, showing dashboard + insight
const VIDEO_URL: string | null = null;

export default function RootPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0C] text-[#e6edf3] antialiased">
      {/* Header */}
      <header className="border-b border-white/5">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <div className="text-lg font-semibold tracking-tight">Skopos</div>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 transition hover:text-white"
            >
              GitHub →
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-16">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-[#4ade80]">
          Portfolio Project
        </p>
        <h1 className="mb-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Real-time log monitoring
          <br />
          with AI-powered insights.
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-white/60">
          Skopos ingests logs from your application at 2,000+ events/sec,
          groups similar errors into patterns, and asks Claude to explain
          the likely root cause — before you go looking through raw logs.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-[#4ade80] px-5 py-2.5 text-sm font-medium text-black transition hover:bg-[#22c55e]"
          >
            View source on GitHub
            <span aria-hidden>↗</span>
          </Link>
          
            href={`mailto:${CONTACT_EMAIL}?subject=Skopos%20—%20demo%20request`}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Request a live demo
          </a>
        </div>
      </section>

      {/* Video walkthrough */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="mb-6 text-xs font-medium uppercase tracking-widest text-white/40">
          Walkthrough
        </h2>
        {VIDEO_URL ? (
          <div className="aspect-video overflow-hidden rounded-lg border border-white/10">
            <iframe
              src={VIDEO_URL}
              title="Skopos walkthrough"
              className="h-full w-full"
              allow="fullscreen"
            />
          </div>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
            <div className="text-center">
              <p className="text-sm text-white/40">Demo video coming soon</p>
              <p className="mt-2 text-xs text-white/30">
                In the meantime, {" "}
                
                  href={`mailto:${CONTACT_EMAIL}?subject=Skopos%20—%20demo%20request`}
                  className="underline transition hover:text-white/60"
                >
                  request a live demo
                </a>
              </p>
            </div>
          </div>
        )}
      </section>

      {/* What it does */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="mb-8 text-xs font-medium uppercase tracking-widest text-white/40">
          What it does
        </h2>
        <ul className="space-y-4 text-white/70">
          <li className="flex gap-4">
            <span className="text-[#4ade80]">→</span>
            <span>
              <strong className="text-white">Ingests logs</strong> from any
              language at 2,140 events/sec sustained (measured on a single
              Hetzner CPX21 instance under load test).
            </span>
          </li>
          <li className="flex gap-4">
            <span className="text-[#4ade80]">→</span>
            <span>
              <strong className="text-white">Clusters similar errors</strong>{" "}
              into patterns via fingerprinting (level + service + message
              hash).
            </span>
          </li>
          <li className="flex gap-4">
            <span className="text-[#4ade80]">→</span>
            <span>
              <strong className="text-white">Analyzes each pattern</strong>{" "}
              once with Claude Sonnet 4.6 — cached result, bounded cost.
            </span>
          </li>
          <li className="flex gap-4">
            <span className="text-[#4ade80]">→</span>
            <span>
              <strong className="text-white">Alerts on threshold breaches</strong>{" "}
              (rule-based, no LLM in the alerting path — cheap and fast).
            </span>
          </li>
          <li className="flex gap-4">
            <span className="text-[#4ade80]">→</span>
            <span>
              <strong className="text-white">Detects anomalies</strong>{" "}
              statistically — no LLM either.
            </span>
          </li>
          <li className="flex gap-4">
            <span className="text-[#4ade80]">→</span>
            <span>
              <strong className="text-white">Runs entirely in EU</strong>{" "}
              (Hetzner Frankfurt), self-hostable via Docker Compose.
            </span>
          </li>
        </ul>
      </section>

      {/* Tech stack */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="mb-8 text-xs font-medium uppercase tracking-widest text-white/40">
          Built with
        </h2>
        <div className="grid gap-6 text-sm text-white/70 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">
              Frontend
            </p>
            <p>Next.js 15 · React 18 · Tailwind · TypeScript</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">
              Backend
            </p>
            <p>FastAPI · Python 3.12 · SQLAlchemy async</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">
              Storage
            </p>
            <p>Postgres 16 · Redis 7 (streams + cache)</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">
              AI
            </p>
            <p>Anthropic Claude Sonnet 4.6</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">
              Deploy
            </p>
            <p>Docker Compose · Hetzner (Frankfurt, EU)</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-white/40">
              SDKs
            </p>
            <p>Python (PyPI) · JavaScript (npm)</p>
          </div>
        </div>
      </section>

      {/* Status */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="mb-6 text-xs font-medium uppercase tracking-widest text-white/40">
          Status
        </h2>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
          <p className="text-white/70">
            Skopos is currently a portfolio project. Not accepting paying
            users, no SLA, no support commitments.
          </p>
          <p className="mt-4 text-white/70">
            The code is available if you want to study a full-stack async
            Python + Next.js system, self-host log monitoring for a personal
            project, or fork and build something similar.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="mb-6 text-xs font-medium uppercase tracking-widest text-white/40">
          Contact
        </h2>
        <div className="space-y-2 text-white/70">
          <p>
            
              href={`mailto:${CONTACT_EMAIL}`}
              className="transition hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>
            <Link
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
            >
              LinkedIn →
            </Link>
          </p>
          <p>
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
            >
              GitHub →
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/5 py-8">
        <div className="mx-auto max-w-4xl px-6 text-xs text-white/40">
          <p>
            Built by Mattia Garello — solo dev, still finishing university.
            Skopos runs on servers I pay for; use it at your own risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
