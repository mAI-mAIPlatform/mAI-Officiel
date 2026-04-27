"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectColorPicker } from "./project-color-picker";
import { ProjectIconPicker } from "./project-icon-picker";

type ProjectFormProps = {
  mode: "create" | "edit";
  initialValues?: {
    id: string;
    name: string;
    description?: string | null;
    instructions: string | null;
    tags?: string[];
    templateId?: string | null;
    icon?: string | null;
    color?: string | null;
  };
};

export function ProjectForm({ mode, initialValues }: ProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [instructions, setInstructions] = useState(
    initialValues?.instructions ?? ""
  );
  const [tags, setTags] = useState((initialValues?.tags ?? []).join(", "));
  const [icon, setIcon] = useState(initialValues?.icon ?? "folder");
  const [color, setColor] = useState<string | null>(initialValues?.color ?? "#0EA5E9");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Le nom du projet est obligatoire.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const endpoint =
      mode === "create"
        ? initialValues?.templateId
          ? "/api/projects/from-template"
          : "/api/projects"
        : `/api/projects/${initialValues?.id}`;
    const method = mode === "create" ? "POST" : "PUT";
    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload =
      mode === "create"
        ? {
            name,
            description,
            instructions,
            tags: parsedTags,
            icon,
            color,
            templateId: initialValues?.templateId,
          }
        : { name, description, instructions, tags: parsedTags, icon, color };

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setIsSaving(false);
      setError("Impossible d'enregistrer le projet.");
      return;
    }

    router.push("/projects");
    router.refresh();
  };

  return (
    <form
      className="liquid-panel mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-white/30 bg-white/85 p-6 text-black backdrop-blur-2xl"
      onSubmit={onSubmit}
    >
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="project-name">
          Nom du projet
        </label>
        <input
          className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-cyan-500"
          id="project-name"
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex: Refonte produit Q3"
          required
          value={name}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="project-description">
          Description (Markdown basique)
        </label>
        <textarea
          className="min-h-24 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-cyan-500"
          id="project-description"
          maxLength={5000}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Résumé du projet..."
          value={description}
        />
        <p className="text-xs text-black/55">
          Supporte **gras**, *italique* et listes markdown simples.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="project-instructions">
          Instructions globales
        </label>
        <textarea
          className="min-h-40 rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-cyan-500"
          id="project-instructions"
          maxLength={5000}
          onChange={(event) => setInstructions(event.target.value)}
          placeholder="Contexte, ton et contraintes du projet..."
          value={instructions}
        />
      </div>

      <ProjectIconPicker onChange={setIcon} value={icon} />
      <ProjectColorPicker onChange={setColor} value={color} />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="project-tags">
          Tags (séparés par des virgules)
        </label>
        <input
          className="rounded-xl border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-cyan-500"
          id="project-tags"
          onChange={(event) => setTags(event.target.value)}
          placeholder="frontend, sprint, client"
          value={tags}
        />
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <button
        className="rounded-xl border border-cyan-400/40 bg-cyan-200/80 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-300/80 disabled:opacity-50"
        disabled={isSaving}
        type="submit"
      >
        {isSaving
          ? "Enregistrement..."
          : mode === "create"
            ? "Créer le projet"
            : "Mettre à jour"}
      </button>
    </form>
  );
}
