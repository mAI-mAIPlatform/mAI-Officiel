"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

type HistoryItem = {
  id: string;
  title: string;
  createdAt: string;
  summary: string | null;
  preview: string;
};

export function ProjectHistoryView({ projectId }: { projectId: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summaryFilter, setSummaryFilter] = useState("");
  const [query, setQuery] = useState("");

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (summaryFilter.trim()) params.set("summary", summaryFilter.trim());
    if (query.trim()) params.set("q", query.trim());
    const suffix = params.toString();
    return `/api/projects/${projectId}/history${suffix ? `?${suffix}` : ""}`;
  }, [from, projectId, query, summaryFilter, to]);

  const { data, isLoading } = useSWR<HistoryItem[]>(url, fetcher, {
    revalidateOnFocus: false,
  });

  return (
    <section className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
      <h2 className="text-lg font-semibold">Historique des conversations</h2>
      <p className="mt-1 text-sm text-black/70">
        Timeline complète du projet avec filtres par date, résumé et texte des messages.
      </p>

      <div className="mt-4 grid gap-2 md:grid-cols-4">
        <input className="rounded-lg border border-black/20 bg-white px-3 py-2 text-sm" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="rounded-lg border border-black/20 bg-white px-3 py-2 text-sm" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <input className="rounded-lg border border-black/20 bg-white px-3 py-2 text-sm" placeholder="Filtrer le résumé" value={summaryFilter} onChange={(e) => setSummaryFilter(e.target.value)} />
        <input className="rounded-lg border border-black/20 bg-white px-3 py-2 text-sm" placeholder="Recherche texte messages" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="mt-4 space-y-2">
        {isLoading ? <p className="text-sm text-black/60">Chargement…</p> : null}
        {(data ?? []).map((item) => (
          <article key={item.id} className="rounded-xl border border-black/20 bg-white/75 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">{item.title}</h3>
              <span className="text-xs text-black/60">{new Date(item.createdAt).toLocaleString("fr-FR")}</span>
            </div>
            {item.summary ? <p className="mt-2 text-sm text-black/80"><strong>Résumé:</strong> {item.summary}</p> : null}
            {item.preview ? <p className="mt-1 line-clamp-2 text-xs text-black/65">{item.preview}</p> : null}
            <Link className="mt-2 inline-flex rounded-lg border border-black/20 bg-white px-2 py-1 text-xs" href={`/chat/${item.id}?projectId=${projectId}`}>
              Ouvrir la conversation
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
