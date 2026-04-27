"use client";

import { useEffect, useMemo, useState } from "react";
import { ProjectTaskCalendar } from "./project-task-calendar";
import { ProjectTaskKanban } from "./project-task-kanban";
import { ProjectTaskManager } from "./project-task-manager";

type ViewMode = "list" | "kanban" | "calendar";

function storageKey(projectId: string) {
  return `mai.projects.view-mode.${projectId}`;
}

export function ProjectTaskViews({ projectId }: { projectId: string }) {
  const [view, setView] = useState<ViewMode>("kanban");

  const key = useMemo(() => storageKey(projectId), [projectId]);

  useEffect(() => {
    const saved = localStorage.getItem(key) as ViewMode | null;
    if (saved === "list" || saved === "kanban" || saved === "calendar") {
      setView(saved);
    }
  }, [key]);

  const changeView = (next: ViewMode) => {
    setView(next);
    localStorage.setItem(key, next);
  };

  return (
    <section className="space-y-3">
      <div className="inline-flex rounded-2xl border border-white/30 bg-white/75 p-1 backdrop-blur-xl">
        {[
          { key: "list", label: "Liste" },
          { key: "kanban", label: "Kanban" },
          { key: "calendar", label: "Calendrier" },
        ].map((item) => (
          <button
            className={`min-h-11 rounded-xl px-3 py-1.5 text-sm transition ${
              view === item.key
                ? "bg-cyan-200/80 text-black"
                : "text-black/70 hover:bg-white/80"
            }`}
            key={item.key}
            onClick={() => changeView(item.key as ViewMode)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {view === "kanban" ? <ProjectTaskKanban projectId={projectId} /> : null}
      {view === "list" ? <ProjectTaskManager projectId={projectId} /> : null}
      {view === "calendar" ? <ProjectTaskCalendar projectId={projectId} /> : null}
    </section>
  );
}
