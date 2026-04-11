"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProjectTaskManager } from "./project-task-manager";

type ProjectWorkspaceProps = {
  importableChats: Array<{ id: string; title: string }>;
  projectChats: Array<{ id: string; title: string; createdAt: string }>;
  projectId: string;
  projectInstructions: string;
  projectName: string;
};

export function ProjectWorkspace({
  importableChats,
  projectChats,
  projectId,
  projectInstructions,
  projectName,
}: ProjectWorkspaceProps) {
  const [selectedChatId, setSelectedChatId] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const canImport = selectedChatId.trim().length > 0 && !isImporting;

  const handleImportChat = async () => {
    if (!canImport) {
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedChatId }),
      });

      if (!response.ok) {
        throw new Error("Import impossible");
      }

      window.location.reload();
    } catch {
      setImportError("Impossible d'importer cette conversation.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
        <h2 className="text-lg font-semibold text-black">
          Discussions du projet
        </h2>
        <p className="mt-1 text-sm text-black/70">
          Cliquez sur une conversation pour discuter avec la même interface que
          le chat principal.
        </p>

        <div className="mt-4 space-y-2">
          {projectChats.length === 0 ? (
            <p className="rounded-xl border border-dashed border-black/25 bg-white/70 p-3 text-sm text-black/70">
              Aucune conversation liée à ce projet.
            </p>
          ) : (
            projectChats.map((chat) => (
              <Link
                className="flex items-center justify-between rounded-xl border border-black/20 bg-white/80 px-3 py-2 text-sm text-black transition hover:bg-white"
                href={`/chat/${chat.id}`}
                key={chat.id}
              >
                <span className="font-medium">{chat.title}</span>
                <span className="text-xs text-black/60">
                  {new Date(chat.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </Link>
            ))
          )}
        </div>
      </article>

      <article className="liquid-panel rounded-2xl border border-white/30 bg-white/85 p-5 text-black backdrop-blur-2xl">
        <h2 className="text-lg font-semibold text-black">Importer un chat</h2>
        <p className="mt-1 text-sm text-black/70">
          Ajoutez une conversation existante à <strong>{projectName}</strong>.
        </p>

        <select
          className="mt-3 h-10 w-full rounded-xl border border-black/20 bg-white px-3 text-sm text-black"
          onChange={(event) => setSelectedChatId(event.target.value)}
          value={selectedChatId}
        >
          <option value="">Sélectionner une conversation</option>
          {importableChats.map((chat) => (
            <option key={chat.id} value={chat.id}>
              {chat.title}
            </option>
          ))}
        </select>

        <Button
          className="mt-3 border border-black/20 bg-cyan-200 text-black hover:bg-cyan-300"
          disabled={!canImport}
          onClick={handleImportChat}
          type="button"
        >
          {isImporting ? "Import en cours..." : "Importer dans le projet"}
        </Button>

        {importError ? (
          <p className="mt-2 text-sm text-red-600">{importError}</p>
        ) : null}

        {projectInstructions.trim().length > 0 ? (
          <div className="mt-4 rounded-xl border border-black/15 bg-white/75 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/65">
              Instructions globales du projet
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-black/80">
              {projectInstructions}
            </p>
          </div>
        ) : null}

        <Link
          className="mt-4 inline-flex rounded-lg border border-black/20 bg-white px-3 py-1.5 text-sm text-black"
          href={`/?projectId=${projectId}`}
        >
          Démarrer une discussion projet
        </Link>
      </article>

      <div className="lg:col-span-2">
        <ProjectTaskManager projectId={projectId} />
      </div>
    </section>
  );
}
