"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SaveProjectTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
};

export function SaveProjectTemplateDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: SaveProjectTemplateDialogProps) {
  const [name, setName] = useState(`${projectName} template`);
  const [includeInstructions, setIncludeInstructions] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [includeTaskStructure, setIncludeTaskStructure] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (!name.trim()) {
      setError("Le nom du template est obligatoire.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const response = await fetch("/api/project-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        projectId,
        includeInstructions,
        includeTags,
        includeTaskStructure,
      }),
    });

    if (!response.ok) {
      setIsSaving(false);
      setError("Impossible de sauvegarder ce template.");
      return;
    }

    onOpenChange(false);
    setIsSaving(false);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white/90 data-[state=open]:sm:zoom-in-95 sm:rounded-2xl max-sm:bottom-0 max-sm:top-auto max-sm:translate-y-0 max-sm:rounded-t-2xl">
        <DialogHeader>
          <DialogTitle>Sauvegarder comme template</DialogTitle>
          <DialogDescription>
            Créez un template réutilisable à partir de ce projet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block space-y-1 text-sm text-black/80">
            <span>Nom du template</span>
            <input
              className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-black/80">
            <input
              checked={includeInstructions}
              onChange={(event) => setIncludeInstructions(event.target.checked)}
              type="checkbox"
            />
            Inclure les instructions
          </label>

          <label className="flex items-center gap-2 text-sm text-black/80">
            <input
              checked={includeTags}
              onChange={(event) => setIncludeTags(event.target.checked)}
              type="checkbox"
            />
            Inclure les tags
          </label>

          <label className="flex items-center gap-2 text-sm text-black/80">
            <input
              checked={includeTaskStructure}
              onChange={(event) => setIncludeTaskStructure(event.target.checked)}
              type="checkbox"
            />
            Inclure la structure des tâches et sous-tâches
          </label>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <button
            className="w-full rounded-xl border border-cyan-400/40 bg-cyan-200/80 px-4 py-2 text-sm font-medium text-black"
            disabled={isSaving}
            onClick={onSave}
            type="button"
          >
            {isSaving ? "Sauvegarde..." : "Enregistrer le template"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
