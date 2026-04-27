"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TaskItem = {
  id: string;
  title: string;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  status: "todo" | "doing" | "done";
  description?: string | null;
};

const priorityBar: Record<TaskItem["priority"], string> = {
  low: "bg-emerald-500/70",
  medium: "bg-orange-500/70",
  high: "bg-red-500/70",
};

const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function ProjectTaskCalendar({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [cursorDate, setCursorDate] = useState(new Date());
  const [mode, setMode] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [openedTask, setOpenedTask] = useState<TaskItem | null>(null);

  const loadTasks = async () => {
    const response = await fetch(`/api/projects/${projectId}/tasks?sortBy=dueDate&order=asc`);
    if (!response.ok) return;
    setTasks((await response.json()) as TaskItem[]);
  };

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMode("week");
    }
  }, []);

  const dayTasks = useMemo(() => {
    const map = new Map<string, TaskItem[]>();

    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }

    return map;
  }, [tasks]);

  const range = useMemo(() => {
    if (mode === "week") {
      const start = startOfWeek(cursorDate, { weekStartsOn: 1 });
      const end = endOfWeek(cursorDate, { weekStartsOn: 1 });
      return { start, end };
    }

    const monthStart = startOfMonth(cursorDate);
    return {
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(cursorDate), { weekStartsOn: 1 }),
    };
  }, [cursorDate, mode]);

  const days = useMemo(() => {
    const result: Date[] = [];
    let day = range.start;

    while (day <= range.end) {
      result.push(day);
      day = addDays(day, 1);
    }

    return result;
  }, [range]);

  const mobileWeekDays = useMemo(() => {
    const start = startOfWeek(cursorDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [cursorDate]);

  const selectedTasks = selectedDate
    ? dayTasks.get(format(selectedDate, "yyyy-MM-dd")) ?? []
    : [];

  const toggleDone = async (task: TaskItem, checked: boolean) => {
    await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: checked ? "done" : "todo" }),
    });
    await loadTasks();
  };

  const goPrev = () => {
    setCursorDate((prev) => (mode === "month" ? subMonths(prev, 1) : subWeeks(prev, 1)));
  };

  const goNext = () => {
    setCursorDate((prev) => (mode === "month" ? addMonths(prev, 1) : addWeeks(prev, 1)));
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-white/30 bg-white/75 p-3 backdrop-blur-xl">
        <button className="rounded-lg border border-black/15 bg-white p-1.5" onClick={goPrev} type="button">
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold text-black">
          {format(cursorDate, mode === "month" ? "MMMM yyyy" : "'Semaine du' dd MMM yyyy", {
            locale: fr,
          })}
        </p>
        <button className="rounded-lg border border-black/15 bg-white p-1.5" onClick={goNext} type="button">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="hidden justify-end gap-2 md:flex">
        <button
          className={`rounded-lg border px-3 py-1 text-xs ${mode === "month" ? "bg-cyan-200/80 border-cyan-400" : "bg-white/80 border-black/15"}`}
          onClick={() => setMode("month")}
          type="button"
        >
          Vue mensuelle
        </button>
        <button
          className={`rounded-lg border px-3 py-1 text-xs ${mode === "week" ? "bg-cyan-200/80 border-cyan-400" : "bg-white/80 border-black/15"}`}
          onClick={() => setMode("week")}
          type="button"
        >
          Vue hebdomadaire
        </button>
      </div>

      <div className="hidden md:block">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-black/65">
          {weekdayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const items = dayTasks.get(key) ?? [];
            const isToday = isSameDay(day, new Date());

            return (
              <button
                className={`min-h-[120px] rounded-xl border p-2 text-left ${
                  isToday ? "border-cyan-400" : "border-black/10"
                } ${isSameMonth(day, cursorDate) || mode === "week" ? "bg-white/85" : "bg-white/50 text-black/40"}`}
                key={key}
                onClick={() => setSelectedDate(day)}
                type="button"
              >
                <p className="text-xs font-semibold">{format(day, "d", { locale: fr })}</p>
                <div className="mt-1 space-y-1">
                  {items.slice(0, 4).map((task) => (
                    <div className={`h-1.5 rounded-full ${priorityBar[task.priority]}`} key={task.id} />
                  ))}
                  {items.length > 4 ? <p className="text-[10px] text-black/50">+{items.length - 4}</p> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        {mobileWeekDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const items = dayTasks.get(key) ?? [];
          return (
            <div className="rounded-xl border border-black/10 bg-white/85 p-3" key={key}>
              <p className="text-sm font-semibold text-black">
                {format(day, "EEEE d MMMM", { locale: fr })}
              </p>
              <div className="mt-2 space-y-1">
                {items.length === 0 ? (
                  <p className="text-xs text-black/50">Aucune tâche.</p>
                ) : (
                  items.map((task) => (
                    <button className="w-full rounded-lg border border-black/10 bg-white px-2 py-1 text-left text-xs" key={task.id} onClick={() => setOpenedTask(task)} type="button">
                      {task.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate ? (
        <div className="rounded-2xl border border-white/30 bg-white/80 p-4 backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-black">
              {format(selectedDate, "EEEE d MMMM", { locale: fr })}
            </p>
            <button className="text-xs underline" onClick={() => setSelectedDate(null)} type="button">
              Fermer
            </button>
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {selectedTasks.length === 0 ? (
              <p className="text-xs text-black/55">Aucune tâche pour ce jour.</p>
            ) : (
              selectedTasks.map((task) => (
                <div className="rounded-lg border border-black/10 bg-white/85 p-2" key={task.id}>
                  <div className="flex items-center justify-between gap-2">
                    <button className="text-left text-sm font-medium text-black" onClick={() => setOpenedTask(task)} type="button">
                      {task.title}
                    </button>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase text-white ${priorityBar[task.priority].replace('/70','')}`}>
                      {task.priority}
                    </span>
                  </div>
                  <label className="mt-1 flex items-center gap-2 text-xs text-black/65">
                    <input checked={task.status === "done"} onChange={(event) => toggleDone(task, event.target.checked)} type="checkbox" />
                    Marquer comme terminée
                  </label>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {openedTask ? (
        <div className="rounded-2xl border border-black/15 bg-white/90 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-black">{openedTask.title}</h4>
            <button className="text-xs underline" onClick={() => setOpenedTask(null)} type="button">Fermer</button>
          </div>
          <p className="mt-2 text-xs text-black/70">Priorité: {openedTask.priority}</p>
          <p className="mt-1 text-sm text-black/80">{openedTask.description ?? "Aucune description."}</p>
          {openedTask.dueDate ? <p className="mt-2 text-xs text-black/60">Échéance: {new Date(openedTask.dueDate).toLocaleString("fr-FR")}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
