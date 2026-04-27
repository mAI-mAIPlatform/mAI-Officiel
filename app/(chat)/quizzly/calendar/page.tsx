"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Plus, MessageSquare, CheckCircle2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const CALENDAR_TASKS_KEY = "mai.quizzly.calendar.tasks.v2";

type RevisionTask = {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  done: boolean;
  subtasks: Array<{ id: string; title: string; done: boolean }>;
  messages: string[];
};

export default function QuizzlyCalendarPage() {
  const [tasks, setTasks] = useState<RevisionTask[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Mathématiques");
  const [dueDate, setDueDate] = useState("");
  const [aiLoadingTaskId, setAiLoadingTaskId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CALENDAR_TASKS_KEY) ?? "[]") as RevisionTask[];
      if (Array.isArray(parsed)) setTasks(parsed);
    } catch {
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CALENDAR_TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const progress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const done = tasks.filter((task) => task.done).length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  const addTask = () => {
    if (!title.trim()) return toast.error("Ajoute un titre de tâche.");
    setTasks((prev) => [
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        subject,
        dueDate,
        done: false,
        subtasks: [],
        messages: [],
      },
      ...prev,
    ]);
    setTitle("");
    setDueDate("");
  };

  const addSubtask = (taskId: string) => {
    const value = prompt("Titre de la sous-tâche ?")?.trim();
    if (!value) return;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? { ...task, subtasks: [...task.subtasks, { id: crypto.randomUUID(), title: value, done: false }] }
          : task
      )
    );
  };

  const toggleTask = (taskId: string) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask)),
            }
          : task
      )
    );
  };

  const addMessage = (taskId: string) => {
    const value = prompt("Message / note de révision")?.trim();
    if (!value) return;
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, messages: [value, ...task.messages].slice(0, 8) } : task)));
  };

  const planWithAI = async (task: RevisionTask) => {
    setAiLoadingTaskId(task.id);
    try {
      const res = await fetch("/api/quizzly/encouragement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: "Élève", score: 0, total: 10, subject: task.subject }),
      });
      const data = (await res.json()) as { text?: string; message?: string };
      const aiText = data.text ?? data.message ?? "Plan IA: 20 min notions clés + 15 min exercices + 10 min correction active.";
      setTasks((prev) => prev.map((item) => (item.id === task.id ? { ...item, messages: [`🤖 ${aiText}`, ...item.messages].slice(0, 8) } : item)));
      toast.success("Planning IA ajouté à la tâche.");
    } catch {
      toast.error("Impossible de générer un planning IA.");
    } finally {
      setAiLoadingTaskId(null);
    }
  };

  const createAutoQuiz = (task: RevisionTask) => {
    const payload = {
      grade: "3ème",
      subject: task.subject,
      difficulty: "Facile",
      count: 10,
      chapter: task.title,
      themePrompt: `Plan de révision: ${task.title}`,
      questionTypes: ["qcm"],
    };
    localStorage.setItem("mai.quizzly.quick-start.quiz.v1", JSON.stringify(payload));
    toast.success("Quiz automatique préparé. Lance-le depuis Jouer.");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-slate-800">Calendrier de révisions & planning</h1>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-600">Progression globale du planning</p>
        <div className="mt-2 h-3 rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs font-bold text-violet-700">{progress}% complété</p>
      </div>

      <div className="grid gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-4">
        <input className="rounded-xl border border-slate-200 px-3 py-2" onChange={(e) => setTitle(e.target.value)} placeholder="Tâche de révision" value={title} />
        <select className="rounded-xl border border-slate-200 px-3 py-2" onChange={(e) => setSubject(e.target.value)} value={subject}>
          {["Mathématiques", "Français", "Histoire", "Géographie", "Sciences", "Anglais"].map((item) => <option key={item}>{item}</option>)}
        </select>
        <input className="rounded-xl border border-slate-200 px-3 py-2" onChange={(e) => setDueDate(e.target.value)} type="date" value={dueDate} />
        <button className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white" onClick={addTask} type="button"><Plus className="mr-1 inline h-4 w-4" /> Ajouter</button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className={`font-black ${task.done ? "text-emerald-700" : "text-slate-800"}`}>{task.title}</p>
                <p className="text-xs text-slate-500">{task.subject} • Échéance: {task.dueDate || "non définie"}</p>
              </div>
              <button className={`rounded-lg px-3 py-1 text-xs font-bold ${task.done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`} onClick={() => toggleTask(task.id)} type="button">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> {task.done ? "Terminée" : "Marquer faite"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700" onClick={() => addSubtask(task.id)} type="button">+ Sous-tâche</button>
              <button className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700" onClick={() => addMessage(task.id)} type="button"><MessageSquare className="mr-1 inline h-3.5 w-3.5" /> Message</button>
              <button className="rounded-lg bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-700" disabled={aiLoadingTaskId === task.id} onClick={() => void planWithAI(task)} type="button"><Sparkles className="mr-1 inline h-3.5 w-3.5" /> {aiLoadingTaskId === task.id ? "IA..." : "Planifier avec l'IA"}</button>
              <Link className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-bold text-violet-700" href="/quizzly/play" onClick={() => createAutoQuiz(task)}>
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> Créer quiz auto
              </Link>
            </div>

            {task.subtasks.length > 0 && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">Sous-tâches</p>
                <div className="space-y-1">
                  {task.subtasks.map((subtask) => (
                    <label key={subtask.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input checked={subtask.done} onChange={() => toggleSubtask(task.id, subtask.id)} type="checkbox" />
                      <span className={subtask.done ? "line-through text-slate-400" : ""}>{subtask.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {task.messages.length > 0 && (
              <div className="mt-3 rounded-xl border border-slate-100 p-3">
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">Messages</p>
                <ul className="space-y-1 text-xs text-slate-600">
                  {task.messages.map((message, index) => <li key={`${task.id}-msg-${index}`}>• {message}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
        {tasks.length === 0 && <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">Aucune tâche planifiée pour le moment.</p>}
      </div>
    </div>
  );
}
