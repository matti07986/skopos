"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { getAuthHeadersNoContent } from "@/lib/api";

function useWindowWidth() {
  const [width, setWidth] = useState(() => typeof window !== "undefined" ? window.innerWidth : 1280);
  useEffect(() => {
    setWidth(window.innerWidth);
    function onResize() { setWidth(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}
import { useRouter, useSearchParams } from "next/navigation";
import { useProjects } from "@/components/ProjectContext";
import MetricCards from "@/components/MetricCards";
import { MetricsCharts } from "@/components/MetricsCharts";
import ChatDrawer from "@/components/ChatDrawer";
import { LogDeepAnalysis } from "@/components/LogDeepAnalysis";
import ErrorChart, { WarningChart } from "@/components/ErrorChart";
import LogStream from "@/components/LogStream";
import AiInsight from "@/components/AiInsight";
import Logo from "@/components/ui/logo";

const INTER = { fontFamily: "'Inter', sans-serif" };

type Tab = "overview" | "errors" | "warnings" | "logs" | "insights";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "errors",   label: "Errors" },
  { id: "warnings", label: "Warnings" },
  { id: "logs",     label: "Logs" },
  { id: "insights", label: "Insights" },
];

function LogsTabContent() {
  const [logs, setLogs] = useState<any[]>([]);
  const [focusedLog, setFocusedLog] = useState<any>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <LogStream onLogsChange={setLogs} />
      <LogDeepAnalysis logs={logs} focusedLog={focusedLog} />
    </div>
  );
}

function ProjectsPageInner() {
  const router = useRouter();
  const W = useWindowWidth();
  const isMobile = W < 480;
  const isTablet = W >= 768 && W < 1024;
  const { projects, activeProject, setActiveProject, refresh, loading: projectsLoading } = useProjects();

  const [dropdownOpen, setDropdown] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{id: string; name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [statusPageEnabled, setStatusPageEnabled] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [toast, setToast] = useState<{msg: string; url?: string} | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [name, setName]             = useState("");
  const [description, setDesc]      = useState("");
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateErr] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<{name: string; api_key: string; platform: string} | null>(null);
  const [platform, setPlatform] = useState<string>("nodejs");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json"|"csv"|"pdf">("pdf");
  const [exportLevel, setExportLevel] = useState<string>("");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    if (!activeProject) return;
    setExporting(true);
    try {
      const token = localStorage.getItem("skopos_access_token");
      const params = new URLSearchParams({ project_id: activeProject.id, format: exportFormat });
      if (exportLevel) params.append("level", exportLevel);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/logs/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skopos-${activeProject.name}-logs.${exportFormat === "pdf" ? "pdf" : exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportOpen(false);
    } catch (e) {
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as Tab | null;
  const [tab, setTabState] = useState<Tab>(tabParam ?? "overview");

  const setTab = (t: Tab) => {
    // Tab state is internal-only (no URL sync). The browser back button
    // is intercepted by the popstate effect below to keep the user
    // inside the dashboard — logout is the only legitimate exit.
    setTabState(t);
    // Push a synthetic history entry so 'back' from a non-overview tab
    // lands on overview rather than exiting the page.
    if (t !== "overview" && typeof window !== "undefined") {
      window.history.pushState({ skopos_dashboard: true, tab: t }, "");
    }
  };

  async function deleteProject(projectId: string) {
    setDeleting(true);
    try {
      const headers = getAuthHeadersNoContent();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects/${projectId}`, { method: "DELETE", headers, credentials: "include" });
      if (res.ok || res.status === 204) {
        if (activeProject?.id === projectId) setActiveProject(null as any);
        setDeleteModal(null);
        refresh();
        setTimeout(() => refresh(), 500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest("[data-dropdown]")) setDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // ── Back-button / back-gesture guard ─────────────────────────────
  // The dashboard is a "single-room" experience: users navigate between
  // tabs internally, but the browser back action is repurposed:
  //   - from a non-overview tab → returns to overview
  //   - from overview → re-pushes so the user can't accidentally exit
  // The only deliberate exit is via the explicit logout button.
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Anchor a synthetic entry so the first back press has somewhere to land.
    window.history.pushState({ skopos_dashboard: true }, "");
    const onPopState = () => {
      // Re-push to absorb the back, then collapse to overview.
      window.history.pushState({ skopos_dashboard: true }, "");
      setTabState("overview");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    function handleNavMenuClose(e: MouseEvent) {
      const d = document.getElementById("nav-dropdown");
      const btn = document.getElementById("nav-menu-btn");
      if (d && d.style.display === "flex") {
        if (!d.contains(e.target as Node) && !btn?.contains(e.target as Node)) {
          d.style.display = "none";
        }
      }
    }
    document.addEventListener("mousedown", handleNavMenuClose);
    return () => document.removeEventListener("mousedown", handleNavMenuClose);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateErr(null);
    try {
      const token = localStorage.getItem("skopos_access_token") ?? "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Failed to create project");
      const newProject = await res.json();
      setName(""); setDesc("");
      setCreatedProject({ name: newProject.name, api_key: newProject.api_key, platform });
      refresh();
    } catch (err) {
      setCreateErr(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    if (activeProject) {
      setStatusPageEnabled((activeProject as any).status_page_enabled ?? false);
    }
  }, [activeProject]);

  async function toggleShare() {
    if (!activeProject) return;
    if (shareToken) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects/${activeProject.id}/share`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("skopos_access_token")}` },
        credentials: "include",
      });
      setShareToken(null);
    } else {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects/${activeProject.id}/share`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("skopos_access_token")}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setShareToken(data.share_token);
        navigator.clipboard.writeText(data.share_url);
        setToast({ msg: "Share link copied!", url: data.share_url });
        setTimeout(() => setToast(null), 4000);
      }
    }
  }

  async function toggleStatusPage() {
    if (!activeProject) return;
    const newVal = !statusPageEnabled;
    setStatusPageEnabled(newVal);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects/${activeProject.id}/status-page`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("skopos_access_token")}` },
      credentials: "include",
      body: JSON.stringify({ enabled: newVal }),
    });
  }

  function copyApiKey() {
    if (!activeProject) return;
    navigator.clipboard.writeText(activeProject.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000000", ...INTER }} suppressHydrationWarning>

      {/* ── Top navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: "1px solid #111111",
        backgroundColor: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: isMobile ? "0 12px" : "0 24px", height: "48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Logo size={24} />
            <span style={{ color: "#ffffff", fontSize: "13px", fontWeight: 600, letterSpacing: "-0.2px" }}>skopos</span>
            <div style={{ width: "1px", height: "14px", backgroundColor: "#1e1e1e", margin: "0 6px" }} />
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <a
              href="/search"
              style={{ color: "#a0aab4", fontSize: "16px", textDecoration: "none", display: "flex", alignItems: "center", lineHeight: 1 }}
              title="Search logs"
            >
              🔍
            </a>
            {!isMobile && activeProject && <button
              onClick={() => setExportOpen(true)}
              style={{ color: "#a0aab4", fontSize: "11px", background: "none", border: "1px solid #1e1e1e", cursor: "pointer", padding: "5px 10px", borderRadius: "5px", ...INTER }}
              title="Export logs"
            >
              ↓ Export
            </button>}
            {!isMobile && <button
              onClick={() => setModalOpen(true)}
              style={{ backgroundColor: "#4ade80", color: "#000000", fontSize: "11px", fontWeight: 700, padding: "5px 12px", borderRadius: "5px", border: "none", cursor: "pointer", ...INTER }}
            >
              {"New Project"}
            </button>}
            {!isMobile && <button
              onClick={async () => {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/logout`, { method: "POST", credentials: "include" });
                localStorage.clear();
                router.push("/login");
              }}
              style={{ color: "#a0aab4", fontSize: "11px", background: "none", border: "none", cursor: "pointer", ...INTER }}
            >
              {"Sign out"}
            </button>}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => {
                  const d = document.getElementById("nav-dropdown");
                  if (d) d.style.display = d.style.display === "flex" ? "none" : "flex";
                }}
                id="nav-menu-btn" style={{ color: "#a0aab4", fontSize: "18px", background: "none", border: "none", cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", padding: "4px" }}
              >
                ☰
              </button>
              <div
                id="nav-dropdown"
                style={{
                  display: "none", flexDirection: "column",
                  position: "absolute", top: "32px", right: 0,
                  backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a",
                  borderRadius: "6px", minWidth: "140px", zIndex: 100,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => {
                    const d = document.getElementById("nav-dropdown");
                    if (d) d.style.display = "none";
                    setChatOpen(true);
                  }}
                  style={{
                    ...INTER, fontSize: "12px", color: "#4ade80", fontWeight: 600,
                    textDecoration: "none", padding: "10px 14px",
                    display: "block", textAlign: "left",
                    background: "none", border: "none", borderBottom: "1px solid #1a1a1a",
                    cursor: "pointer", width: "100%",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#111")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  {"✨ Ask AI"}
                </button>
                {[
                  { label: "Profile", href: "/profile" },
                  { label: "Team", href: "/team" },
                  { label: "Settings", href: "/settings" },
                  { label: "Docs", href: "/docs" },
                  { label: "Monitors", href: "/monitors" },
                ].map(item => (
                  <a
                    key={item.href}
                    href={item.href}
                    style={{
                      ...INTER, fontSize: "12px", color: "#e6edf3",
                      textDecoration: "none", padding: "10px 14px",
                      display: "block",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#111")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {item.label}
                  </a>
                ))}
                {activeProject && (
                  <div
                    onClick={toggleShare}
                    style={{ ...INTER, fontSize: "12px", color: shareToken ? "#60a5fa" : "#e6edf3", padding: "10px 14px", cursor: "pointer", borderTop: "1px solid #1a1a1a" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#111")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {shareToken ? "↗ Copy share link" : "Share dashboard"}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* ── Project selector + Tab bar ── */}
        <div style={{ borderTop: "1px solid #111111", maxWidth: "1280px", margin: "0 auto", padding: isMobile ? "0 0" : "0 24px", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: "0" }}>

          {/* Project dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginRight: isMobile ? "0" : "24px", padding: isMobile ? "6px 12px" : "0", borderBottom: isMobile ? "1px solid #111" : "none" }} data-dropdown>
          <div style={{ position: "relative", padding: "8px 0" }}>
            <button
              onClick={() => setDropdown(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a",
                color: "#e6edf3", fontSize: "11px", fontWeight: 500,
                padding: "5px 10px", borderRadius: "5px", cursor: "pointer",
                width: isMobile ? "100%" : "auto", minWidth: isMobile ? "0" : "160px", ...INTER,
              }}
            >
              <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {activeProject ? activeProject.name : "Select project…"}
              </span>
              <span style={{ color: "#a0aab4", fontSize: "9px" }}>▾</span>
            </button>
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "100%", left: 0, minWidth: "100%",
                backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a",
                borderRadius: "6px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                zIndex: 9999, marginTop: "2px", maxHeight: "108px", overflowY: "auto",
              }}>
                {projects.length === 0 ? (
                  <div style={{ padding: "10px 14px", fontSize: "11px", color: "#a0aab4", ...INTER }}>{"No projects yet"}</div>
                ) : projects.map((p: any) => (
                  <div
                    key={p.id}
                    style={{
                      display: "flex", alignItems: "center",
                      padding: "8px 14px", fontSize: "11px",
                      color: activeProject?.id === p.id ? "#4ade80" : "#e6edf3",
                      backgroundColor: activeProject?.id === p.id ? "rgba(74,222,128,0.05)" : "transparent",
                      ...INTER,
                    }}
                  >
                    <span
                      onClick={() => { setActiveProject(p); setDropdown(false); }}
                      style={{ flex: 1, cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {p.name}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDropdown(false); setDeleteModal({ id: p.id, name: p.name }); }}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#555e6b", fontSize: "14px", lineHeight: 1,
                        padding: "0 0 0 8px", flexShrink: 0,
                        display: "flex", alignItems: "center",
                      }}
                      title="Elimina progetto"
                    >−</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>

          {/* API key */}
          {activeProject && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginRight: "24px", padding: "8px 0" }}>
              <code style={{ fontSize: "10px", color: "#a0aab4", backgroundColor: "#0a0a0a", border: "1px solid #111111", borderRadius: "4px", padding: "3px 8px", letterSpacing: "2px" }}>
                ••••••••••••••••
              </code>
              <button
                onClick={copyApiKey}
                style={{ fontSize: "11px", color: "#e6edf3", backgroundColor: "transparent", border: "1px solid #333", borderRadius: "4px", padding: "4px 10px", cursor: "pointer", ...INTER }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {statusPageEnabled && (
                  <a
                    href={`https://skopos.ink/status/${activeProject?.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: "10px", color: "#4ade80", backgroundColor: "transparent", border: "1px solid rgba(74,222,128,0.3)", borderRadius: "4px", padding: "3px 8px", cursor: "pointer", ...INTER, whiteSpace: "nowrap", textDecoration: "none" }}
                  >
                    ● Status page ↗
                  </a>
                )}
                <button
                  onClick={toggleStatusPage}
                  style={{ fontSize: "11px", color: statusPageEnabled ? "#4ade80" : "#e6edf3", backgroundColor: "transparent", border: `1px solid ${statusPageEnabled ? "rgba(74,222,128,0.3)" : "#333"}`, borderRadius: "4px", padding: "4px 10px", cursor: "pointer", ...INTER }}
                  title={statusPageEnabled ? "Disable status page" : "Enable status page"}
                >
                  {statusPageEnabled ? "on" : "off"}
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          {activeProject && (
            <div style={{ display: "flex", alignItems: "center", gap: "0", marginLeft: isMobile ? "0" : "auto", overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none", flexShrink: 1, minWidth: 0, msOverflowStyle: "none", padding: isMobile ? "0 12px" : "0" }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    fontSize: "11px", fontWeight: 500, padding: "12px 14px",
                    color: tab === t.id ? "#e6edf3" : "#a0aab4",
                    backgroundColor: "transparent", border: "none", cursor: "pointer",
                    borderBottom: tab === t.id ? "2px solid #4ade80" : "2px solid transparent",
                    transition: "color 0.15s, border-color 0.15s",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    ...INTER,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <main style={{ paddingTop: isMobile ? "185px" : "128px" }}>
        {!activeProject ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "12px" }}>
            <p style={{ color: "#a0aab4", fontSize: "13px", ...INTER }}>Select a project to view your dashboard</p>
            <button onClick={() => setModalOpen(true)} style={{ color: "#4ade80", fontSize: "11px", background: "none", border: "none", cursor: "pointer", ...INTER }}>
              or create a new project →
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: isMobile ? "16px 12px 48px" : "24px 24px 48px" }}>
            {projectsLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
                <div style={{ width: "20px", height: "20px", border: "2px solid #222", borderTop: "2px solid #4ade80", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
            <div>

            {/* OVERVIEW */}
            {tab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {activeProject && <MetricsCharts projectId={activeProject.id} />}
                <MetricCards onTabChange={(t) => setTab(t as any)} />
                <div>
                  <span style={{ ...INTER, fontSize: "10px", color: "#7d8590", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.15em", display: "block", marginBottom: "12px" }}>
                    Recent activity
                  </span>
                  <LogStream onLogsChange={() => {}} />
                </div>
              </div>
            )}

            {/* ERRORS */}
            {tab === "errors" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <ErrorChart />

              </div>
            )}

            {/* WARNINGS */}
            {tab === "warnings" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <WarningChart />

              </div>
            )}

            {/* LOGS */}
            {tab === "logs" && (
              <LogsTabContent />
            )}

            {/* INSIGHTS */}
            {tab === "insights" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <span style={{ fontSize: "10px", color: "#a0aab4", fontWeight: 500, ...INTER, textTransform: "uppercase", letterSpacing: "0.1em" }}>SMART INSIGHTS</span>
                <AiInsight />
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", border: "1px solid #21262D", backgroundColor: "#0a0a0a", borderRadius: "6px", gap: "8px", textTransform: "none" }}>
                  <span style={{ fontSize: "13px", color: "#a0aab4", fontWeight: 400, ...INTER, textTransform: "none", letterSpacing: "normal" }}>No insights yet</span>
                  <span style={{ fontSize: "11px", color: "#a0aab4", fontWeight: 400, ...INTER, textTransform: "none", letterSpacing: "normal" }}>Insights are generated automatically from your logs</span>
                </div>
              </div>
            )}

            </div>
            )}
          </div>
        )}
      </main>

      {/* ── Create project modal ── */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
        >
          <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "10px", width: "100%", maxWidth: "360px", margin: "0 16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#e6edf3", ...INTER }}>{"New Project"}</span>
              <button onClick={() => setModalOpen(false)} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>×</button>
            </div>

            {createError && (
              <p style={{ fontSize: "11px", color: "#f87171", backgroundColor: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "5px", padding: "8px 12px", marginBottom: "16px", ...INTER }}>
                {createError}
              </p>
            )}

            {createdProject ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#4ade80", fontSize: "16px" }}>✓</span>
                  <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 600 }}>Project "{createdProject.name}" created!</span>
                </div>
                <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4", margin: 0 }}>Copy your API key and start sending logs.</p>
                <div>
                  <label style={{ fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", ...INTER }}>API Key</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "6px" }}>
                    <code style={{ flex: 1, backgroundColor: "#000", border: "1px solid #1a1a1a", color: "#4ade80", fontSize: "11px", borderRadius: "5px", padding: "8px 12px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{createdProject.api_key}</code>
                    <button onClick={() => navigator.clipboard.writeText(createdProject.api_key)} style={{ backgroundColor: "#1a1a1a", border: "1px solid #222", color: "#a0aab4", fontSize: "11px", borderRadius: "5px", padding: "8px 12px", cursor: "pointer", flexShrink: 0, ...INTER }}>Copy</button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", ...INTER }}>Install SDK</label>
                  <div style={{ backgroundColor: "#000", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "10px 12px", marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <code style={{ fontSize: "11px", color: "#e6edf3", fontFamily: "monospace" }}>{createdProject.platform === "python" ? "pip install skopos" : "npm install skopos"}</code>
                    <button onClick={() => navigator.clipboard.writeText(createdProject.platform === "python" ? "pip install skopos" : "npm install skopos")} style={{ backgroundColor: "transparent", border: "none", color: "#a0aab4", fontSize: "11px", cursor: "pointer", ...INTER }}>Copy</button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", ...INTER }}>Quick start</label>
                  <div style={{ backgroundColor: "#000", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "10px 12px", marginTop: "6px", position: "relative" }}>
                    <button onClick={() => navigator.clipboard.writeText(`import { createClient } from "skopos";
const logger = createClient({ apiKey: "${createdProject.api_key}", service: "my-service" });
logger.info("Hello Skopos!");`)} style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "transparent", border: "none", color: "#a0aab4", fontSize: "11px", cursor: "pointer", ...INTER }}>Copy</button>
                    <pre style={{ margin: 0, fontSize: "11px", color: "#e6edf3", fontFamily: "monospace", lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{`import { createClient } from "skopos";
const logger = createClient({
  apiKey: "${createdProject.api_key}",
  service: "my-service",
});
logger.info("Hello Skopos!");`}</pre>
                  </div>
                </div>
                <button onClick={() => { setCreatedProject(null); setModalOpen(false); }} style={{ backgroundColor: "#4ade80", color: "#000", fontSize: "12px", fontWeight: 700, borderRadius: "5px", padding: "10px", border: "none", cursor: "pointer", ...INTER }}>Go to dashboard →</button>
              </div>
            ) : (
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", ...INTER }}>Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="my project" required autoFocus
                  style={{ backgroundColor: "#000000", border: "1px solid #1a1a1a", color: "#e6edf3", fontSize: "13px", borderRadius: "5px", padding: "8px 12px", outline: "none", ...INTER }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", ...INTER }}>Platform</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[["nodejs", "Node.js"], ["python", "Python"], ["go", "Go"], ["ruby", "Ruby"], ["php", "PHP"], ["other", "Other"]].map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setPlatform(val)}
                      style={{ ...INTER, fontSize: "11px", padding: "5px 10px", borderRadius: "5px", cursor: "pointer", border: platform === val ? "1px solid #4ade80" : "1px solid #1a1a1a", backgroundColor: platform === val ? "rgba(74,222,128,0.1)" : "#000", color: platform === val ? "#4ade80" : "#a0aab4", fontWeight: platform === val ? 600 : 400 }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "10px", color: "#a0aab4", textTransform: "uppercase", letterSpacing: "0.1em", ...INTER }}>Description (optional)</label>
                <input
                  type="text" value={description} onChange={e => setDesc(e.target.value)}
                  placeholder="what is this project for?"
                  style={{ backgroundColor: "#000000", border: "1px solid #1a1a1a", color: "#e6edf3", fontSize: "13px", borderRadius: "5px", padding: "8px 12px", outline: "none", ...INTER }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button type="button" onClick={() => setModalOpen(false)}
                  style={{ flex: 1, border: "1px solid #1a1a1a", color: "#a0aab4", backgroundColor: "transparent", fontSize: "11px", fontWeight: 700, borderRadius: "5px", padding: "8px", cursor: "pointer", ...INTER }}>
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  style={{ flex: 1, backgroundColor: creating ? "#2a2a2a" : "#4ade80", color: "#000000", fontSize: "11px", fontWeight: 700, borderRadius: "5px", padding: "8px", border: "none", cursor: creating ? "not-allowed" : "pointer", ...INTER }}>
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 999,
          backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a",
          borderRadius: "8px", padding: "14px 18px", maxWidth: "320px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column", gap: "8px",
          animation: "fadeIn 0.2s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#4ade80", fontSize: "14px" }}>✓</span>
              <span style={{ ...INTER, fontSize: "13px", color: "#e6edf3", fontWeight: 500 }}>{toast.msg}</span>
            </div>
            <button onClick={() => setToast(null)} style={{ color: "#a0aab4", background: "none", border: "none", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>
          </div>
          {toast.url && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <code style={{ fontFamily: "monospace", fontSize: "10px", color: "#60a5fa", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "4px 8px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {toast.url}
              </code>
              <a href={toast.url} target="_blank" rel="noopener noreferrer" style={{ ...INTER, fontSize: "10px", color: "#60a5fa", textDecoration: "none", whiteSpace: "nowrap" }}>
                Open ↗
              </a>
            </div>
          )}
        </div>
      )}
      {/* Modal elimina progetto */}
      {/* Export Modal */}
      {exportOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }} onClick={() => setExportOpen(false)}>
          <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: "12px", padding: "28px", width: "min(340px, calc(100vw - 32px))", ...INTER }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ color: "#e6edf3", fontSize: "14px", fontWeight: 700, margin: 0 }}>Export Logs</h3>
              <button onClick={() => setExportOpen(false)} style={{ background: "none", border: "none", color: "#7d8590", fontSize: "16px", cursor: "pointer", padding: "2px 6px", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ color: "#a0aab4", fontSize: "10px", fontWeight: 600, display: "block", marginBottom: "8px", letterSpacing: "0.8px" }}>FORMAT</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["pdf", "csv", "json"] as const).map(f => (
                  <button key={f} onClick={() => setExportFormat(f)}
                    style={{ flex: 1, padding: "8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer", border: exportFormat === f ? "1px solid #4ade80" : "1px solid #1e1e1e", backgroundColor: exportFormat === f ? "rgba(74,222,128,0.1)" : "#000", color: exportFormat === f ? "#4ade80" : "#a0aab4", ...INTER, textTransform: "uppercase" }}>
                    {f}
                  </button>
                ))}
              </div>
              <p style={{ color: "#555", fontSize: "10px", margin: "8px 0 0", ...INTER }}>
                {exportFormat === "pdf" ? "Branded report with logo, summary and color-coded events" : exportFormat === "csv" ? "Spreadsheet format for Excel, Numbers or Google Sheets" : "Raw structured data for programmatic use"}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ color: "#a0aab4", fontSize: "10px", fontWeight: 600, display: "block", marginBottom: "8px", letterSpacing: "0.8px" }}>LEVEL</label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["", "ERROR", "WARN", "INFO", "DEBUG"].map(l => {
                  const colors: Record<string, string> = { ERROR: "#f87171", WARN: "#facc15", INFO: "#4ade80", DEBUG: "#a855f7" };
                  const active = exportLevel === l;
                  return (
                    <button key={l} onClick={() => setExportLevel(l)}
                      style={{ padding: "5px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 600, cursor: "pointer", border: active ? `1px solid ${colors[l] || "#4ade80"}` : "1px solid #1e1e1e", backgroundColor: active ? `${colors[l] || "#4ade80"}18` : "#000", color: active ? (colors[l] || "#4ade80") : "#a0aab4", ...INTER }}>
                      {l || "All"}
                    </button>
                  );
                })}
              </div>
            </div>

            <p style={{ color: "#555", fontSize: "10px", margin: "0 0 16px", ...INTER }}>
              {exportFormat === "pdf" ? "Up to 500 most recent events in the report." : "Up to 10,000 most recent logs exported."}
            </p>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setExportOpen(false)} style={{ flex: 1, backgroundColor: "transparent", border: "1px solid #1e1e1e", color: "#a0aab4", fontSize: "12px", padding: "9px", borderRadius: "6px", cursor: "pointer", ...INTER }}>Cancel</button>
              <button onClick={handleExport} disabled={exporting} style={{ flex: 1, backgroundColor: "#4ade80", color: "#000", fontSize: "12px", fontWeight: 700, padding: "9px", borderRadius: "6px", border: "none", cursor: "pointer", opacity: exporting ? 0.6 : 1, ...INTER }}>
                {exporting ? "Generating..." : "↓ Download"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #333", borderRadius: "10px", padding: "28px 28px 24px", width: "min(400px, 90vw)", ...INTER }}>
            <div style={{ fontSize: "15px", color: "#e6edf3", fontWeight: 600, marginBottom: "10px" }}>Elimina progetto</div>
            <div style={{ fontSize: "13px", color: "#a0aab4", lineHeight: 1.6, marginBottom: "24px" }}>
              Sei sicuro di voler eliminare <span style={{ color: "#e6edf3", fontWeight: 500 }}>{deleteModal.name}</span>?<br />
              Tutti i log, errori, monitor e dati associati verranno eliminati definitivamente. Questa azione è irreversibile.
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleting}
                style={{ ...INTER, padding: "8px 18px", backgroundColor: "transparent", border: "1px solid #333", color: "#a0aab4", fontSize: "12px", borderRadius: "6px", cursor: "pointer", fontWeight: 500 }}
              >Annulla</button>
              <button
                onClick={() => deleteProject(deleteModal.id)}
                disabled={deleting}
                style={{ ...INTER, padding: "8px 18px", backgroundColor: "#cd4040", border: "none", color: "#fff", fontSize: "12px", borderRadius: "6px", cursor: deleting ? "not-allowed" : "pointer", fontWeight: 600, opacity: deleting ? 0.7 : 1 }}
              >{deleting ? "Eliminando..." : "Elimina"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsPageInner />
    </Suspense>
  );
}
