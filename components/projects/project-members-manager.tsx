"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "owner" | "editor" | "viewer";
};

type Invitation = {
  id: string;
  email: string;
  role: "editor" | "viewer";
  token: string;
  expiresAt: string;
};

const roleLabel = {
  owner: "Propriétaire",
  editor: "Éditeur",
  viewer: "Lecteur",
};

export function ProjectMembersManager({
  projectId,
  currentUserRole,
}: {
  projectId: string;
  currentUserRole: "owner" | "editor" | "viewer";
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const canManage = currentUserRole === "owner";

  const reload = async () => {
    const response = await fetch(`/api/projects/${projectId}/members`);
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    setMembers(payload.members ?? []);
    setInvitations(payload.invitations ?? []);
  };

  useEffect(() => {
    reload();
  }, [projectId]);

  const invite = async () => {
    const response = await fetch(`/api/projects/${projectId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: inviteRole }),
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setInviteLink(payload.inviteLink ?? null);
    setEmail("");
    await reload();
  };

  const updateRole = async (memberUserId: string, role: "editor" | "viewer") => {
    await fetch(`/api/projects/${projectId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberUserId, role }),
    });
    await reload();
  };

  const removeMember = async (memberUserId: string) => {
    await fetch(`/api/projects/${projectId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberUserId }),
    });
    await reload();
  };

  const cancelInvitation = async (invitationId: string) => {
    await fetch(`/api/projects/${projectId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId }),
    });
    await reload();
  };

  return (
    <section className="space-y-4">
      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
        <h2 className="text-base font-semibold">Membres</h2>
        <div className="mt-3 space-y-2">
          {members.map((member) => (
            <div
              className="flex items-center justify-between rounded-xl border border-black/10 bg-white/75 p-3"
              key={member.id}
            >
              <div className="flex items-center gap-3">
                {member.image ? (
                  <img alt={member.name ?? member.email} className="size-8 rounded-full" src={member.image} />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full bg-cyan-200 text-xs font-semibold">
                    {(member.name ?? member.email).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{member.name ?? "Utilisateur"}</p>
                  <p className="text-xs text-black/65">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-cyan-100 px-2 py-1 text-xs">{roleLabel[member.role]}</span>
                {canManage && member.role !== "owner" ? (
                  <>
                    <select
                      className="rounded-lg border border-black/15 bg-white px-2 py-1 text-xs"
                      onChange={(event) =>
                        updateRole(member.id, event.target.value as "editor" | "viewer")
                      }
                      value={member.role}
                    >
                      <option value="editor">Éditeur</option>
                      <option value="viewer">Lecteur</option>
                    </select>
                    <button
                      className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-700"
                      onClick={() => removeMember(member.id)}
                      type="button"
                    >
                      Retirer
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </article>

      {canManage ? (
        <article className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
          <h3 className="text-sm font-semibold">Inviter</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              className="h-10 flex-1 rounded-xl border border-black/15 bg-white px-3 text-sm"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@domaine.com"
              type="email"
              value={email}
            />
            <select
              className="h-10 rounded-xl border border-black/15 bg-white px-3 text-sm"
              onChange={(event) => setInviteRole(event.target.value as "editor" | "viewer")}
              value={inviteRole}
            >
              <option value="viewer">Lecteur</option>
              <option value="editor">Éditeur</option>
            </select>
            <button
              className="rounded-xl border border-cyan-500/30 bg-cyan-200 px-3 py-2 text-sm"
              onClick={invite}
              type="button"
            >
              Inviter
            </button>
          </div>
          {inviteLink ? (
            <div className="mt-3 rounded-lg border border-black/10 bg-white p-2 text-xs">
              <p className="break-all">{inviteLink}</p>
              <button
                className="mt-1 rounded border border-black/20 px-2 py-1"
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                type="button"
              >
                Copier le lien
              </button>
            </div>
          ) : null}

          <h4 className="mt-4 text-sm font-semibold">Invitations en attente</h4>
          <div className="mt-2 space-y-2">
            {invitations.map((invitation) => (
              <div
                className="flex items-center justify-between rounded-lg border border-black/10 bg-white/80 p-2"
                key={invitation.id}
              >
                <div>
                  <p className="text-xs font-medium">{invitation.email}</p>
                  <p className="text-xs text-black/60">Rôle: {roleLabel[invitation.role]}</p>
                </div>
                <button
                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                  onClick={() => cancelInvitation(invitation.id)}
                  type="button"
                >
                  Annuler
                </button>
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  );
}
