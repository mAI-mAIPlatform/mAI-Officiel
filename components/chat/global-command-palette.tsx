"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

type PaletteData = {
  projects: Array<{ id: string; name: string }>;
  tasks: Array<{ id: string; title: string; projectId: string; projectName: string }>;
  files: Array<{ id: string; name: string; projectId: string; projectName: string }>;
};

type Item = { id: string; label: string; description?: string; onSelect: () => void; section: string };

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safe})`, "ig");
  return text.split(regex).map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark className="rounded bg-cyan-200/70 px-0.5" key={`${part}-${index}`}>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

export function GlobalCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const { data } = useSWR<PaletteData>(open ? "/api/command-palette" : null, fetcher, {
    revalidateOnFocus: false,
  });

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    const projects: Item[] = (data?.projects ?? [])
      .filter((project) => project.name.toLowerCase().includes(q))
      .map((project) => ({ id: `project-${project.id}`, label: project.name, section: "Projets", onSelect: () => router.push(`/projects/${project.id}`) }));

    const tasks: Item[] = (data?.tasks ?? [])
      .filter((task) => task.title.toLowerCase().includes(q))
      .map((task) => ({ id: `task-${task.id}`, label: task.title, description: task.projectName, section: "Tâches", onSelect: () => router.push(`/projects/${task.projectId}?tab=tasks&taskId=${task.id}`) }));

    const files: Item[] = (data?.files ?? [])
      .filter((file) => file.name.toLowerCase().includes(q))
      .map((file) => ({ id: `file-${file.id}`, label: file.name, description: file.projectName, section: "Fichiers", onSelect: () => router.push(`/projects/${file.projectId}?tab=library&fileId=${file.id}`) }));

    const actions: Item[] = [
      { id: "action-new-project", label: "Nouveau projet", section: "Actions rapides", onSelect: () => router.push("/projects/new") },
      { id: "action-new-task", label: "Nouvelle tâche", section: "Actions rapides", onSelect: () => router.push("/projects") },
      { id: "action-settings", label: "Paramètres", section: "Actions rapides", onSelect: () => router.push("/settings") },
    ].filter((action) => action.label.toLowerCase().includes(q));

    return [...projects, ...tasks, ...actions, ...files];
  }, [data?.files, data?.projects, data?.tasks, query, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? event.metaKey : event.ctrlKey;
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }

      if (!open) return;

      if (event.key === "Escape") {
        setOpen(false);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        setIndex((prev) => Math.min(prev + 1, Math.max(filteredItems.length - 1, 0)));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter") {
        event.preventDefault();
        const item = filteredItems[index];
        if (item) {
          item.onSelect();
          setOpen(false);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filteredItems, index, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setIndex(0);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center bg-black/35 p-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <div className="liquid-panel w-full max-w-2xl rounded-2xl border border-white/30 bg-white/80 p-3 text-black backdrop-blur-2xl" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher projets, tâches, fichiers..."
          value={query}
        />

        <div className="mt-3 max-h-[55vh] space-y-3 overflow-y-auto pr-1">
          {(["Projets", "Tâches", "Actions rapides", "Fichiers"] as const).map((section) => {
            const sectionItems = filteredItems.filter((item) => item.section === section);
            if (sectionItems.length === 0) return null;
            return (
              <section key={section}>
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-black/55">{section}</p>
                <div className="mt-1 space-y-1">
                  {sectionItems.map((item) => {
                    const absoluteIndex = filteredItems.findIndex((candidate) => candidate.id === item.id);
                    return (
                      <button
                        className={`block w-full rounded-lg px-2 py-1.5 text-left text-sm ${absoluteIndex === index ? "bg-cyan-200/70" : "hover:bg-white/80"}`}
                        key={item.id}
                        onClick={() => {
                          item.onSelect();
                          setOpen(false);
                        }}
                        type="button"
                      >
                        <div>{highlight(item.label, query)}</div>
                        {item.description ? <div className="text-xs text-black/60">{highlight(item.description, query)}</div> : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
