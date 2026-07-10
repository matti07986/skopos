import threading
import time
from datetime import datetime, timezone
from typing import Optional
import urllib.request
import urllib.error
import json

DEFAULT_ENDPOINT = "https://api.skopos.ink/v1/ingest"
BATCH_INTERVAL = 2.0
MAX_BATCH_SIZE = 100


class Skopos:
    def __init__(self, api_key: str, service: str, endpoint: str = DEFAULT_ENDPOINT):
        self.api_key = api_key
        self.service = service
        self.endpoint = endpoint
        self._queue: list[dict] = []
        self._lock = threading.Lock()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def _run(self):
        while True:
            time.sleep(BATCH_INTERVAL)
            self.flush()

    def _push(self, level: str, message: str, metadata: dict):
        event = {
            "level": level,
            "message": message,
            "service": self.service,
            "event_metadata": metadata,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        with self._lock:
            self._queue.append(event)
            if len(self._queue) >= MAX_BATCH_SIZE:
                self.flush()

    def flush(self):
        with self._lock:
            if not self._queue:
                return
            batch = self._queue[:MAX_BATCH_SIZE]
            self._queue = self._queue[MAX_BATCH_SIZE:]
        try:
            data = json.dumps(batch).encode()
            req = urllib.request.Request(
                self.endpoint,
                data=data,
                headers={"Content-Type": "application/json", "X-API-Key": self.api_key},
                method="POST",
            )
            urllib.request.urlopen(req, timeout=5)
        except Exception:
            pass

    def error(self, message: str, **metadata): self._push("ERROR", message, metadata)
    def warn(self,  message: str, **metadata): self._push("WARN",  message, metadata)
    def info(self,  message: str, **metadata): self._push("INFO",  message, metadata)
    def debug(self, message: str, **metadata): self._push("DEBUG", message, metadata)
