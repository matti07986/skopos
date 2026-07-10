import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Configurable via env vars ────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:8000';
const API_KEY  = __ENV.API_KEY  || '';
const PROJECT  = __ENV.PROJECT  || '';

// Custom metrics for per-endpoint breakdown
const healthLatency  = new Trend('latency_health',  true);
const meLatency      = new Trend('latency_me',      true);
const projectsLat    = new Trend('latency_projects', true);
const metricsLatency = new Trend('latency_metrics', true);
const errorRate      = new Rate('errors_total');

export const options = {
  // ── Ramp profile: 0 → 100 → 500 → 1000 VU over ~5 min ──────────────
  stages: [
    { duration: '30s', target: 100  },   // ramp-up 100
    { duration: '30s', target: 100  },   // hold 100
    { duration: '60s', target: 500  },   // ramp 500
    { duration: '60s', target: 500  },   // hold 500
    { duration: '60s', target: 1000 },   // ramp 1000 (the real test)
    { duration: '60s', target: 1000 },   // hold 1000 for 1 min — peak load
    { duration: '30s', target: 0    },   // graceful ramp-down
  ],
  // ── Pass/fail thresholds ──────────────────────────────────────────
  thresholds: {
    'http_req_duration{stage:peak}': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.05'],   // less than 5% errors overall
    'errors_total':    ['rate<0.05'],
  },
};

const headers = { 'X-API-Key': API_KEY };

export default function () {
  const r = Math.random();
  let res;

  if (r < 0.10) {
    // 10% → /health (warm-up, cheap)
    res = http.get(`${BASE_URL}/health`, { tags: { endpoint: 'health' } });
    healthLatency.add(res.timings.duration);
  } else if (r < 0.30) {
    // 20% → /v1/auth/me (cheap auth check)
    res = http.get(`${BASE_URL}/v1/auth/me`, { headers, tags: { endpoint: 'me' } });
    meLatency.add(res.timings.duration);
  } else if (r < 0.50) {
    // 20% → /v1/projects (list user's projects)
    res = http.get(`${BASE_URL}/v1/projects`, { headers, tags: { endpoint: 'projects' } });
    projectsLat.add(res.timings.duration);
  } else {
    // 50% → /v1/projects/.../metrics (the new heavy endpoint)
    const range = ['1h', '6h', '24h', '7d'][Math.floor(Math.random() * 4)];
    res = http.get(
      `${BASE_URL}/v1/projects/${PROJECT}/metrics?range=${range}`,
      { headers, tags: { endpoint: 'metrics' } }
    );
    metricsLatency.add(res.timings.duration);
  }

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
  });
  errorRate.add(!ok);

  // small think time to simulate human behavior (50-150ms)
  sleep(0.05 + Math.random() * 0.1);
}

export function handleSummary(data) {
  return {
    'tests/load/results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const m = data.metrics;
  const get = (k, sub='value') => (m[k] && m[k].values && m[k].values[sub]) || 0;
  return `
╔══════════════════════════════════════════════════════════════════╗
║                 SKOPOS LOAD TEST — RESULTS                        ║
╚══════════════════════════════════════════════════════════════════╝

  Requests total:       ${get('http_reqs', 'count').toFixed(0)}
  Requests/sec avg:     ${get('http_reqs', 'rate').toFixed(1)} rps
  Failed rate:          ${(get('http_req_failed', 'rate') * 100).toFixed(2)} %

  Latency overall:
    p50:                ${get('http_req_duration', 'med').toFixed(0)} ms
    p95:                ${get('http_req_duration', 'p(95)').toFixed(0)} ms
    p99:                ${get('http_req_duration', 'p(99)').toFixed(0)} ms
    max:                ${get('http_req_duration', 'max').toFixed(0)} ms

  Per endpoint (p95):
    /health             ${get('latency_health',  'p(95)').toFixed(0)} ms
    /v1/auth/me         ${get('latency_me',      'p(95)').toFixed(0)} ms
    /v1/projects        ${get('latency_projects','p(95)').toFixed(0)} ms
    /v1/.../metrics     ${get('latency_metrics', 'p(95)').toFixed(0)} ms

`;
}
