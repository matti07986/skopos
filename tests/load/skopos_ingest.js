import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL    = __ENV.BASE_URL    || 'http://127.0.0.1:8000';
const API_KEY     = __ENV.API_KEY     || '';
const BATCH_SIZE  = Number(__ENV.BATCH_SIZE || 10);

const ingestLatency = new Trend('ingest_latency', true);
const rate429       = new Rate('errors_429');
const rate5xx       = new Rate('errors_5xx');
const acceptedTotal = new Counter('events_accepted');

export const options = {
  // Business plan rate limit = 10k req/min = 166 req/s.
  // We ramp up to ~150 req/s to stay just under and stress the pipeline.
  // With BATCH_SIZE=10 events/req → peak ~1500 events/s into the stream.
  stages: [
    { duration: '30s', target: 30  },   // warmup, 30 req/s = 300 events/s
    { duration: '60s', target: 80  },   // medium, 80 req/s = 800 events/s
    { duration: '60s', target: 150 },   // peak, 150 req/s = 1500 events/s
    { duration: '30s', target: 0   },   // ramp-down, drain
  ],
  thresholds: {
    'http_req_failed':   ['rate<0.05'],
    'http_req_duration': ['p(95)<2000'],
  },
};

const LEVELS   = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'];   // realistic distribution
const SERVICES = ['api', 'worker', 'auth', 'billing', 'web'];
const MESSAGES = {
  INFO:  ['Request completed', 'User logged in', 'Job processed', 'Cache hit'],
  WARN:  ['Slow query detected', 'Cache miss rate elevated', 'Retry needed'],
  ERROR: ['Database connection failed', 'Timeout on upstream', 'Auth token expired'],
  DEBUG: ['SQL: SELECT...', 'Cache key set'],
};

function randomEvent() {
  const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];
  const service = SERVICES[Math.floor(Math.random() * SERVICES.length)];
  const messages = MESSAGES[level] || MESSAGES.INFO;
  const message = messages[Math.floor(Math.random() * messages.length)];
  return {
    level,
    service,
    message: `${message} (vu=${__VU}, iter=${__ITER})`,
    event_metadata: {
      latency_ms: Math.floor(50 + Math.random() * 500),
      request_id: `req_${__VU}_${__ITER}_${Math.random().toString(36).slice(2, 8)}`,
    },
  };
}

const headers = { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' };

export default function () {
  const batch = Array.from({ length: BATCH_SIZE }, randomEvent);
  const res = http.post(`${BASE_URL}/v1/ingest`, JSON.stringify(batch), { headers });

  ingestLatency.add(res.timings.duration);
  rate429.add(res.status === 429);
  rate5xx.add(res.status >= 500);

  if (res.status === 202) acceptedTotal.add(BATCH_SIZE);

  check(res, { 'status 202': r => r.status === 202 });
  sleep(0.01);
}

export function handleSummary(data) {
  const m = data.metrics;
  const get = function(k, sub) {
    sub = sub || 'value';
    if (!m[k] || !m[k].values) return 0;
    var v = m[k].values[sub];
    return (v === undefined || v === null) ? 0 : v;
  };
  const summary = `
╔══════════════════════════════════════════════════════════════════╗
║              SKOPOS INGEST LOAD TEST — RESULTS                    ║
╚══════════════════════════════════════════════════════════════════╝

  Requests total:         ${get('http_reqs', 'count').toFixed(0)}
  Events accepted total:  ${get('events_accepted', 'count').toFixed(0)}
  Avg req/sec:            ${get('http_reqs', 'rate').toFixed(1)} rps
  Avg events/sec:         ${(get('events_accepted', 'count') / (get('iteration_duration', 'avg') / 1000 * get('vus_max', 'max')) || 0).toFixed(0)} eps

  Status code distribution:
    202 (accepted):       ${((1 - get('http_req_failed', 'rate')) * 100).toFixed(2)} %
    4xx (rate-limit etc): ${(get('errors_429', 'rate') * 100).toFixed(2)} %
    5xx (server error):   ${(get('errors_5xx', 'rate') * 100).toFixed(2)} %

  Latency on /v1/ingest:
    p50:                  ${get('http_req_duration', 'med').toFixed(0)} ms
    p95:                  ${get('http_req_duration', 'p(95)').toFixed(0)} ms
    p99:                  ${get('http_req_duration', 'p(99)').toFixed(0)} ms
    max:                  ${get('http_req_duration', 'max').toFixed(0)} ms

`;
  return {
    'tests/load/ingest-results.json': JSON.stringify(data, null, 2),
    stdout: summary,
  };
}
