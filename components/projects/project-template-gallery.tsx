"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ProjectTemplate = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  tags: string[];
  taskModels: Array<{ title: string }>;
  isPublic: boolean;
};

export function ProjectTemplateGallery({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setIsLoading(true);

    fetch("/api/project-templates")
      .then((response) => response.json())
      .then((data: ProjectTemplate[]) => setTemplates(data))
      .finally(() => setIsLoading(false));
  }, [open]);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <button
          className="rounded-xl border border-black/20 bg-white/80 px-4 py-2 text-sm font-medium text-black"
          type="button"
        >
          Créer depuis un template
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-white/90">
        <DialogHeader>
          <DialogTitle>Galerie de templates</DialogTitle>
          <DialogDescription>
            Sélectionnez un template personnel ou public pour démarrer rapidement.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-black/60">Chargement des templates…</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-black/60">Aucun template disponible.</p>
        ) : (
          <div className="grid max-h-[65vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => {
              const isMine = template.userId === userId;
              return (
                <article
                  className="rounded-2xl border border-black/10 bg-white/85 p-4"
                  key={template.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-black">{template.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        isMine ? "bg-cyan-100 text-cyan-900" : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {isMine ? "Mes templates" : "Public"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-black/65">
                    {template.description?.trim() || "Aucune description."}
                  </p>
                  <p className="mt-2 text-xs text-black/70">
                    {template.taskModels.length} tâche(s) pré-configurée(s)
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(template.tags ?? []).slice(0, 6).map((tag) => (
                      <span
                        className="rounded-full border border-cyan-300/50 bg-cyan-100/70 px-2 py-0.5 text-[10px] text-cyan-900"
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    className="mt-3 inline-flex rounded-lg border border-cyan-400/40 bg-cyan-200/70 px-3 py-1.5 text-xs font-medium text-black"
                    href={`/projects/new?templateId=${template.id}`}
                    onClick={() => setOpen(false)}
                  >
                    Utiliser ce template
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
