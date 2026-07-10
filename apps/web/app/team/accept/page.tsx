"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Logo from "@/components/ui/logo";
import { getAuthHeadersNoContent, apiUrl } from "@/lib/api";

const INTER = { fontFamily: "'Inter', sans-serif" };

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "login">("loading");
  const [message, setMessage] = useState("");
  const [teamId, setTeamId] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Invalid invite link."); return; }

    const jwt = localStorage.getItem("skopos_access_token");
    if (!jwt) {
      setStatus("login");
      return;
    }

    fetch(`${apiUrl}/v1/teams/invite/accept?token=${token}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
      credentials: "include",
    })
      .then(r => r.json())
      .then(data => {
        if (data.detail) throw new Error(data.detail);
        setTeamId(data.team_id);
        setStatus("success");
        setTimeout(() => router.push("/team"), 3000);
      })
      .catch(err => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [token, router]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "10px", padding: "40px", maxWidth: "400px", width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>

        <Logo size={32} />

        {status === "loading" && (
          <>
            <p style={{ ...INTER, fontSize: "16px", color: "#e6edf3", fontWeight: 600, margin: 0 }}>Accepting invitation...</p>
            <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", margin: 0 }}>Please wait</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "24px" }}>✓</span>
            </div>
            <p style={{ ...INTER, fontSize: "16px", color: "#4ade80", fontWeight: 600, margin: 0 }}>You joined the team!</p>
            <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", margin: 0 }}>Redirecting to your team page...</p>
            <a href="/team" style={{ ...INTER, fontSize: "12px", color: "#4ade80", textDecoration: "none", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "5px", padding: "8px 16px" }}>
              Go to Team →
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(248,113,113,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "24px" }}>✗</span>
            </div>
            <p style={{ ...INTER, fontSize: "16px", color: "#f87171", fontWeight: 600, margin: 0 }}>Invalid invitation</p>
            <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", margin: 0 }}>{message}</p>
            <a href="/projects" style={{ ...INTER, fontSize: "12px", color: "#a0aab4", textDecoration: "none", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 16px" }}>
              Go to Dashboard
            </a>
          </>
        )}

        {status === "login" && (
          <>
            <p style={{ ...INTER, fontSize: "16px", color: "#e6edf3", fontWeight: 600, margin: 0 }}>Sign in to accept</p>
            <p style={{ ...INTER, fontSize: "13px", color: "#a0aab4", margin: 0 }}>You need to be logged in to accept this invitation.</p>
            <a
              href={`/login?redirect=/team/accept?token=${token}`}
              style={{ ...INTER, fontSize: "12px", fontWeight: 600, color: "#000", backgroundColor: "#4ade80", textDecoration: "none", borderRadius: "5px", padding: "10px 20px" }}
            >
              Sign in →
            </a>
            <a href="/login?tab=register" style={{ ...INTER, fontSize: "12px", color: "#a0aab4", textDecoration: "none" }}>
              Create account
            </a>
          </>
        )}

      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Inter', sans-serif", color: "#a0aab4", fontSize: "13px" }}>Loading...</span>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
