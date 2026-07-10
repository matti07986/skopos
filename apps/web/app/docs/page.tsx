"use client";

import { useState, useEffect } from "react";
import Logo from "@/components/ui/logo";

const INTER = { fontFamily: "'Inter', sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" };

const sections = ["Quick Start", "Node.js SDK", "Python SDK", "cURL", "API Reference", "Webhooks"];

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ position: "relative", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "6px", overflow: "hidden", marginTop: "12px", maxWidth: "100%", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid #1a1a1a" }}>
        <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em" }}>{language}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ ...INTER, fontSize: "10px", color: copied ? "#4ade80" : "#a0aab4", background: "none", border: "none", cursor: "pointer" }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre style={{ ...MONO, fontSize: "12px", color: "#e6edf3", padding: "16px", margin: 0, overflowX: "auto", lineHeight: 1.7, whiteSpace: "pre", wordBreak: "normal" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function DashboardLink() {
  const [isLogged, setIsLogged] = useState(false);
  useEffect(() => {
    setIsLogged(typeof window !== "undefined" && !!localStorage.getItem("skopos_api_key"));
  }, []);
  return (
    <a href={isLogged ? "/projects" : "/login"} style={{ ...INTER, color: "#a0aab4", fontSize: "11px", textDecoration: "none" }}>
      {isLogged ? "Dashboard →" : "Sign in →"}
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "40px", borderBottom: "1px solid #111" }}>
      <h2 style={{ ...INTER, fontSize: "16px", color: "#e6edf3", fontWeight: 600, margin: 0 }}>{title}</h2>
      {children}
    </div>
  );
}

function Param({ name, type, required, desc }: { name: string; type: string; required?: boolean; desc: string }) {
  return (
    <div style={{ display: "flex", gap: "12px", padding: "12px 0", borderBottom: "1px solid #0f0f0f", ...INTER }}>
      <div style={{ minWidth: "140px", display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ ...MONO, fontSize: "12px", color: "#4ade80" }}>{name}</span>
        {required && <span style={{ ...INTER, fontSize: "9px", color: "#f87171", fontWeight: 700 }}>required</span>}
      </div>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#a0aab4", minWidth: "80px" }}>{type}</span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#a0aab4" }}>{desc}</span>
    </div>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("Quick Start");
  const [apiKey, setApiKey] = useState("YOUR_API_KEY");

  useEffect(() => {
    const key = localStorage.getItem("skopos_api_key");
    if (key) setApiKey(key);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, borderBottom: "1px solid #111", backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", height: "48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Logo size={24} />
            <span style={{ ...INTER, color: "#fff", fontSize: "13px", fontWeight: 600, letterSpacing: "-0.2px" }}>skopos</span>
            <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>/</span>
            <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>docs</span>
          </div>
          <DashboardLink />
        </div>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "72px 24px 60px", display: "flex", gap: "48px" }}>

        {/* Sidebar */}
        <div style={{ width: "180px", flexShrink: 0, position: "sticky", top: "80px", height: "fit-content" }}>
          <p style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Contents</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {sections.map(s => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                style={{
                  ...INTER, fontSize: "12px", textAlign: "left", padding: "6px 10px", borderRadius: "5px",
                  color: activeSection === s ? "#4ade80" : "#a0aab4",
                  backgroundColor: activeSection === s ? "rgba(74,222,128,0.08)" : "transparent",
                  border: "none", cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "40px" }}>

          {activeSection === "Quick Start" && (
            <Section title="Quick Start">
              <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", lineHeight: 1.8 }}>
                Skopos collects logs from your app via HTTP. Send log events to our ingest endpoint using your project API key.
              </p>
              <div>
                <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", marginBottom: "4px" }}>1. Get your project API key from the dashboard</p>
                <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", marginBottom: "4px" }}>2. Send your first log event</p>
                <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>3. View it in the Logs tab</p>
              </div>
              <CodeBlock language="bash" code={`curl -X POST https://api.skopos.ink/v1/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '[{
    "level": "ERROR",
    "message": "Database connection failed",
    "service": "api",
    "event_metadata": { "db": "postgres", "retry": 3 }
  }]'`} />
              <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "16px" }}>
                <p style={{ ...INTER, fontSize: "11px", color: "#4ade80", fontWeight: 600, margin: "0 0 8px 0" }}>Your API Key</p>
                <code style={{ ...MONO, fontSize: "12px", color: "#e6edf3" }}>{apiKey}</code>
              </div>
            </Section>
          )}

          {activeSection === "Node.js SDK" && (
            <Section title="Node.js SDK">
              <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", lineHeight: 1.8 }}>Install and use Skopos in your Node.js or TypeScript project.</p>
              <CodeBlock language="bash" code="npm install axios" />
              <CodeBlock language="typescript" code={`import axios from 'axios';

const skopos = axios.create({
  baseURL: 'https://api.skopos.ink/v1',
  headers: { 'X-API-Key': '${apiKey}' },
});

// Send a single log
await skopos.post('/ingest', [{
  level: 'ERROR',
  message: 'Payment failed',
  service: 'checkout',
  event_metadata: { user_id: '123', amount: 99.99 },
}]);

// Helper function
async function log(level: string, message: string, service: string, metadata = {}) {
  try {
    await skopos.post('/ingest', [{ level, message, service, event_metadata: metadata }]);
  } catch (e) {
    console.error('Skopos error:', e);
  }
}

// Usage
await log('ERROR', 'Stripe webhook failed', 'payments', { event_id: 'evt_123' });
await log('WARN', 'High memory usage', 'worker', { usage_mb: 512 });
await log('INFO', 'User signed up', 'auth', { email: 'user@example.com' });`} />
              <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", lineHeight: 1.8 }}>
                You can also use <code style={{ ...MONO, fontSize: "11px", color: "#4ade80" }}>fetch</code> directly without any dependencies.
              </p>
              <CodeBlock language="typescript" code={`// Using native fetch (Node 18+)
await fetch('https://api.skopos.ink/v1/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': '${apiKey}',
  },
  body: JSON.stringify([{
    level: 'ERROR',
    message: 'Something went wrong',
    service: 'api',
  }]),
});`} />
            </Section>
          )}

          {activeSection === "Python SDK" && (
            <Section title="Python SDK">
              <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", lineHeight: 1.8 }}>Use Skopos in your Python project with the requests library.</p>
              <CodeBlock language="bash" code="pip install requests" />
              <CodeBlock language="python" code={`import requests

NOVATRACE_URL = "https://api.skopos.ink/v1/ingest"
NOVATRACE_KEY = "${apiKey}"

def log(level: str, message: str, service: str, metadata: dict = {}):
    try:
        requests.post(
            NOVATRACE_URL,
            json=[{
                "level": level,
                "message": message,
                "service": service,
                "event_metadata": metadata,
            }],
            headers={"X-API-Key": NOVATRACE_KEY},
            timeout=5,
        )
    except Exception as e:
        print(f"Skopos error: {e}")

# Usage
log("ERROR", "Database query failed", "api", {"query": "SELECT *", "duration_ms": 5000})
log("WARN", "Cache miss rate high", "cache", {"rate": 0.85})
log("INFO", "Job completed", "worker", {"job_id": "abc123", "duration_s": 12})`} />
              <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", lineHeight: 1.8 }}>
                For async Python (FastAPI, aiohttp), use <code style={{ ...MONO, fontSize: "11px", color: "#4ade80" }}>httpx</code>:
              </p>
              <CodeBlock language="python" code={`import httpx

async def log(level: str, message: str, service: str, metadata: dict = {}):
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.skopos.ink/v1/ingest",
            json=[{"level": level, "message": message, "service": service, "event_metadata": metadata}],
            headers={"X-API-Key": "${apiKey}"},
            timeout=5,
        )`} />
            </Section>
          )}

          {activeSection === "cURL" && (
            <Section title="cURL Examples">
              <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", lineHeight: 1.8 }}>Use cURL to send logs from any environment — shell scripts, CI/CD pipelines, or any language.</p>
              <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", fontWeight: 500 }}>Single log event</p>
              <CodeBlock language="bash" code={`curl -X POST https://api.skopos.ink/v1/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '[{"level":"ERROR","message":"Deploy failed","service":"ci","event_metadata":{"commit":"abc123"}}]'`} />
              <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", fontWeight: 500 }}>Batch of events</p>
              <CodeBlock language="bash" code={`curl -X POST https://api.skopos.ink/v1/ingest \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '[
    {"level":"ERROR","message":"Payment failed","service":"checkout"},
    {"level":"WARN","message":"Retry attempt 2","service":"checkout"},
    {"level":"INFO","message":"Payment succeeded on retry","service":"checkout"}
  ]'`} />
              <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", fontWeight: 500 }}>From a shell script</p>
              <CodeBlock language="bash" code={`#!/bin/bash
NOVATRACE_KEY="${apiKey}"

function skopos_log() {
  local level="$1"
  local message="$2"
  local service="$3"
  
  curl -s -X POST https://api.skopos.ink/v1/ingest \\
    -H "Content-Type: application/json" \\
    -H "X-API-Key: $NOVATRACE_KEY" \\
    -d "[{\\"level\\":\\"$level\\",\\"message\\":\\"$message\\",\\"service\\":\\"$service\\"}]"
}

# Usage
skopos_log "INFO" "Backup started" "backup-script"
# ... do backup ...
skopos_log "INFO" "Backup completed" "backup-script"`} />
            </Section>
          )}

          {activeSection === "API Reference" && (
            <Section title="API Reference">
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ ...INTER, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "3px", color: "#4ade80", backgroundColor: "rgba(74,222,128,0.1)" }}>POST</span>
                    <code style={{ ...MONO, fontSize: "13px", color: "#e6edf3" }}>/v1/ingest</code>
                  </div>
                  <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", marginBottom: "12px" }}>Ingest one or more log events. Authenticate with your project API key via <code style={{ ...MONO, fontSize: "11px", color: "#4ade80" }}>X-API-Key</code> header.</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Body (array of events)</p>
                  <Param name="level" type="string" required desc="ERROR | WARN | INFO | DEBUG" />
                  <Param name="message" type="string" required desc="Log message (max 10,000 chars)" />
                  <Param name="service" type="string" required desc="Service name (max 100 chars)" />
                  <Param name="event_metadata" type="object" desc="Optional JSON metadata (max 50KB)" />
                  <Param name="timestamp" type="string" desc="ISO 8601 timestamp. Defaults to now." />
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ ...INTER, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "3px", color: "#60a5fa", backgroundColor: "rgba(96,165,250,0.1)" }}>GET</span>
                    <code style={{ ...MONO, fontSize: "13px", color: "#e6edf3" }}>/v1/logs</code>
                  </div>
                  <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", marginBottom: "12px" }}>List log events for your projects. Authenticate with your user JWT token.</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Query params</p>
                  <Param name="level" type="string" desc="Filter by level: ERROR | WARN | INFO | DEBUG" />
                  <Param name="service" type="string" desc="Filter by service name" />
                  <Param name="limit" type="integer" desc="Max results (1-1000, default 100)" />
                  <Param name="offset" type="integer" desc="Pagination offset (default 0)" />
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <span style={{ ...INTER, fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "3px", color: "#60a5fa", backgroundColor: "rgba(96,165,250,0.1)" }}>GET</span>
                    <code style={{ ...MONO, fontSize: "13px", color: "#e6edf3" }}>/v1/insights</code>
                  </div>
                  <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>List AI-generated insights for recurring error patterns in your logs.</p>
                </div>

                <div>
                  <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>HTTP Status Codes</p>
                  {[
                    { code: "202", desc: "Accepted — events queued successfully" },
                    { code: "400", desc: "Bad Request — invalid payload" },
                    { code: "401", desc: "Unauthorized — invalid or missing API key" },
                    { code: "403", desc: "Forbidden — plan limit reached" },
                    { code: "429", desc: "Too Many Requests — rate limit exceeded" },
                  ].map(({ code, desc }) => (
                    <div key={code} style={{ display: "flex", gap: "16px", padding: "10px 0", borderBottom: "1px solid #0f0f0f", ...INTER }}>
                      <span style={{ ...INTER, fontSize: "12px", fontWeight: 700, color: code.startsWith("2") ? "#4ade80" : "#f87171", minWidth: "40px" }}>{code}</span>
                      <span style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>{desc}</span>
                    </div>
                  ))}
                </div>

              </div>
            </Section>
          )}

          {activeSection === "Webhooks" && (
            <Section title="Webhooks">
              <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", lineHeight: 1.8 }}>
                Skopos can notify your systems when alert rules are triggered. Configure a Slack webhook or email in the Settings page.
              </p>

              <div>
                <p style={{ ...INTER, fontSize: "14px", color: "#e6edf3", fontWeight: 500, marginBottom: "8px" }}>Slack Webhooks</p>
                <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", marginBottom: "12px", lineHeight: 1.8 }}>
                  Create an incoming webhook in your Slack workspace and paste the URL in Settings. Skopos will send a message when an alert fires.
                </p>
                <CodeBlock language="json" code={`// Payload sent to your Slack webhook
{
  "text": "[Skopos] High error rate: 42 ERROR events in 60s"
}`} />
              </div>

              <div>
                <p style={{ ...INTER, fontSize: "14px", color: "#e6edf3", fontWeight: 500, marginBottom: "8px" }}>Email Alerts</p>
                <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", lineHeight: 1.8 }}>
                  Enter your email as the destination for an alert rule. You will receive a branded email with the alert details, count, and a link to your dashboard.
                </p>
              </div>

              <div>
                <p style={{ ...INTER, fontSize: "14px", color: "#e6edf3", fontWeight: 500, marginBottom: "8px" }}>Alert Rule Example</p>
                <CodeBlock language="json" code={`// Create an alert rule via API
POST /v1/alerts
Authorization: Bearer YOUR_JWT_TOKEN

{
  "name": "High error rate",
  "level": "ERROR",
  "threshold": 10,
  "window_seconds": 60,
  "channel": "slack",
  "destination": "https://hooks.slack.com/services/..."
}`} />
              </div>

              <div>
                <p style={{ ...INTER, fontSize: "14px", color: "#e6edf3", fontWeight: 500, marginBottom: "8px" }}>Custom Webhook</p>
                <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", marginBottom: "12px", lineHeight: 1.8 }}>
                  Enter any HTTPS URL as destination. Skopos will POST a signed JSON payload to your endpoint. Verify the signature using the secret shown in Settings.
                </p>
                <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Request Headers</p>
                <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "12px 16px", marginBottom: "12px" }}>
                  {[
                    { k: "Content-Type", v: "application/json" },
                    { k: "X-Skopos-Signature", v: "sha256=<hmac_signature>" },
                    { k: "X-Skopos-Event", v: "alert.triggered" },
                    { k: "User-Agent", v: "Skopos-Webhook/1.0" },
                  ].map(({ k, v }) => (
                    <div key={k} style={{ display: "flex", gap: "12px", padding: "4px 0" }}>
                      <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#4ade80", minWidth: "220px" }}>{k}</code>
                      <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "#a0aab4" }}>{v}</code>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}
