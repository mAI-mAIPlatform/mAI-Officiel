"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { chatModels } from "@/lib/ai/models";
import { ProjectColorPicker } from "./project-color-picker";
import { ProjectIconPicker } from "./project-icon-picker";

type NotificationSettings = {
  deadlineReminders: boolean;
  taskAssignment: boolean;
  commentAdded: boolean;
  taskCompleted: boolean;
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  deadlineReminders: true,
  taskAssignment: true,
  commentAdded: true,
  taskCompleted: true,
};

type ProjectAdvancedSettingsProps = {
  project: {
    id: string;
    name: string;
    description: string | null;
    instructions: string | null;
    aiModel: string | null;
    systemInstructions: string | null;
    notificationSettings: NotificationSettings | null;
    tags: string[];
    icon: string | null;
    color: string | null;
  };
};

export function ProjectAdvancedSettings({ project }: ProjectAdvancedSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [instructions, setInstructions] = useState(project.instructions ?? "");
  const [tags, setTags] = useState((project.tags ?? []).join(", "));
  const [aiModel, setAiModel] = useState(project.aiModel ?? "");
  const [systemInstructions, setSystemInstructions] = useState(
    project.systemInstructions ?? ""
  );
  const [icon, setIcon] = useState(project.icon ?? "folder");
  const [color, setColor] = useState<string | null>(project.color ?? "#0EA5E9");
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    project.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedModels = useMemo(
    () => [...chatModels].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const save = async () => {
    setIsSaving(true);
    setError(null);

    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        instructions,
        tags: parsedTags,
        aiModel: aiModel || null,
        systemInstructions: systemInstructions || null,
        notificationSettings,
        icon: icon || null,
        color,
      }),
    });

    if (!response.ok) {
      setError("Impossible de sauvegarder les paramètres avancés.");
      setIsSaving(false);
      return;
    }

    router.push(`/projects/${project.id}`);
    router.refresh();
  };

  const removeProject = async () => {
    setIsDeleting(true);
    setError(null);

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Impossible de supprimer ce projet.");
      setIsDeleting(false);
      return;
    }

    router.push("/projects");
    router.refresh();
  };

  const notificationItems: Array<{ key: keyof NotificationSettings; label: string }> = [
    { key: "deadlineReminders", label: "Rappels de deadline" },
    { key: "taskAssignment", label: "Assignation de tâche" },
    { key: "commentAdded", label: "Commentaire ajouté" },
    { key: "taskCompleted", label: "Complétion de tâche" },
  ];

  return (
    <section className="space-y-4">
      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
        <h2 className="text-base font-semibold">Général</h2>
        <div className="mt-3 grid gap-3">
          <input
            className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
            onChange={(event) => setName(event.target.value)}
            placeholder="Nom du projet"
            value={name}
          />
          <textarea
            className="min-h-20 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            value={description}
          />
          <p className="text-xs text-black/55">
            Support Markdown basique: **gras**, *italique*, listes.
          </p>
          <textarea
            className="min-h-28 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Instructions globales"
            value={instructions}
          />
          <input
            className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
            onChange={(event) => setTags(event.target.value)}
            placeholder="Tags séparés par des virgules"
            value={tags}
          />
          <ProjectIconPicker onChange={setIcon} value={icon} />
          <ProjectColorPicker onChange={setColor} value={color} />
        </div>
      </article>

      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
        <h2 className="text-base font-semibold">Modèle IA</h2>
        <select
          className="mt-3 h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
          onChange={(event) => setAiModel(event.target.value)}
          value={aiModel}
        >
          <option value="">Modèle par défaut</option>
          {sortedModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </article>

      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
        <h2 className="text-base font-semibold">Instructions système</h2>
        <textarea
          className="mt-3 min-h-36 w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm"
          onChange={(event) => setSystemInstructions(event.target.value)}
          placeholder="Règles persistantes injectées dans chaque chat du projet"
          value={systemInstructions}
        />
      </article>

      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
        <h2 className="text-base font-semibold">Notifications</h2>
        <div className="mt-3 space-y-2">
          {notificationItems.map((item) => (
            <label
              className="flex items-center justify-between rounded-xl border border-black/10 bg-white/75 p-3"
              key={item.key}
            >
              <span className="text-sm">{item.label}</span>
              <input
                checked={notificationSettings[item.key]}
                onChange={(event) =>
                  setNotificationSettings((prev) => ({
                    ...prev,
                    [item.key]: event.target.checked,
                  }))
                }
                type="checkbox"
              />
            </label>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-red-400/50 bg-red-100/70 p-5 text-black">
        <h2 className="text-base font-semibold text-red-800">Zone dangereuse</h2>
        <p className="mt-1 text-sm text-red-900/80">
          Cette action supprime définitivement le projet et ses données associées.
        </p>
        <button
          className="mt-3 rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          disabled={isDeleting}
          onClick={removeProject}
          type="button"
        >
          {isDeleting ? "Suppression..." : "Supprimer ce projet"}
        </button>
      </article>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        className="rounded-xl border border-cyan-400/40 bg-cyan-200/80 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-300/80 disabled:opacity-50"
        disabled={isSaving || !name.trim()}
        onClick={save}
        type="button"
      >
        {isSaving ? "Sauvegarde..." : "Enregistrer les paramètres avancés"}
      </button>
    </section>
  );
}
