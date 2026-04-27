"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  task_created: "a créé la tâche",
  task_updated: "a mis à jour la tâche",
  task_completed: "a terminé la tâche",
  task_deleted: "a supprimé la tâche",
  comment_added: "a ajouté un commentaire",
  file_uploaded: "a uploadé un fichier",
  file_deleted: "a supprimé un fichier",
  member_invited: "a invité un membre",
  member_removed: "a retiré un membre",
  project_updated: "a mis à jour le projet",
  source_added: "a ajouté une source",
};

type ActivityItem = {
  id: string;
  actionType: keyof typeof ACTION_LABELS;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
};

type MemberItem = { userId: string; name: string | null; email: string };

export function ProjectActivityTimeline({ projectId }: { projectId: string }) {
  const [actionType, setActionType] = useState("");
  const [userId, setUserId] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: "40" });
    if (actionType) params.set("actionType", actionType);
    if (userId) params.set("userId", userId);
    return `/api/projects/${projectId}/activity?${params.toString()}`;
  }, [actionType, projectId, userId]);

  const { data } = useSWR<{ items: ActivityItem[] }>(query, fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  const { data: membersData } = useSWR<{ members: MemberItem[] }>(
    `/api/projects/${projectId}/members`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return (
    <section className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
      <h2 className="text-lg font-semibold">Journal d'activité</h2>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <select className="h-10 rounded-lg border border-black/20 bg-white px-2 text-sm" value={actionType} onChange={(e) => setActionType(e.target.value)}>
          <option value="">Tous les types d'action</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select className="h-10 rounded-lg border border-black/20 bg-white px-2 text-sm" value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">Tous les utilisateurs</option>
          {(membersData?.members ?? []).map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.name ?? member.email}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {(data?.items ?? []).map((item) => {
          const label = ACTION_LABELS[item.actionType] ?? item.actionType;
          const name = item.userName ?? "Utilisateur";
          const targetTitle =
            (typeof item.metadata?.title === "string" && item.metadata.title) ||
            (typeof item.metadata?.taskTitle === "string" && item.metadata.taskTitle) ||
            (typeof item.metadata?.name === "string" && item.metadata.name) ||
            "";

          return (
            <article className="relative rounded-xl border border-black/15 bg-white/80 p-3" key={item.id}>
              <div className="absolute -left-1 top-5 h-2 w-2 rounded-full bg-cyan-500" />
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold">
                  {name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-black/85">
                    <strong>{name}</strong> {label} {targetTitle ? <strong>{targetTitle}</strong> : null}
                  </p>
                  <p className="text-xs text-black/55">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
