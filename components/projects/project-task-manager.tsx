"use client";

import {
  AlertTriangleIcon,
  MoreHorizontalIcon,
  PinIcon,
  SquarePenIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TaskStatus = "todo" | "doing" | "done";
type TaskPriority = "low" | "medium" | "high";
type TaskRepeat = "none" | "daily" | "weekly" | "monthly" | "custom";

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  repeatType: TaskRepeat;
  repeatInterval: number | null;
  progression: number;
  isOverdue: boolean;
  isPinned?: boolean;
  isLocalOnly?: boolean;
};

type FormState = {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  repeatType: TaskRepeat;
  repeatInterval: string;
};

const priorityWeight: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

const statusWeight: Record<TaskStatus, number> = {
  todo: 0,
  doing: 1,
  done: 2,
};

const defaultForm: FormState = {
  title: "",
  description: "",
  dueDate: "",
  status: "todo",
  priority: "medium",
  repeatType: "none",
  repeatInterval: "1",
};

function getStorageKey(projectId: string) {
  return `mai.project.tasks.local.${projectId}`;
}

function normalizeTask(task: Partial<TaskItem>): TaskItem {
  return {
    id: task.id ?? crypto.randomUUID(),
    title: task.title ?? "Tâche sans titre",
    description: task.description ?? null,
    dueDate: task.dueDate ?? null,
    status: task.status ?? "todo",
    priority: task.priority ?? "medium",
    repeatType: task.repeatType ?? "none",
    repeatInterval: task.repeatInterval ?? null,
    progression: task.progression ?? (task.status === "done" ? 1 : 0),
    isOverdue: Boolean(task.isOverdue),
    isPinned: Boolean(task.isPinned),
    isLocalOnly: Boolean(task.isLocalOnly),
  };
}

export function ProjectTaskManager({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "status">(
    "dueDate"
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(defaultForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const storageKey = useMemo(() => getStorageKey(projectId), [projectId]);

  // Fallback localStorage: on garde les tâches même si l'API retourne une erreur.
  const persistLocalTasks = (nextTasks: TaskItem[]) => {
    localStorage.setItem(storageKey, JSON.stringify(nextTasks));
  };

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks?sortBy=${sortBy}&order=asc`
      );

      if (!response.ok) {
        throw new Error("API error");
      }

      const remoteTasks = (await response.json()) as TaskItem[];
      const normalizedRemote = remoteTasks.map((task) => normalizeTask(task));

      const rawLocal = localStorage.getItem(storageKey);
      const localTasks = rawLocal
        ? ((JSON.parse(rawLocal) as TaskItem[]).map((task) =>
            normalizeTask({ ...task, isLocalOnly: true })
          ) as TaskItem[])
        : [];

      const merged = [...normalizedRemote, ...localTasks];
      setTasks(merged);
      toast.success("Tâches synchronisées.");
    } catch {
      const rawLocal = localStorage.getItem(storageKey);
      const localTasks = rawLocal
        ? ((JSON.parse(rawLocal) as TaskItem[]).map((task) =>
            normalizeTask({ ...task, isLocalOnly: true })
          ) as TaskItem[])
        : [];
      setTasks(localTasks);
      toast.warning("Mode local activé : création/édition hors ligne.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [projectId, sortBy]);

  const sortedTasks = useMemo(() => {
    const copy = [...tasks];

    copy.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      if (sortBy === "priority") {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }

      if (sortBy === "status") {
        return statusWeight[a.status] - statusWeight[b.status];
      }

      if (!a.dueDate && !b.dueDate) {
        return 0;
      }

      if (!a.dueDate) {
        return 1;
      }

      if (!b.dueDate) {
        return -1;
      }

      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return copy;
  }, [tasks, sortBy]);

  const resetForm = () => {
    setFormState(defaultForm);
    setEditingTaskId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTaskId(task.id);
    setFormState({
      title: task.title,
      description: task.description ?? "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 16)
        : "",
      status: task.status,
      priority: task.priority,
      repeatType: task.repeatType,
      repeatInterval: String(task.repeatInterval ?? 1),
    });
    setIsModalOpen(true);
  };

  const upsertTask = async () => {
    if (!formState.title.trim()) {
      toast.error("Le titre est obligatoire.");
      return;
    }

    const payload = {
      title: formState.title,
      description: formState.description || undefined,
      dueDate: formState.dueDate ? new Date(formState.dueDate).toISOString() : null,
      status: formState.status,
      priority: formState.priority,
      repeatType: formState.repeatType,
      repeatInterval:
        formState.repeatType === "custom"
          ? Number(formState.repeatInterval || "1")
          : null,
    };

    const isEditing = Boolean(editingTaskId);

    try {
      const response = await fetch(
        isEditing
          ? `/api/projects/${projectId}/tasks/${editingTaskId}`
          : `/api/projects/${projectId}/tasks`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("API error");
      }

      await loadTasks();
      toast.success(isEditing ? "Tâche modifiée." : "Tâche créée.");
      closeModal();
    } catch {
      // Fallback local si l'API est indisponible ou renvoie une erreur.
      const localTask = normalizeTask({
        id: editingTaskId ?? `local-${crypto.randomUUID()}`,
        ...payload,
        isOverdue:
          payload.dueDate !== null && payload.status !== "done"
            ? new Date(payload.dueDate).getTime() < Date.now()
            : false,
        isLocalOnly: true,
      });

      const nextTasks = isEditing
        ? tasks.map((task) => (task.id === editingTaskId ? localTask : task))
        : [...tasks, localTask];

      setTasks(nextTasks);
      persistLocalTasks(nextTasks.filter((task) => task.isLocalOnly));
      toast.warning("API indisponible : tâche enregistrée en local.");
      closeModal();
    }
  };

  const deleteTask = async (task: TaskItem) => {
    try {
      if (!task.isLocalOnly) {
        const response = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Delete error");
        }
      }

      const nextTasks = tasks.filter((item) => item.id !== task.id);
      setTasks(nextTasks);
      persistLocalTasks(nextTasks.filter((item) => item.isLocalOnly));
      toast.success("Tâche supprimée.");
    } catch {
      toast.error("Impossible de supprimer cette tâche.");
    }
  };

  const togglePin = (task: TaskItem) => {
    const nextTasks = tasks.map((item) =>
      item.id === task.id ? { ...item, isPinned: !item.isPinned } : item
    );
    setTasks(nextTasks);
    persistLocalTasks(nextTasks.filter((item) => item.isLocalOnly));
    toast.success(task.isPinned ? "Tâche désépinglée." : "Tâche épinglée.");
  };

  const reportTask = (task: TaskItem) => {
    const reportsRaw = localStorage.getItem("mai.reports.tasks");
    const reports = reportsRaw ? (JSON.parse(reportsRaw) as Array<unknown>) : [];
    const nextReports = [
      {
        taskId: task.id,
        projectId,
        title: task.title,
        createdAt: new Date().toISOString(),
      },
      ...reports,
    ];

    localStorage.setItem("mai.reports.tasks", JSON.stringify(nextReports));
    toast.success("Tâche signalée.");
  };

  return (
    <article className="liquid-panel rounded-2xl border border-white/30 bg-white/80 p-5 text-black shadow-xl backdrop-blur-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Tâches du projet</h2>
          <p className="text-sm text-black/70">
            Créez vos tâches dans une fenêtre contextuelle, avec fallback local.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-black/20 bg-white/80 px-3 py-2 text-sm"
            onChange={(event) =>
              setSortBy(event.target.value as "dueDate" | "priority" | "status")
            }
            value={sortBy}
          >
            <option value="dueDate">Tri date</option>
            <option value="priority">Tri priorité</option>
            <option value="status">Tri statut</option>
          </select>

          <Dialog onOpenChange={setIsModalOpen} open={isModalOpen}>
            <DialogTrigger asChild>
              <Button
                className="border border-black/20 bg-cyan-200 text-black hover:bg-cyan-300"
                onClick={openCreateModal}
                type="button"
              >
                + Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="liquid-panel border-white/25 bg-white/85 text-black backdrop-blur-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTaskId ? "Modifier la tâche" : "Créer une tâche"}
                </DialogTitle>
                <DialogDescription className="text-black/70">
                  Formulaire compact en modal (Liquid Glass).
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-2">
                <input
                  className="rounded-lg border border-black/20 bg-white/90 px-3 py-2 text-sm"
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Titre"
                  value={formState.title}
                />
                <textarea
                  className="rounded-lg border border-black/20 bg-white/90 px-3 py-2 text-sm"
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Description"
                  value={formState.description}
                />
                <input
                  className="rounded-lg border border-black/20 bg-white/90 px-3 py-2 text-sm"
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      dueDate: event.target.value,
                    }))
                  }
                  type="datetime-local"
                  value={formState.dueDate}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="rounded-lg border border-black/20 bg-white/90 px-3 py-2 text-sm"
                    onChange={(event) =>
                      setFormState((previous) => ({
                        ...previous,
                        status: event.target.value as TaskStatus,
                      }))
                    }
                    value={formState.status}
                  >
                    <option value="todo">À faire</option>
                    <option value="doing">En cours</option>
                    <option value="done">Terminée</option>
                  </select>
                  <select
                    className="rounded-lg border border-black/20 bg-white/90 px-3 py-2 text-sm"
                    onChange={(event) =>
                      setFormState((previous) => ({
                        ...previous,
                        priority: event.target.value as TaskPriority,
                      }))
                    }
                    value={formState.priority}
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="rounded-lg border border-black/20 bg-white/90 px-3 py-2 text-sm"
                    onChange={(event) =>
                      setFormState((previous) => ({
                        ...previous,
                        repeatType: event.target.value as TaskRepeat,
                      }))
                    }
                    value={formState.repeatType}
                  >
                    <option value="none">Pas de répétition</option>
                    <option value="daily">Quotidienne</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuelle</option>
                    <option value="custom">Personnalisée</option>
                  </select>
                  {formState.repeatType === "custom" ? (
                    <input
                      className="rounded-lg border border-black/20 bg-white/90 px-3 py-2 text-sm"
                      min={1}
                      onChange={(event) =>
                        setFormState((previous) => ({
                          ...previous,
                          repeatInterval: event.target.value,
                        }))
                      }
                      placeholder="Intervalle"
                      type="number"
                      value={formState.repeatInterval}
                    />
                  ) : (
                    <div />
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  className="border border-black/20 bg-white text-black hover:bg-black/5"
                  onClick={closeModal}
                  type="button"
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button
                  className="border border-black/20 bg-cyan-200 text-black hover:bg-cyan-300"
                  onClick={upsertTask}
                  type="button"
                >
                  {editingTaskId ? "Sauvegarder" : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? <p className="text-sm text-black/70">Chargement...</p> : null}

        {sortedTasks.length === 0 && !isLoading ? (
          <p className="rounded-xl border border-dashed border-black/25 bg-white/75 p-3 text-sm text-black/70">
            Aucune tâche pour ce projet. Utilisez le bouton « + Nouvelle tâche ».
          </p>
        ) : null}

        {sortedTasks.map((task) => (
          <div className="rounded-xl border border-black/15 bg-white/85 p-3" key={task.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {task.isPinned ? "📌 " : ""}
                  {task.title}
                </p>
                <p className="text-xs text-black/60">
                  {task.priority.toUpperCase()} • {task.status.toUpperCase()} • {task.repeatType.toUpperCase()}
                  {task.isLocalOnly ? " • Local" : ""}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="h-8 border border-black/20 bg-white px-2 text-black hover:bg-black/5"
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="liquid-panel bg-white/95">
                  <DropdownMenuItem onClick={() => togglePin(task)}>
                    <PinIcon className="mr-2 size-4" />
                    Épingler
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEditModal(task)}>
                    <SquarePenIcon className="mr-2 size-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteTask(task)}>
                    <Trash2Icon className="mr-2 size-4" />
                    Supprimer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => reportTask(task)}>
                    <AlertTriangleIcon className="mr-2 size-4" />
                    Signaler...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.description ? (
              <p className="mt-2 text-sm text-black/80">{task.description}</p>
            ) : null}

            <p className="mt-2 text-xs text-black/70">
              Échéance : {task.dueDate ? new Date(task.dueDate).toLocaleString("fr-FR") : "Aucune"}
              {task.isOverdue ? " • En retard" : ""}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
