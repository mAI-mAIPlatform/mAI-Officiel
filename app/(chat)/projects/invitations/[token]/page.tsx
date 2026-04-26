"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type InvitationPayload = {
  project: { id: string; name: string };
  invitation: { email: string; role: "editor" | "viewer"; expiresAt: string };
};

export default function AcceptProjectInvitationPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const [data, setData] = useState<InvitationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/invitations/${token}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error ?? "Invitation invalide");
        }
        return response.json();
      })
      .then((payload: InvitationPayload) => setData(payload))
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const accept = async () => {
    const response = await fetch(`/api/projects/invitations/${token}`, {
      method: "POST",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? "Impossible d'accepter l'invitation");
      return;
    }

    const payload = await response.json();
    router.push(`/projects/${payload.projectId}`);
  };

  const decline = async () => {
    await fetch(`/api/projects/invitations/${token}`, { method: "DELETE" });
    router.push("/projects");
  };

  if (isLoading) {
    return <main className="mx-auto max-w-xl p-6 text-black">Chargement...</main>;
  }

  if (error || !data) {
    return <main className="mx-auto max-w-xl p-6 text-red-600">{error ?? "Invitation invalide"}</main>;
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6 text-black">
      <section className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-6 backdrop-blur-2xl">
        <h1 className="text-xl font-semibold">Invitation projet</h1>
        <p className="mt-2 text-sm text-black/70">
          Vous êtes invité(e) à rejoindre <strong>{data.project.name}</strong> avec le rôle
          <strong> {data.invitation.role === "editor" ? "éditeur" : "lecteur"}</strong>.
        </p>
        <p className="mt-1 text-xs text-black/60">Invitation envoyée à {data.invitation.email}</p>

        <div className="mt-4 flex gap-2">
          <button
            className="rounded-lg border border-cyan-500/30 bg-cyan-200 px-3 py-2 text-sm font-medium"
            onClick={accept}
            type="button"
          >
            Accepter
          </button>
          <button
            className="rounded-lg border border-black/20 bg-white px-3 py-2 text-sm"
            onClick={decline}
            type="button"
          >
            Refuser
          </button>
        </div>
      </section>
    </main>
  );
}
