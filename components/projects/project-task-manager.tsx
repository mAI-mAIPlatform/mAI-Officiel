"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangleIcon,
  BotIcon,
  ChevronDown,
  ChevronUp,
  MessageSquareText,
  MoreHorizontalIcon,
  PinIcon,
  SquarePenIcon,
  Trash2Icon,
  UserCircle2,
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
import { ProjectMemberMentionInput } from "./project-member-mention-input";

type TaskStatus = "todo" | "doing" | "done";
type TaskPriority = "low" | "medium" | "high";
type TaskRepeat = "none" | "daily" | "weekly" | "monthly" | "custom";

type Member = { id: string; name: string | null; image: string | null };

type SubtaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "done";
  sortOrder: number;
};

type CommentItem = {
  id: string;
  authorId: string;
  authorName: string | null;
  authorImage: string | null;
  content: string;
  createdAt: string;
  isAiGenerated: boolean;
};

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
  assigneeType: "user" | "ai";
  assigneeId: string | null;
  assignee: Member | null;
  subtasks: SubtaskItem[];
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

const defaultForm: FormState = {
  title: "",
  description: "",
  dueDate: "",
  status: "todo",
  priority: "medium",
  repeatType: "none",
  repeatInterval: "1",
};

function getInitials(name: string | null | undefined) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ProjectTaskManager({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [commentsByTask, setCommentsByTask] = useState<Record<string, CommentItem[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedSubtaskDescription, setExpandedSubtaskDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(defaultForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks?sortBy=dueDate&order=asc`);
      if (!response.ok) throw new Error();
      const data = (await response.json()) as TaskItem[];
      setTasks(data);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    const response = await fetch(`/api/projects/${projectId}/members`);
    if (response.ok) {
      setMembers((await response.json()) as Member[]);
    }
  };

  const loadComments = async (taskId: string) => {
    const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/comments`);
    if (!response.ok) return;
    const comments = (await response.json()) as CommentItem[];
    setCommentsByTask((previous) => ({ ...previous, [taskId]: comments }));
  };

  useEffect(() => {
    loadTasks();
    loadMembers();
  }, [projectId]);

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1)),
    [tasks]
  );

  const upsertTask = async () => {
    if (!formState.title.trim()) return;

    const payload = {
      title: formState.title,
      description: formState.description || undefined,
      dueDate: formState.dueDate ? new Date(formState.dueDate).toISOString() : null,
      status: formState.status,
      priority: formState.priority,
      repeatType: formState.repeatType,
      repeatInterval: formState.repeatType === "custom" ? Number(formState.repeatInterval || "1") : null,
    };

    const response = await fetch(
      editingTaskId
        ? `/api/projects/${projectId}/tasks/${editingTaskId}`
        : `/api/projects/${projectId}/tasks`,
      {
        method: editingTaskId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) return toast.error("Impossible d'enregistrer la tâche.");

    setIsModalOpen(false);
    setEditingTaskId(null);
    setFormState(defaultForm);
    await loadTasks();
  };

  const assignTask = async (taskId: string, assigneeType: "user" | "ai", assigneeId: string | null) => {
    const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeType, assigneeId }),
    });
    if (!response.ok) return toast.error("Assignation impossible.");
    await loadTasks();
  };

  const updateSubtask = async (
    taskId: string,
    subtaskId: string,
    payload: Partial<Pick<SubtaskItem, "status" | "description" | "sortOrder">>
  ) => {
    const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return;
    await loadTasks();
  };

  const reorderSubtask = async (task: TaskItem, subtask: SubtaskItem, direction: "up" | "down") => {
    const sorted = [...task.subtasks].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex((item) => item.id === subtask.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const other = sorted[targetIndex];
    await updateSubtask(task.id, subtask.id, { sortOrder: other.sortOrder });
    await updateSubtask(task.id, other.id, { sortOrder: subtask.sortOrder });
  };

  const postComment = async (taskId: string) => {
    const content = (commentInputs[taskId] ?? "").trim();
    if (!content) return;

    const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) return toast.error("Impossible d'ajouter le commentaire.");

    setCommentInputs((previous) => ({ ...previous, [taskId]: "" }));
    await loadComments(taskId);
  };

  return (
    <article className="liquid-panel rounded-2xl border border-white/30 bg-white/80 p-5 text-black shadow-xl backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tâches du projet</h2>
        <Dialog onOpenChange={setIsModalOpen} open={isModalOpen}>
          <DialogTrigger asChild>
            <Button className="border border-black/20 bg-cyan-200 text-black hover:bg-cyan-300" type="button">
              + Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="liquid-panel border-white/25 bg-white/85 text-black">
            <DialogHeader>
              <DialogTitle>{editingTaskId ? "Modifier la tâche" : "Créer une tâche"}</DialogTitle>
              <DialogDescription className="text-black/70">Gestion complète des tâches.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <input className="rounded-lg border border-black/20 bg-white/90 px-3 py-2 text-sm" placeholder="Titre" value={formState.title} onChange={(event)=>setFormState((p)=>({...p,title:event.target.value}))} />
              <textarea className="rounded-lg border border-black/20 bg-white/90 px-3 py-2 text-sm" placeholder="Description" value={formState.description} onChange={(event)=>setFormState((p)=>({...p,description:event.target.value}))} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={()=>setIsModalOpen(false)} type="button">Annuler</Button>
              <Button onClick={upsertTask} type="button">{editingTaskId ? "Sauvegarder" : "Créer"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 space-y-4">
        {isLoading ? <p className="text-sm text-black/70">Chargement...</p> : null}

        {sortedTasks.map((task) => {
          const completedSubtasks = task.subtasks.filter((subtask) => subtask.status === "done").length;
          const sortedSubtasks = [...task.subtasks].sort((a, b) => a.sortOrder - b.sortOrder);
          const comments = commentsByTask[task.id] ?? [];

          return (
            <div className="rounded-xl border border-black/15 bg-white/85 p-3" key={task.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="mt-0.5" type="button">
                        {task.assigneeType === "ai" ? (
                          <span className="flex size-8 items-center justify-center rounded-full bg-violet-100 text-violet-700"><BotIcon className="size-4" /></span>
                        ) : task.assignee ? (
                          task.assignee.image ? (
                            <img alt="Assignee" className="size-8 rounded-full border border-black/15 object-cover" src={task.assignee.image} />
                          ) : (
                            <span className="flex size-8 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-900">{getInitials(task.assignee.name)}</span>
                          )
                        ) : (
                          <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-black/30 text-black/45"><UserCircle2 className="size-4" /></span>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-white/95">
                      <DropdownMenuItem onClick={() => assignTask(task.id, "ai", null)}>
                        <BotIcon className="mr-2 size-4" /> Assigner à l'IA
                      </DropdownMenuItem>
                      {members.map((member) => (
                        <DropdownMenuItem key={member.id} onClick={() => assignTask(task.id, "user", member.id)}>
                          {member.name ?? member.id}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuItem onClick={() => assignTask(task.id, "user", null)}>
                        Non assignée
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-black/60">{task.priority.toUpperCase()} • {task.status.toUpperCase()}</p>
                    <p className="text-xs text-black/55">{completedSubtasks} sur {task.subtasks.length} terminées</p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-8 border border-black/20 bg-white px-2 text-black" size="icon" type="button" variant="ghost">
                      <MoreHorizontalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/95">
                    <DropdownMenuItem onClick={() => setTasks((prev) => prev.map((item) => item.id === task.id ? { ...item, isPinned: !item.isPinned } : item))}><PinIcon className="mr-2 size-4" /> Épingler</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setEditingTaskId(task.id); setFormState({ ...defaultForm, title: task.title, description: task.description ?? "" }); setIsModalOpen(true); }}><SquarePenIcon className="mr-2 size-4" /> Modifier</DropdownMenuItem>
                    <DropdownMenuItem onClick={async()=>{ await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {method:"DELETE"}); await loadTasks(); }}><Trash2Icon className="mr-2 size-4" /> Supprimer</DropdownMenuItem>
                    <DropdownMenuItem><AlertTriangleIcon className="mr-2 size-4" /> Signaler...</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-3 space-y-2 rounded-lg border border-black/10 bg-white/70 p-2">
                {sortedSubtasks.map((subtask) => (
                  <div className="rounded-lg border border-black/10 bg-white/80 p-2" key={subtask.id}>
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          checked={subtask.status === "done"}
                          onChange={(event) => updateSubtask(task.id, subtask.id, { status: event.target.checked ? "done" : "todo" })}
                          type="checkbox"
                        />
                        {subtask.title}
                      </label>
                      <div className="flex items-center gap-1">
                        <button className="rounded border border-black/15 p-1" onClick={() => reorderSubtask(task, subtask, "up")} type="button"><ChevronUp className="size-3" /></button>
                        <button className="rounded border border-black/15 p-1" onClick={() => reorderSubtask(task, subtask, "down")} type="button"><ChevronDown className="size-3" /></button>
                      </div>
                    </div>
                    <button className="mt-1 text-xs text-cyan-700 underline" onClick={() => setExpandedSubtaskDescription(expandedSubtaskDescription === subtask.id ? null : subtask.id)} type="button">
                      {expandedSubtaskDescription === subtask.id ? "Masquer la description" : "Ajouter / éditer la description"}
                    </button>
                    {expandedSubtaskDescription === subtask.id ? (
                      <textarea
                        className="mt-1 min-h-16 w-full rounded border border-black/15 bg-white p-2 text-xs"
                        defaultValue={subtask.description ?? ""}
                        onBlur={(event) => updateSubtask(task.id, subtask.id, { description: event.target.value || null })}
                      />
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-lg border border-black/10 bg-white/70 p-2">
                <div className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-black/60">
                  <MessageSquareText className="size-3" /> Commentaires
                </div>
                <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <button className="text-left text-xs text-black/50 underline" onClick={() => loadComments(task.id)} type="button">Charger les commentaires</button>
                  ) : (
                    comments.map((comment) => (
                      <div className="rounded border border-black/10 bg-white/85 p-2" key={comment.id}>
                        <div className="flex items-center gap-2 text-[11px] text-black/60">
                          <span className="font-semibold text-black/75">{comment.authorName ?? "Utilisateur"}</span>
                          {comment.isAiGenerated ? <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">IA</span> : null}
                          <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}</span>
                        </div>
                        <p className="mt-1 text-xs text-black/80">
                          {comment.content.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, index) => {
                            const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                            if (!match) {
                              return <span key={`${comment.id}-${index}`}>{part}</span>;
                            }
                            return (
                              <a
                                className="underline"
                                href={match[2]}
                                key={`${comment.id}-${index}`}
                              >
                                {match[1]}
                              </a>
                            );
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <ProjectMemberMentionInput
                    className="h-9 flex-1 rounded-lg border border-black/15 bg-white px-2 text-xs"
                    onChange={(next) => setCommentInputs((prev) => ({ ...prev, [task.id]: next }))}
                    placeholder="Ajouter un commentaire... (mentionnez avec @)"
                    projectId={projectId}
                    value={commentInputs[task.id] ?? ""}
                  />
                  <button className="rounded-lg border border-cyan-400/30 bg-cyan-200/70 px-3 text-xs" onClick={() => postComment(task.id)} type="button">Envoyer</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
