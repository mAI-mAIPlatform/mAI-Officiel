"use client";

import {
  BotIcon,
  CheckIcon,
  FolderKanbanIcon,
  Loader2Icon,
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProjectTask = {
  id: string;
  title: string;
  done: boolean;
};

type ProjectFeatures = {
  sources: string[];
  knowledgeFiles: string[];
  tasks: ProjectTask[];
  linkedChatIds: string[];
  linkedAgentIds: string[];
};

type ProjectRecord = {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  instructions?: string | null;
  memory?: string | null;
  files?: unknown;
  createdAt: string;
};

type ChatRecord = {
  id: string;
  title: string;
  createdAt: string;
};

type AgentRecord = {
  id: string;
  name: string;
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur API (${response.status})`);
  }
  return (await response.json()) as T;
};

const defaultProjectFeatures = (): ProjectFeatures => ({
  sources: [],
  knowledgeFiles: [],
  tasks: [],
  linkedChatIds: [],
  linkedAgentIds: [],
});

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const normalizeTaskList = (value: unknown): ProjectTask[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const maybeTask = item as Partial<ProjectTask>;
      if (typeof maybeTask.title !== "string" || !maybeTask.title.trim()) {
        return null;
      }

      return {
        id:
          typeof maybeTask.id === "string" && maybeTask.id
            ? maybeTask.id
            : crypto.randomUUID(),
        title: maybeTask.title.trim(),
        done: Boolean(maybeTask.done),
      };
    })
    .filter((item): item is ProjectTask => item !== null);
};

const extractProjectFeatures = (rawFiles: unknown): ProjectFeatures => {
  if (Array.isArray(rawFiles)) {
    return {
      ...defaultProjectFeatures(),
      knowledgeFiles: normalizeStringList(rawFiles),
    };
  }

  if (!rawFiles || typeof rawFiles !== "object") {
    return defaultProjectFeatures();
  }

  const asObject = rawFiles as Record<string, unknown>;
  return {
    sources: normalizeStringList(asObject.sources),
    knowledgeFiles: normalizeStringList(asObject.knowledgeFiles),
    tasks: normalizeTaskList(asObject.tasks),
    linkedChatIds: normalizeStringList(asObject.linkedChatIds),
    linkedAgentIds: normalizeStringList(asObject.linkedAgentIds),
  };
};

const formatProjectFilesPayload = (features: ProjectFeatures) => ({
  schemaVersion: 1,
  sources: features.sources,
  knowledgeFiles: features.knowledgeFiles,
  tasks: features.tasks,
  linkedChatIds: features.linkedChatIds,
  linkedAgentIds: features.linkedAgentIds,
});

export default function ProjectsPage() {
  const {
    data: projects,
    error,
    mutate,
  } = useSWR<ProjectRecord[]>("/api/projects", fetcher);
  const { data: historyData } = useSWR<{ chats: ChatRecord[] }>(
    "/api/history?limit=50",
    fetcher
  );
  const { data: agents } = useSWR<AgentRecord[]>("/api/agents", fetcher);

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(
    null
  );
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);

  // Form création
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [memory, setMemory] = useState("");

  // Form paramètres
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editMemory, setEditMemory] = useState("");
  const [projectFeatures, setProjectFeatures] = useState<ProjectFeatures>(
    defaultProjectFeatures()
  );

  const [sourceInput, setSourceInput] = useState("");
  const [fileInput, setFileInput] = useState("");
  const [taskInput, setTaskInput] = useState("");

  const allChats = historyData?.chats ?? [];
  const allAgents = agents ?? [];

  const availableChats = useMemo(
    () =>
      allChats.filter(
        (chat) => !projectFeatures.linkedChatIds.includes(String(chat.id))
      ),
    [allChats, projectFeatures.linkedChatIds]
  );

  const availableAgents = useMemo(
    () =>
      allAgents.filter(
        (agent) => !projectFeatures.linkedAgentIds.includes(String(agent.id))
      ),
    [allAgents, projectFeatures.linkedAgentIds]
  );

  const resetCreateForm = () => {
    setName("");
    setDescription("");
    setInstructions("");
    setMemory("");
  };

  const openProjectSettings = (project: ProjectRecord) => {
    setSelectedProject(project);
    setEditName(project.name ?? "");
    setEditDescription(project.description ?? "");
    setEditImage(project.image ?? "");
    setEditInstructions(project.instructions ?? "");
    setEditMemory(project.memory ?? "");
    setProjectFeatures(extractProjectFeatures(project.files));
    setSourceInput("");
    setFileInput("");
    setTaskInput("");
    setIsProjectDialogOpen(true);
  };

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          instructions,
          memory,
          files: formatProjectFilesPayload(defaultProjectFeatures()),
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur de création");
      }

      toast.success("Projet créé avec succès");
      setIsOpen(false);
      resetCreateForm();
      await mutate();
    } catch (_error) {
      toast.error("Impossible de créer le projet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveProjectSettings = async () => {
    if (!selectedProject) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          image: editImage,
          instructions: editInstructions,
          memory: editMemory,
          files: formatProjectFilesPayload(projectFeatures),
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur de mise à jour");
      }

      toast.success("Projet mis à jour");
      setIsProjectDialogOpen(false);
      await mutate();
    } catch (_error) {
      toast.error("Impossible de sauvegarder les paramètres du projet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProject = async () => {
    if (!selectedProject) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Erreur de suppression");
      }

      toast.success("Projet supprimé");
      setIsProjectDialogOpen(false);
      setSelectedProject(null);
      await mutate();
    } catch (_error) {
      toast.error("Impossible de supprimer le projet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSource = () => {
    const source = sourceInput.trim();
    if (!source) {
      return;
    }

    setProjectFeatures((previous) => ({
      ...previous,
      sources: [...previous.sources, source],
    }));
    setSourceInput("");
  };

  const addKnowledgeFile = () => {
    const file = fileInput.trim();
    if (!file) {
      return;
    }

    setProjectFeatures((previous) => ({
      ...previous,
      knowledgeFiles: [...previous.knowledgeFiles, file],
    }));
    setFileInput("");
  };

  const addTask = () => {
    const task = taskInput.trim();
    if (!task) {
      return;
    }

    setProjectFeatures((previous) => ({
      ...previous,
      tasks: [
        ...previous.tasks,
        {
          id: crypto.randomUUID(),
          title: task,
          done: false,
        },
      ],
    }));
    setTaskInput("");
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col overflow-y-auto p-8 md:p-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <FolderKanbanIcon className="size-8 text-primary" />
            Mes Projets
          </h1>
          <p className="mt-2 text-muted-foreground">
            Espace de travail enrichi : paramètres, conversations, tâches,
            connaissances et mAIs liés à chaque projet.
          </p>
        </div>

        <Dialog onOpenChange={setIsOpen} open={isOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 size-4" />
              Créer un Projet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto liquid-glass">
            <DialogHeader>
              <DialogTitle>Créer un nouveau Projet</DialogTitle>
            </DialogHeader>
            <form className="mt-4 space-y-6" onSubmit={handleCreateProject}>
              <div className="space-y-2">
                <Label htmlFor="name">Titre du Projet</Label>
                <Input
                  id="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex: Refonte Site Web"
                  required
                  value={name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Bref résumé de l'objectif..."
                  rows={2}
                  value={description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">
                  Instructions de l'IA (Contexte Global)
                </Label>
                <Textarea
                  id="instructions"
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Instructions appliquées à ce projet..."
                  rows={3}
                  value={instructions}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memory">Connaissances / Sources (Texte)</Label>
                <Textarea
                  id="memory"
                  onChange={(event) => setMemory(event.target.value)}
                  placeholder="Collez ici de la documentation utile..."
                  rows={4}
                  value={memory}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  onClick={() => setIsOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Annuler
                </Button>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting && (
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                  )}
                  Créer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog onOpenChange={setIsProjectDialogOpen} open={isProjectDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto liquid-glass">
          <DialogHeader>
            <DialogTitle>Paramètres du projet</DialogTitle>
          </DialogHeader>

          {selectedProject ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="space-y-4 rounded-xl border border-border/50 bg-background/50 p-4">
                <h3 className="font-semibold">Informations</h3>

                <div className="space-y-2">
                  <Label>Nom du projet</Label>
                  <Input
                    onChange={(event) => setEditName(event.target.value)}
                    value={editName}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    onChange={(event) => setEditDescription(event.target.value)}
                    rows={2}
                    value={editDescription}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Logo (URL)</Label>
                  <Input
                    onChange={(event) => setEditImage(event.target.value)}
                    placeholder="https://..."
                    value={editImage}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instructions IA</Label>
                  <Textarea
                    onChange={(event) =>
                      setEditInstructions(event.target.value)
                    }
                    rows={3}
                    value={editInstructions}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mémoire globale</Label>
                  <Textarea
                    onChange={(event) => setEditMemory(event.target.value)}
                    rows={3}
                    value={editMemory}
                  />
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-border/50 bg-background/50 p-4">
                <h3 className="font-semibold">Connaissances</h3>

                <div className="space-y-2">
                  <Label>Sources</Label>
                  <div className="flex gap-2">
                    <Input
                      onChange={(event) => setSourceInput(event.target.value)}
                      placeholder="URL ou référence..."
                      value={sourceInput}
                    />
                    <Button
                      onClick={addSource}
                      type="button"
                      variant="secondary"
                    >
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {projectFeatures.sources.map((source) => (
                      <span
                        className="flex items-center gap-1 rounded-full border border-border/60 bg-background/70 px-2 py-1 text-xs"
                        key={source}
                      >
                        {source}
                        <button
                          onClick={() =>
                            setProjectFeatures((previous) => ({
                              ...previous,
                              sources: previous.sources.filter(
                                (item) => item !== source
                              ),
                            }))
                          }
                          type="button"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Fichiers de connaissances</Label>
                  <div className="flex gap-2">
                    <Input
                      onChange={(event) => setFileInput(event.target.value)}
                      placeholder="Nom fichier, URL Drive, Notion..."
                      value={fileInput}
                    />
                    <Button
                      onClick={addKnowledgeFile}
                      type="button"
                      variant="secondary"
                    >
                      Ajouter
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    {projectFeatures.knowledgeFiles.map((file) => (
                      <div
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-2 py-1"
                        key={file}
                      >
                        <span>{file}</span>
                        <button
                          onClick={() =>
                            setProjectFeatures((previous) => ({
                              ...previous,
                              knowledgeFiles: previous.knowledgeFiles.filter(
                                (item) => item !== file
                              ),
                            }))
                          }
                          type="button"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tâches du projet</Label>
                  <div className="flex gap-2">
                    <Input
                      onChange={(event) => setTaskInput(event.target.value)}
                      placeholder="Ajouter une tâche..."
                      value={taskInput}
                    />
                    <Button onClick={addTask} type="button" variant="secondary">
                      Ajouter
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {projectFeatures.tasks.map((task) => (
                      <button
                        className="flex w-full items-center justify-between rounded-lg border border-border/50 bg-background/60 px-2 py-1.5 text-left text-sm"
                        key={task.id}
                        onClick={() =>
                          setProjectFeatures((previous) => ({
                            ...previous,
                            tasks: previous.tasks.map((item) =>
                              item.id === task.id
                                ? { ...item, done: !item.done }
                                : item
                            ),
                          }))
                        }
                        type="button"
                      >
                        <span className={task.done ? "line-through" : ""}>
                          {task.title}
                        </span>
                        {task.done ? (
                          <CheckIcon className="size-4 text-emerald-500" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-border/50 bg-background/50 p-4">
                <h3 className="font-semibold">Conversations liées</h3>
                <div className="flex gap-2">
                  <select
                    className="h-10 w-full rounded-xl border border-border/40 bg-background/70 px-3 text-sm"
                    defaultValue=""
                    onChange={(event) => {
                      const chatId = event.target.value;
                      if (!chatId) {
                        return;
                      }

                      setProjectFeatures((previous) => ({
                        ...previous,
                        linkedChatIds: [...previous.linkedChatIds, chatId],
                      }));
                      event.target.value = "";
                    }}
                  >
                    <option value="">Sélectionner une conversation...</option>
                    {availableChats.map((chat) => (
                      <option key={chat.id} value={chat.id}>
                        {chat.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  {projectFeatures.linkedChatIds.map((chatId) => {
                    const chat = allChats.find((item) => item.id === chatId);
                    return (
                      <div
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-2 py-1 text-sm"
                        key={chatId}
                      >
                        <span>{chat?.title ?? `Conversation ${chatId}`}</span>
                        <button
                          onClick={() =>
                            setProjectFeatures((previous) => ({
                              ...previous,
                              linkedChatIds: previous.linkedChatIds.filter(
                                (item) => item !== chatId
                              ),
                            }))
                          }
                          type="button"
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-border/50 bg-background/50 p-4">
                <h3 className="font-semibold">mAIs intégrés</h3>
                <div className="flex gap-2">
                  <select
                    className="h-10 w-full rounded-xl border border-border/40 bg-background/70 px-3 text-sm"
                    defaultValue=""
                    onChange={(event) => {
                      const agentId = event.target.value;
                      if (!agentId) {
                        return;
                      }

                      setProjectFeatures((previous) => ({
                        ...previous,
                        linkedAgentIds: [...previous.linkedAgentIds, agentId],
                      }));
                      event.target.value = "";
                    }}
                  >
                    <option value="">Sélectionner un mAI...</option>
                    {availableAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  {projectFeatures.linkedAgentIds.map((agentId) => {
                    const currentAgent = allAgents.find(
                      (item) => item.id === agentId
                    );
                    return (
                      <div
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-background/60 px-2 py-1 text-sm"
                        key={agentId}
                      >
                        <span>{currentAgent?.name ?? `mAI ${agentId}`}</span>
                        <button
                          onClick={() =>
                            setProjectFeatures((previous) => ({
                              ...previous,
                              linkedAgentIds: previous.linkedAgentIds.filter(
                                (item) => item !== agentId
                              ),
                            }))
                          }
                          type="button"
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <Button
              className="text-destructive hover:bg-destructive/10"
              disabled={isSubmitting || !selectedProject}
              onClick={deleteProject}
              type="button"
              variant="ghost"
            >
              <Trash2Icon className="mr-2 size-4" />
              Supprimer le projet
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsProjectDialogOpen(false)}
                type="button"
                variant="outline"
              >
                Annuler
              </Button>
              <Button
                disabled={isSubmitting || !selectedProject}
                onClick={saveProjectSettings}
                type="button"
              >
                {isSubmitting ? (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                ) : null}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {error ? (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          Erreur lors du chargement des projets.
        </div>
      ) : projects ? (
        projects.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <FolderKanbanIcon className="mb-4 size-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Aucun projet</h3>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Vous n'avez pas encore créé de projet.
            </p>
            <Button onClick={() => setIsOpen(true)}>
              Créer mon premier Projet
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <button
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-6 text-left shadow-sm transition-all hover:shadow-md"
                key={project.id}
                onClick={() => openProjectSettings(project)}
                type="button"
              >
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {project.image ? (
                      <Image
                        alt="Logo projet"
                        className="h-8 w-8 rounded-md object-cover"
                        height={32}
                        src={project.image}
                        unoptimized
                        width={32}
                      />
                    ) : (
                      <FolderKanbanIcon className="size-6" />
                    )}
                  </div>
                  <h3 className="mb-2 font-semibold tracking-tight">
                    {project.name}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {project.description || "Aucune description."}
                  </p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <span className="text-xs text-muted-foreground">
                    Créé le {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    className="size-8"
                    onClick={(event) => {
                      event.stopPropagation();
                      openProjectSettings(project);
                    }}
                    size="icon"
                    title="Paramètres"
                    type="button"
                    variant="ghost"
                  >
                    <SettingsIcon className="size-4" />
                  </Button>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <BotIcon className="size-3.5" />
                  {extractProjectFeatures(project.files).linkedAgentIds.length}{" "}
                  mAIs · {extractProjectFeatures(project.files).tasks.length}{" "}
                  tâches
                </div>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="flex h-40 items-center justify-center">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
