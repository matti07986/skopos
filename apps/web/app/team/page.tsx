"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/logo";
import HeaderClock from "@/components/HeaderClock";
import { getAuthHeaders, getAuthHeadersNoContent, apiUrl } from "@/lib/api";

const INTER = { fontFamily: "'Inter', sans-serif" };

interface Team {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  email: string;
  role: string;
  joined_at: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  accepted: boolean;
  created_at: string;
}

const roleColor: Record<string, string> = {
  owner: "#fbbf24",
  admin: "#4ade80",
  member: "#a0aab4",
};

function apiFetch(path: string, init?: RequestInit) {
  const hasBody = init?.body !== undefined;
  return fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(hasBody ? getAuthHeaders() : getAuthHeadersNoContent()),
      ...(init?.headers ?? {}),
    },
  });
}

export default function TeamPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  // Create team
  const [showCreate, setShowCreate] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{type:"ok"|"err";text:string}|null>(null);

  // Transfer
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("skopos_access_token");
    if (!token) { router.replace("/login"); return; }

    Promise.all([
      apiFetch("/v1/auth/me").then(r => r.json()),
      apiFetch("/v1/teams").then(r => r.json()),
    ]).then(([me, teamList]) => {
      setUserId(me.user_id);
      const list = Array.isArray(teamList) ? teamList : [];
      setTeams(list);
      if (list.length > 0) loadTeam(list[0]);
    }).catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function loadTeam(team: Team) {
    setActiveTeam(team);
    const [mem, inv] = await Promise.all([
      apiFetch(`/v1/teams/${team.id}/members`).then(r => r.json()),
      apiFetch(`/v1/teams/${team.id}/invites`).then(r => r.ok ? r.json() : []),
    ]);
    setMembers(Array.isArray(mem) ? mem : []);
    setInvites(Array.isArray(inv) ? inv : []);
  }

  async function handleCancelInvite(inviteId: string) {
    if (!activeTeam) return;
    await apiFetch(`/v1/teams/${activeTeam.id}/invites/${inviteId}`, { method: "DELETE" });
    setInvites(prev => prev.filter(i => i.id !== inviteId));
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await apiFetch("/v1/teams", {
        method: "POST",
        body: JSON.stringify({ name: newTeamName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Error");
      setTeams(prev => [...prev, data]);
      setNewTeamName("");
      setShowCreate(false);
      loadTeam(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTeam) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await apiFetch(`/v1/teams/${activeTeam.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Error");
      setInviteMsg({ type: "ok", text: `Invitation sent to ${inviteEmail}` });
      setInviteEmail("");
      setShowInvite(false);
    } catch (err: any) {
      setInviteMsg({ type: "err", text: err.message });
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(memberId: string, memberRole: string) {
    if (!activeTeam || memberRole === "owner") return;
    if (!window.confirm("Remove this member?")) return;
    await apiFetch(`/v1/teams/${activeTeam.id}/members/${memberId}`, { method: "DELETE" });
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }

  async function handleUpdateRole(memberId: string, newRole: string) {
    if (!activeTeam) return;
    const res = await apiFetch(`/v1/teams/${activeTeam.id}/members/${memberId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: updated.role } : m));
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTeam) return;
    const member = members.find(m => m.email === transferTo);
    if (!member) { setError("Member not found"); return; }
    if (!window.confirm(`Transfer ownership to ${transferTo}? You will become admin.`)) return;
    const res = await apiFetch(`/v1/teams/${activeTeam.id}/transfer`, {
      method: "POST",
      body: JSON.stringify({ new_owner_id: member.user_id }),
    });
    if (res.ok) {
      const updated = await res.json();
      setActiveTeam(updated);
      setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
      loadTeam(updated);
      setShowTransfer(false);
      setTransferTo("");
    }
  }

  async function handleDeleteTeam() {
    if (!activeTeam) return;
    if (!window.confirm(`Delete team "${activeTeam.name}"? This cannot be undone.`)) return;
    await apiFetch(`/v1/teams/${activeTeam.id}`, { method: "DELETE" });
    const remaining = teams.filter(t => t.id !== activeTeam.id);
    setTeams(remaining);
    setActiveTeam(remaining[0] ?? null);
    setMembers([]);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>Loading...</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>

      {/* Navbar */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, borderBottom: "1px solid #111", backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 24px", height: "48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Logo size={24} />
            <span style={{ ...INTER, color: "#fff", fontSize: "13px", fontWeight: 600, letterSpacing: "-0.2px" }}>skopos</span>
            <div style={{ width: "1px", height: "14px", backgroundColor: "#1e1e1e", margin: "0 6px" }} />
            <HeaderClock />
            <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>/</span>
            <span style={{ ...INTER, color: "#a0aab4", fontSize: "13px" }}>team</span>
          </div>
          <a href="/projects" style={{ ...INTER, color: "#a0aab4", fontSize: "11px", textDecoration: "none" }}>Dashboard →</a>
        </div>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 16px 80px", display: "flex", gap: "40px", flexWrap: "wrap" }}>

        {/* Sidebar teams */}
        <div style={{ width: "260px", flexShrink: 0, minWidth: "200px", flex: "1 1 200px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Teams</span>
            <button onClick={() => setShowCreate(!showCreate)} style={{ ...INTER, fontSize: "18px", color: "#4ade80", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>+</button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreateTeam} style={{ marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <input
                type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                placeholder="Team name" required
                style={{ ...INTER, fontSize: "12px", color: "#e6edf3", backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "6px 10px", outline: "none", width: "100%", boxSizing: "border-box" }}
              />
              <button type="submit" disabled={creating} style={{ ...INTER, fontSize: "11px", color: "#000", backgroundColor: "#4ade80", border: "none", borderRadius: "5px", padding: "6px", cursor: "pointer" }}>
                {creating ? "Creating..." : "Create"}
              </button>
            </form>
          )}

          {teams.length === 0 ? (
            <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>No teams yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {teams.map(t => (
                <button key={t.id} onClick={() => loadTeam(t)} style={{
                  ...INTER, fontSize: "12px", textAlign: "left", padding: "8px 10px", borderRadius: "5px",
                  color: activeTeam?.id === t.id ? "#e6edf3" : "#a0aab4",
                  backgroundColor: activeTeam?.id === t.id ? "#0a0a0a" : "transparent",
                  border: activeTeam?.id === t.id ? "1px solid #222" : "1px solid transparent",
                  cursor: "pointer",
                }}>
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        {activeTeam ? (
          <div style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ ...INTER, fontSize: "22px", color: "#e6edf3", fontWeight: 600, margin: 0 }}>{activeTeam.name}</h1>
                <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", margin: "4px 0 0 0" }}>
                  {members.length} member{members.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button onClick={() => setShowInvite(!showInvite)} style={{ ...INTER, fontSize: "11px", color: "#4ade80", backgroundColor: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: "5px", padding: "7px 14px", cursor: "pointer" }}>
                + Invite member
              </button>
            </div>

            {error && <span style={{ ...INTER, fontSize: "11px", color: "#f87171" }}>{error}</span>}
            {inviteMsg && <span style={{ ...INTER, fontSize: "11px", color: inviteMsg.type === "ok" ? "#4ade80" : "#f87171" }}>{inviteMsg.text}</span>}

            {/* Invite form */}
            {showInvite && (
              <form onSubmit={handleInvite} style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Invite Member</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    placeholder="email@example.com" required
                    style={{ ...INTER, flex: 1, fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 12px", outline: "none" }}
                  />
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ ...INTER, fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid #1a1a1a", borderRadius: "5px", padding: "8px 10px", outline: "none" }}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button type="submit" disabled={inviting} style={{ ...INTER, fontSize: "12px", color: "#000", backgroundColor: "#4ade80", border: "none", borderRadius: "5px", padding: "8px 16px", cursor: "pointer" }}>
                    {inviting ? "Sending..." : "Send invite"}
                  </button>
                </div>
              </form>
            )}

            {/* Members list */}
            <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Members</span>
              {members.map(member => (
                <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", backgroundColor: "#111", borderRadius: "6px", border: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#161616", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ ...INTER, fontSize: "11px", color: "#a0aab4", fontWeight: 600 }}>{member.email[0].toUpperCase()}</span>
                    </div>
                    <div>
                      <p style={{ ...INTER, fontSize: "12px", color: "#e6edf3", margin: 0 }}>{member.email}</p>
                      <p style={{ ...INTER, fontSize: "10px", color: "#a0aab4", margin: "2px 0 0 0" }}>Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {member.role !== "owner" && member.user_id !== userId ? (
                      <select
                        value={member.role}
                        onChange={e => handleUpdateRole(member.id, e.target.value)}
                        style={{ ...INTER, fontSize: "11px", color: roleColor[member.role] ?? "#a0aab4", backgroundColor: "transparent", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "3px 8px", cursor: "pointer" }}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span style={{ ...INTER, fontSize: "11px", fontWeight: 600, color: roleColor[member.role] ?? "#a0aab4", padding: "3px 8px", borderRadius: "4px", backgroundColor: `${roleColor[member.role]}15` }}>
                        {member.role}
                      </span>
                    )}
                    {member.role !== "owner" && member.user_id !== userId && (
                      <button onClick={() => handleRemoveMember(member.id, member.role)} style={{ ...INTER, fontSize: "11px", color: "#f87171", background: "none", border: "none", cursor: "pointer" }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Inviti pendenti */}
            {invites.length > 0 && (
              <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #222", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ ...INTER, fontSize: "10px", color: "#a0aab4", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Pending Invites</span>
                {invites.map(invite => (
                  <div key={invite.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", backgroundColor: "#111", borderRadius: "6px", border: "1px solid #1a1a1a" }}>
                    <div>
                      <p style={{ ...INTER, fontSize: "12px", color: "#e6edf3", margin: 0 }}>{invite.email}</p>
                      <p style={{ ...INTER, fontSize: "10px", color: "#a0aab4", margin: "2px 0 0 0" }}>Invited as {invite.role} · {new Date(invite.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ ...INTER, fontSize: "10px", color: "#facc15", padding: "2px 8px", backgroundColor: "rgba(250,204,21,0.1)", borderRadius: "999px" }}>Pending</span>
                      <button onClick={() => handleCancelInvite(invite.id)} style={{ ...INTER, fontSize: "11px", color: "#f87171", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Danger zone - solo per owner */}
            {activeTeam.owner_id === userId && (
              <div style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <span style={{ ...INTER, fontSize: "10px", color: "#f87171", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>Danger Zone</span>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: 0 }}>Transfer ownership</p>
                    <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", margin: "3px 0 0 0" }}>Transfer this team to another member. You will become admin.</p>
                  </div>
                  <button onClick={() => setShowTransfer(!showTransfer)} style={{ ...INTER, fontSize: "11px", color: "#fbbf24", backgroundColor: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "5px", padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap", marginLeft: "16px" }}>
                    Transfer
                  </button>
                </div>

                {showTransfer && (
                  <form onSubmit={handleTransfer} style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="email" value={transferTo} onChange={e => setTransferTo(e.target.value)}
                      placeholder="New owner email" required
                      style={{ ...INTER, flex: 1, fontSize: "12px", color: "#e6edf3", backgroundColor: "#111", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "5px", padding: "8px 12px", outline: "none" }}
                    />
                    <button type="submit" style={{ ...INTER, fontSize: "12px", color: "#000", backgroundColor: "#fbbf24", border: "none", borderRadius: "5px", padding: "8px 16px", cursor: "pointer" }}>
                      Confirm
                    </button>
                  </form>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ ...INTER, fontSize: "13px", color: "#e6edf3", margin: 0 }}>Delete team</p>
                    <p style={{ ...INTER, fontSize: "11px", color: "#a0aab4", margin: "3px 0 0 0" }}>Permanently delete this team and remove all members.</p>
                  </div>
                  <button onClick={handleDeleteTeam} style={{ ...INTER, fontSize: "11px", color: "#f87171", backgroundColor: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "5px", padding: "7px 14px", cursor: "pointer", whiteSpace: "nowrap", marginLeft: "16px" }}>
                    Delete team
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <p style={{ ...INTER, fontSize: "14px", color: "#a0aab4" }}>No teams yet</p>
            <p style={{ ...INTER, fontSize: "12px", color: "#a0aab4" }}>Create a team to collaborate with others</p>
            <button onClick={() => setShowCreate(true)} style={{ ...INTER, fontSize: "12px", color: "#000", backgroundColor: "#4ade80", border: "none", borderRadius: "5px", padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}>
              Create your first team
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
