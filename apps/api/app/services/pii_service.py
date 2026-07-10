import re

# Pattern PII comuni
PII_PATTERNS = [
    # Email
    (re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'), "[EMAIL]"),
    # Carte di credito (Visa, MC, Amex, ecc.)
    (re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b'), "[CARD]"),
    # API keys generiche (32+ caratteri hex)
    (re.compile(r'\b[a-f0-9]{32,64}\b'), "[API_KEY]"),
    # Bearer token
    (re.compile(r'Bearer\s+[A-Za-z0-9\-_\.]+'), "Bearer [TOKEN]"),
    # Password in query string o JSON
    (re.compile(r'(?i)(password|passwd|pwd|secret|token)(["\s:=]+)[^\s"&,}{]{4,}'), r'\1\2[REDACTED]'),
    # IPv4
    (re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'), "[IP]"),
    # Numeri di telefono internazionali
    (re.compile(r'\+?[0-9]{1,3}[\s\-]?\(?[0-9]{1,4}\)?[\s\-]?[0-9]{3,4}[\s\-]?[0-9]{3,4}'), "[PHONE]"),
    # SSN (formato USA)
    (re.compile(r'\b\d{3}-\d{2}-\d{4}\b'), "[SSN]"),
]

def redact_pii(text: str) -> str:
    """Applica tutti i pattern PII al testo e ritorna la versione mascherata."""
    for pattern, replacement in PII_PATTERNS:
        text = pattern.sub(replacement, text)
    return text

def redact_dict(data: dict) -> dict:
    """Applica PII redaction ricorsivamente a tutti i valori stringa di un dict."""
    result = {}
    for k, v in data.items():
        if isinstance(v, str):
            result[k] = redact_pii(v)
        elif isinstance(v, dict):
            result[k] = redact_dict(v)
        elif isinstance(v, list):
            result[k] = [redact_pii(i) if isinstance(i, str) else i for i in v]
        else:
            result[k] = v
    return result
