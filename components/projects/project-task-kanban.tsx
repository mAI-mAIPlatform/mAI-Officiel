"use client";

import { BotIcon, CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TaskStatus = "todo" | "doing" | "done";
type TaskPriority = "low" | "medium" | "high";

type TaskItem = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeType: "user" | "ai";
  assignee: { name: string | null; image: string | null } | null;
  subtasks: Array<{ id: string; status: "todo" | "done" }>;
};

const statuses: Array<{ key: TaskStatus; label: string }> = [
  { key: "todo", label: "À faire" },
  { key: "doing", label: "En cours" },
  { key: "done", label: "Terminé" },
];

const priorityStyle: Record<TaskPriority, string> = {
  low: "bg-emerald-100 text-emerald-700",
  medium: "bg-orange-100 text-orange-700",
  high: "bg-red-100 text-red-700",
};

function AssigneeAvatar({ task }: { task: TaskItem }) {
  if (task.assigneeType === "ai") {
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-violet-100 text-violet-700">
        <BotIcon className="size-4" />
      </span>
    );
  }

  if (task.assignee?.image) {
    return (
      <img
        alt={task.assignee.name ?? "Assignee"}
        className="size-8 rounded-full border border-black/15 object-cover"
        src={task.assignee.image}
      />
    );
  }

  const initials = (task.assignee?.name ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-black/30 text-xs font-semibold text-black/60">
      {initials || "U"}
    </span>
  );
}

export function ProjectTaskKanban({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<TaskStatus>("todo");

  const loadTasks = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/projects/${projectId}/tasks?sortBy=dueDate&order=asc`);
    if (response.ok) {
      setTasks((await response.json()) as TaskItem[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const grouped = useMemo(() => {
    return {
      todo: tasks.filter((task) => task.status === "todo"),
      doing: tasks.filter((task) => task.status === "doing"),
      done: tasks.filter((task) => task.status === "done"),
    };
  }, [tasks]);

  const createQuickTask = async (status: TaskStatus) => {
    const title = window.prompt("Titre de la nouvelle tâche")?.trim();
    if (!title) return;

    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status }),
    });

    await loadTasks();
  };

  const patchStatus = async (taskId: string, status: TaskStatus) => {
    await fetch(`/api/projects/${projectId}/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const persistColumnOrder = async (status: TaskStatus, ids: string[]) => {
    if (ids.length === 0) return;

    await fetch(`/api/projects/${projectId}/tasks/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, taskIds: ids }),
    });
  };

  const moveTask = async (task: TaskItem, direction: "left" | "right") => {
    const currentIndex = statuses.findIndex((status) => status.key === task.status);
    const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= statuses.length) {
      return;
    }

    const nextStatus = statuses[targetIndex].key;
    await patchStatus(task.id, nextStatus);

    const nextColumnIds = [
      ...grouped[nextStatus].map((item) => item.id),
      task.id,
    ];
    await persistColumnOrder(nextStatus, nextColumnIds);

    await loadTasks();
  };

  const renderColumn = (status: TaskStatus, label: string) => {
    const items = grouped[status];

    return (
      <section className="min-h-[420px] rounded-2xl border border-white/30 bg-white/75 p-3 backdrop-blur-xl">
        <header className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-black">{label}</h3>
            <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs text-black/70">
              {items.length}
            </span>
          </div>
          <button
            className="inline-flex items-center gap-1 rounded-lg border border-black/15 bg-white px-2 py-1 text-xs"
            onClick={() => createQuickTask(status)}
            type="button"
          >
            <Plus className="size-3" /> Ajouter
          </button>
        </header>

        <div className="space-y-2">
          {items.map((task) => {
            const completed = task.subtasks.filter((subtask) => subtask.status === "done").length;

            return (
              <article
                className="rounded-xl border border-black/10 bg-white/90 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                key={task.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-black">{task.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityStyle[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-black/65">
                  <AssigneeAvatar task={task} />
                  <span>{completed} / {task.subtasks.length} sous-tâches</span>
                </div>

                {task.dueDate ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-black/65">
                    <CalendarDays className="size-3" />
                    {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center justify-between gap-1">
                  <button
                    className="inline-flex items-center rounded border border-black/15 px-2 py-1 text-xs disabled:opacity-40"
                    disabled={status === "todo"}
                    onClick={() => moveTask(task, "left")}
                    type="button"
                  >
                    <ChevronLeft className="size-3" />
                  </button>
                  <button
                    className="inline-flex items-center rounded border border-black/15 px-2 py-1 text-xs disabled:opacity-40"
                    disabled={status === "done"}
                    onClick={() => moveTask(task, "right")}
                    type="button"
                  >
                    <ChevronRight className="size-3" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <article className="space-y-3">
      {isLoading ? <p className="text-sm text-black/70">Chargement du Kanban…</p> : null}

      <div className="flex gap-2 md:hidden">
        {statuses.map((status) => (
          <button
            className={`rounded-lg border px-3 py-1.5 text-xs ${mobileTab === status.key ? "border-cyan-400 bg-cyan-200/70" : "border-black/15 bg-white/80"}`}
            key={status.key}
            onClick={() => setMobileTab(status.key)}
            type="button"
          >
            {status.label}
          </button>
        ))}
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-3">
        {statuses.map((status) => (
          <div key={status.key}>{renderColumn(status.key, status.label)}</div>
        ))}
      </div>

      <div className="md:hidden">{renderColumn(mobileTab, statuses.find((status) => status.key === mobileTab)?.label ?? "")}</div>
    </article>
  );
}
