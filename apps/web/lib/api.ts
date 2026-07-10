// Il JWT viene gestito automaticamente via cookie HttpOnly
// Non è più necessario leggerlo da localStorage

export function getAuthHeaders(): HeadersInit {
    const apiKey = typeof window !== "undefined"
        ? localStorage.getItem("skopos_api_key")
        : null;

    if (apiKey) {
        return { "X-API-Key": apiKey, "Content-Type": "application/json" };
    }
    return { "Content-Type": "application/json" };
}

export function getAuthHeadersNoContent(): HeadersInit {
    const apiKey = typeof window !== "undefined"
        ? localStorage.getItem("skopos_api_key")
        : null;

    if (apiKey) {
        return { "X-API-Key": apiKey };
    }
    return {};
}

export function getApiKey(): string {
    return typeof window !== "undefined"
        ? (localStorage.getItem("skopos_api_key") ?? "")
        : "";
}

export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
