"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { EllipsisVertical } from "lucide-react";
import { useState } from "react";
import { SaveProjectTemplateDialog } from "./save-project-template-dialog";
import { resolveProjectIcon } from "./project-icon-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ProjectCardProps = {
  project: {
    id: string;
    name: string;
    instructions: string | null;
    createdAt: string;
    icon?: string | null;
    color?: string | null;
  };
};

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const Icon = resolveProjectIcon(project.icon);

  const onDelete = async () => {
    const isConfirmed = window.confirm(
      "Supprimer ce projet ? Cette action est irréversible."
    );

    if (!isConfirmed) {
      return;
    }

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.refresh();
    }
  };

  const onDuplicate = async () => {
    const response = await fetch(`/api/projects/${project.id}/duplicate`, {
      method: "POST",
    });

    if (response.ok) {
      router.refresh();
    }
  };

  return (
    <article
      className="liquid-panel flex flex-col gap-3 rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl"
      style={{ borderLeft: `4px solid ${project.color ?? "#0EA5E9"}` }}
    >
      <header>
        <h3 className="flex items-center gap-2 text-base font-semibold text-black">
          <Icon className="size-4" />
          <Link className="hover:underline" href={`/projects/${project.id}`}>
            {project.name}
          </Link>
        </h3>
        <p className="text-xs text-black/60">
          Créé le {new Date(project.createdAt).toLocaleDateString("fr-FR")}
        </p>
      </header>

      <p className="line-clamp-4 text-sm text-black/75">
        {project.instructions?.trim() || "Aucune instruction globale définie."}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <Link
          className="flex min-h-11 items-center rounded-lg border border-cyan-400/40 bg-cyan-200/70 px-3 py-1.5 text-xs font-medium text-black"
          href={`/projects/${project.id}/edit`}
        >
          Éditer
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Menu projet"
              className="min-h-11 rounded-lg border border-black/15 bg-white/80 p-2 text-black"
              type="button"
            >
              <EllipsisVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <button
                className="w-full text-left"
                onClick={() => setSaveDialogOpen(true)}
                type="button"
              >
                Sauvegarder comme template
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              Dupliquer le projet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-700 focus:bg-red-50 focus:text-red-700"
              onClick={onDelete}
            >
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SaveProjectTemplateDialog
        onOpenChange={setSaveDialogOpen}
        open={saveDialogOpen}
        projectId={project.id}
        projectName={project.name}
      />
    </article>
  );
}
