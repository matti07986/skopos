const DEFAULT_ENDPOINT = "https://api.skopos.ink/v1/ingest";
const BATCH_INTERVAL_MS = 2000;
const MAX_BATCH_SIZE = 100;

type Level = "ERROR" | "WARN" | "INFO" | "DEBUG";

interface LogEvent {
  level: Level;
  message: string;
  service: string;
  event_metadata?: Record<string, unknown>;
  timestamp?: string;
}

interface SkoposOptions {
  apiKey: string;
  service: string;
  endpoint?: string;
}

export class Skopos {
  private apiKey: string;
  private service: string;
  private endpoint: string;
  private queue: LogEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor({ apiKey, service, endpoint = DEFAULT_ENDPOINT }: SkoposOptions) {
    this.apiKey = apiKey;
    this.service = service;
    this.endpoint = endpoint;
    this.timer = setInterval(() => this.flush(), BATCH_INTERVAL_MS);
  }

  private push(level: Level, message: string, metadata?: Record<string, unknown>) {
    this.queue.push({
      level,
      message,
      service: this.service,
      event_metadata: metadata ?? {},
      timestamp: new Date().toISOString(),
    });
    if (this.queue.length >= MAX_BATCH_SIZE) this.flush();
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch = this.queue.splice(0, MAX_BATCH_SIZE);
    try {
      await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": this.apiKey },
        body: JSON.stringify(batch),
      });
    } catch {
      // silently discard on network error
    }
  }

  error(message: string, metadata?: Record<string, unknown>) { this.push("ERROR", message, metadata); }
  warn(message: string, metadata?: Record<string, unknown>)  { this.push("WARN",  message, metadata); }
  info(message: string, metadata?: Record<string, unknown>)  { this.push("INFO",  message, metadata); }
  debug(message: string, metadata?: Record<string, unknown>) { this.push("DEBUG", message, metadata); }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.flush();
  }
}

export default Skopos;
