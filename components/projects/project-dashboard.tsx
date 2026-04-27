"use client";

import {
  CalendarDays,
  ListTodo,
  MessageSquareMore,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

type ProjectDashboardProps = {
  color: string | null;
  completedTasks: number;
  completedSubtasks: number;
  daysRemaining: number | null;
  endDate: string | null;
  id: string;
  inProgressTasks: number;
  name: string;
  todoTasks: number;
  startDate: string | null;
  tags: string[];
  totalChats: number;
  totalSubtasks: number;
  totalTasks: number;
  progressPercentage: number;
};

function toDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function getProgressTone(progress: number) {
  if (progress < 30) {
    return "text-red-600";
  }

  if (progress <= 70) {
    return "text-orange-500";
  }

  return "text-emerald-600";
}

export function ProjectDashboard({
  color,
  completedTasks,
  completedSubtasks,
  daysRemaining,
  endDate,
  id,
  inProgressTasks,
  name,
  progressPercentage,
  startDate,
  tags,
  todoTasks,
  totalChats,
  totalSubtasks,
  totalTasks,
}: ProjectDashboardProps) {
  const [isPending, startTransition] = useTransition();
  const [localStartDate, setLocalStartDate] = useState(toDateInputValue(startDate));
  const [localEndDate, setLocalEndDate] = useState(toDateInputValue(endDate));
  const [localTags, setLocalTags] = useState(tags);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    setLocalStartDate(toDateInputValue(startDate));
  }, [startDate]);

  useEffect(() => {
    setLocalEndDate(toDateInputValue(endDate));
  }, [endDate]);

  useEffect(() => {
    setLocalTags(tags);
  }, [tags]);

  const badgeStyle = useMemo(() => {
    if (!color?.match(/^#[0-9A-Fa-f]{6}$/)) {
      return { backgroundColor: "rgba(34, 211, 238, 0.14)", borderColor: "rgba(34, 211, 238, 0.35)" };
    }

    return {
      backgroundColor: `${color}26`,
      borderColor: `${color}66`,
    };
  }, [color]);

  const persistChanges = (payload: Record<string, unknown>) => {
    startTransition(async () => {
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    });
  };

  const handleDateChange = (
    field: "startDate" | "endDate",
    value: string
  ) => {
    if (field === "startDate") {
      setLocalStartDate(value);
    } else {
      setLocalEndDate(value);
    }

    persistChanges({
      [field]: value ? new Date(`${value}T00:00:00.000Z`).toISOString() : null,
    });
  };

  const handleAddTag = () => {
    const normalized = newTag.trim();
    if (!normalized) {
      return;
    }

    if (localTags.includes(normalized)) {
      setNewTag("");
      return;
    }

    const nextTags = [...localTags, normalized];
    setLocalTags(nextTags);
    setNewTag("");
    persistChanges({ tags: nextTags });
  };

  const handleRemoveTag = (tag: string) => {
    const nextTags = localTags.filter((item) => item !== tag);
    setLocalTags(nextTags);
    persistChanges({ tags: nextTags });
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="liquid-panel rounded-2xl border border-white/35 bg-white/80 p-4 text-black backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/65">
              Tâches
            </p>
            <ListTodo className="size-4 text-black/70" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{totalTasks}</p>
          <p className="text-xs text-black/65">
            {completedTasks} terminées • {inProgressTasks} en cours • {todoTasks} à
            faire
          </p>
          <p className="text-xs text-black/50">
            {completedSubtasks}/{totalSubtasks} sous-tâches terminées
          </p>
        </article>

        <article className="liquid-panel rounded-2xl border border-white/35 bg-white/80 p-4 text-black backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/65">
              Progression
            </p>
            <TrendingUp className="size-4 text-black/70" />
          </div>
          <p className={`mt-2 text-2xl font-semibold ${getProgressTone(progressPercentage)}`}>
            {progressPercentage}%
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
            />
          </div>
        </article>

        <article className="liquid-panel rounded-2xl border border-white/35 bg-white/80 p-4 text-black backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/65">
              Deadline
            </p>
            <CalendarDays className="size-4 text-black/70" />
          </div>
          {daysRemaining === null ? (
            <p className="mt-2 text-sm text-black/45">Aucune deadline définie</p>
          ) : daysRemaining < 0 ? (
            <p className="mt-2 text-sm font-semibold text-red-600">
              Dépassée de {Math.abs(daysRemaining)} jour(s)
            </p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-black/80">
              {daysRemaining} jour(s) restant(s)
            </p>
          )}
        </article>

        <article className="liquid-panel rounded-2xl border border-white/35 bg-white/80 p-4 text-black backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/65">
              Discussions
            </p>
            <MessageSquareMore className="size-4 text-black/70" />
          </div>
          <p className="mt-2 text-2xl font-semibold">{totalChats}</p>
          <p className="text-xs text-black/65">liées à {name}</p>
        </article>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="liquid-panel rounded-2xl border border-white/35 bg-white/80 p-4 text-black backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/65">
            Période du projet
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-black/80">
              <span>Date de début</span>
              <input
                className="h-10 w-full rounded-xl border border-black/15 bg-white/80 px-3 text-sm"
                onChange={(event) => handleDateChange("startDate", event.target.value)}
                type="date"
                value={localStartDate}
              />
            </label>
            <label className="space-y-1 text-sm text-black/80">
              <span>Date de fin</span>
              <input
                className="h-10 w-full rounded-xl border border-black/15 bg-white/80 px-3 text-sm"
                onChange={(event) => handleDateChange("endDate", event.target.value)}
                type="date"
                value={localEndDate}
              />
            </label>
          </div>
          {isPending ? <p className="mt-2 text-xs text-black/55">Sauvegarde…</p> : null}
        </article>

        <article className="liquid-panel rounded-2xl border border-white/35 bg-white/80 p-4 text-black backdrop-blur-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/65">Tags</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {localTags.length === 0 ? (
              <p className="text-sm text-black/45">Aucun tag pour le moment.</p>
            ) : (
              localTags.map((tag) => (
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium"
                  key={tag}
                  style={badgeStyle}
                >
                  {tag}
                  <button
                    aria-label={`Supprimer ${tag}`}
                    className="rounded-full p-0.5 hover:bg-black/10"
                    onClick={() => handleRemoveTag(tag)}
                    type="button"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <input
            className="mt-3 h-10 w-full rounded-xl border border-black/15 bg-white/80 px-3 text-sm"
            onChange={(event) => setNewTag(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Ajouter un tag puis Entrée"
            value={newTag}
          />
        </article>
      </div>
    </section>
  );
}
