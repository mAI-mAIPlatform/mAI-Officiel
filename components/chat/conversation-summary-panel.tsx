"use client";

import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ConversationSummaryPanel({
  chatId,
  projectId,
}: {
  chatId: string;
  projectId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/chats/${chatId}/summary`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Impossible de générer le résumé");
      }

      const data = (await response.json()) as { summary?: string };
      setSummary(data.summary?.trim() || "Résumé indisponible.");
      setIsOpen(true);
    } catch {
      setError("La génération du résumé a échoué.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto mb-2 w-full max-w-4xl px-2 md:px-4">
      <div className="liquid-panel rounded-2xl border border-white/30 bg-white/80 p-3 text-black shadow-lg backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            className="border border-black/20 bg-cyan-200 text-black hover:bg-cyan-300"
            disabled={isLoading}
            onClick={handleSummarize}
            type="button"
          >
            <Sparkles className="mr-2 size-4" />
            {isLoading ? "Résumé en cours..." : "Résumer la conversation"}
          </Button>

          {summary ? (
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-black/20 bg-white px-2 py-1 text-xs"
              onClick={() => setIsOpen((open) => !open)}
              type="button"
            >
              {isOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {isOpen ? "Masquer le résumé" : "Afficher le résumé"}
            </button>
          ) : null}
        </div>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        {summary && isOpen ? (
          <div className="mt-3 rounded-xl border border-black/15 bg-white/75 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/60">
              Résumé structuré
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-black/85">{summary}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
