"use client";

import { useEffect, useRef, useState } from "react";
import { useProjects } from "@/components/ProjectContext";
import ReactMarkdown from "react-markdown";

const INTER = { fontFamily: "'Inter', sans-serif" };

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Usage {
  plan: string;
  messages_today: number;
  messages_limit_per_day: number;
  tokens_this_month: number;
  tokens_limit_per_month: number;
}

export default function ChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { activeProject } = useProjects();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  // Carica usage all'apertura
  useEffect(() => {
    if (!open) return;
    const token = localStorage.getItem("skopos_access_token") ?? "";
    fetch(`${apiUrl}/v1/ai/chat/usage`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
    // Carica chat history per il progetto
    if (activeProject?.id) {
      const saved = localStorage.getItem(`skopos_chat_${activeProject.id}`);
      if (saved) {
        try { setMessages(JSON.parse(saved)); } catch {}
      } else {
        setMessages([]);
      }
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, activeProject?.id, apiUrl]);

  // Persistenza chat in localStorage
  useEffect(() => {
    if (!activeProject?.id) return;
    if (messages.length === 0) return;
    localStorage.setItem(`skopos_chat_${activeProject.id}`, JSON.stringify(messages));
  }, [messages, activeProject?.id]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // ESC chiude
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function sendMessage() {
    if (!input.trim() || loading || !activeProject?.id) return;
    setError(null);
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("skopos_access_token") ?? "";
      const res = await fetch(`${apiUrl}/v1/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ project_id: activeProject.id, messages: newMessages }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setError(errBody.detail || "Limite raggiunto");
        } else {
          setError(errBody.detail || `Errore ${res.status}`);
        }
        setMessages(messages); // rollback
        return;
      }
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.text }]);
      if (data.usage) {
        setUsage((u) => u ? { ...u, messages_today: data.usage.messages_today } : null);
      }
    } catch (e) {
      setError("Errore di connessione");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    if (!activeProject?.id) return;
    if (!confirm("Cancellare la conversazione?")) return;
    setMessages([]);
    localStorage.removeItem(`skopos_chat_${activeProject.id}`);
  }

  if (!open) return null;

  const pct = usage ? Math.round((usage.messages_today / Math.max(usage.messages_limit_per_day, 1)) * 100) : 0;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 998,
        animation: "fadeIn 0.15s ease",
      }} />
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>

      {/* Drawer */}
      <aside style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)",
        backgroundColor: "#0a0a0a", borderLeft: "1px solid #1a1a1a", zIndex: 999,
        display: "flex", flexDirection: "column",
        animation: "slideIn 0.2s ease",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 600 }}>✨ Ask AI</span>
            {activeProject && (
              <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4" }}>· {activeProject.name}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {messages.length > 0 && (
              <button onClick={clearChat} style={{ ...INTER, fontSize: "11px", color: "#a0aab4", background: "none", border: "none", cursor: "pointer" }}>Clear</button>
            )}
            <button onClick={onClose} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* Usage bar */}
        {usage && (
          <div style={{ padding: "10px 18px", borderBottom: "1px solid #111", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <div style={{ flex: 1, height: "4px", backgroundColor: "#1a1a1a", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: pct > 80 ? "#fbbf24" : "#4ade80", transition: "width 0.3s" }} />
            </div>
            <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4" }}>{usage.messages_today}/{usage.messages_limit_per_day} today · {usage.plan}</span>
          </div>
        )}

        {/* Messaggi */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {messages.length === 0 && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: "#a0aab4", marginTop: "20px" }}>
              <p style={{ ...INTER, fontSize: "13px", margin: 0 }}>Fai una domanda sui log del progetto. Esempi:</p>
              {[
                "Quali sono i 3 errori più gravi di oggi?",
                "Cosa sta causando il DB pool exhausted?",
                "C'è un trend negli errori nelle ultime ore?",
              ].map((s) => (
                <button key={s} onClick={() => setInput(s)} style={{ ...INTER, textAlign: "left", fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "6px", padding: "10px 12px", cursor: "pointer" }}>{s}</button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                ...INTER,
                fontSize: "13px",
                lineHeight: 1.6,
                color: "#e6edf3",
                backgroundColor: m.role === "user" ? "rgba(74,222,128,0.08)" : "#111",
                border: m.role === "user" ? "1px solid rgba(74,222,128,0.2)" : "1px solid #1a1a1a",
                borderRadius: "10px",
                padding: "10px 14px",
                maxWidth: "85%",
                wordBreak: "break-word",
              }}>
                {m.role === "user" ? (
                  <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ margin: "0 0 8px 0", lastChild: "none" } as any}>{children}</p>,
                      strong: ({ children }) => <strong style={{ color: "#e6edf3", fontWeight: 600 }}>{children}</strong>,
                      em: ({ children }) => <em style={{ color: "#a0aab4" }}>{children}</em>,
                      h1: ({ children }) => <h1 style={{ color: "#e6edf3", fontSize: "15px", fontWeight: 700, margin: "12px 0 6px" }}>{children}</h1>,
                      h2: ({ children }) => <h2 style={{ color: "#e6edf3", fontSize: "14px", fontWeight: 700, margin: "12px 0 6px", borderBottom: "1px solid #1a1a1a", paddingBottom: "4px" }}>{children}</h2>,
                      h3: ({ children }) => <h3 style={{ color: "#e6edf3", fontSize: "13px", fontWeight: 600, margin: "10px 0 4px" }}>{children}</h3>,
                      ul: ({ children }) => <ul style={{ margin: "4px 0 8px 0", paddingLeft: "16px" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ margin: "4px 0 8px 0", paddingLeft: "16px" }}>{children}</ol>,
                      li: ({ children }) => <li style={{ margin: "3px 0", color: "#c9d1d9" }}>{children}</li>,
                      code: ({ inline, children }: any) => inline ? (
                        <code style={{ backgroundColor: "#1a1a2e", color: "#4ade80", padding: "1px 5px", borderRadius: "3px", fontSize: "12px", fontFamily: "monospace" }}>{children}</code>
                      ) : (
                        <pre style={{ backgroundColor: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: "6px", padding: "10px 12px", overflowX: "auto", margin: "8px 0" }}>
                          <code style={{ color: "#4ade80", fontSize: "12px", fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace", whiteSpace: "pre" }}>{children}</code>
                        </pre>
                      ),
                      blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid #4ade80", paddingLeft: "10px", margin: "8px 0", color: "#a0aab4" }}>{children}</blockquote>,
                      hr: () => <hr style={{ border: "none", borderTop: "1px solid #1a1a1a", margin: "10px 0" }} />,
                      table: ({ children }) => <table style={{ borderCollapse: "collapse", width: "100%", margin: "8px 0", fontSize: "12px" }}>{children}</table>,
                      th: ({ children }) => <th style={{ padding: "6px 10px", borderBottom: "1px solid #1a1a1a", color: "#e6edf3", textAlign: "left", fontWeight: 600 }}>{children}</th>,
                      td: ({ children }) => <td style={{ padding: "6px 10px", borderBottom: "1px solid #111", color: "#a0aab4" }}>{children}</td>,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ ...INTER, fontSize: "12px", color: "#a0aab4", padding: "0 4px" }}>thinking...</div>
          )}
          {error && (
            <div style={{ ...INTER, fontSize: "12px", color: "#f87171", padding: "10px 12px", backgroundColor: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "6px" }}>{error}</div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "14px 18px", borderTop: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Chiedi qualcosa sui log..."
              rows={1}
              style={{
                ...INTER, flex: 1, resize: "none", backgroundColor: "#000", border: "1px solid #1a1a1a",
                color: "#e6edf3", fontSize: "13px", borderRadius: "6px", padding: "10px 12px", outline: "none",
                maxHeight: "120px",
              }}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
              ...INTER, backgroundColor: loading || !input.trim() ? "#2a2a2a" : "#4ade80",
              color: "#000", fontSize: "12px", fontWeight: 700, borderRadius: "6px",
              padding: "10px 14px", border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            }}>Send</button>
          </div>
        </div>
      </aside>
    </>
  );
}
