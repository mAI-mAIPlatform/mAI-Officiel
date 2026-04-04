"use client";

import { Code2, PlayCircle, TerminalSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { chatModels } from "@/lib/ai/models";

type TaskStatus = "idle" | "running" | "done";

const modes = ["Planification", "Investigation", "Exécution"] as const;

export default function CoderPage() {
  const [mode, setMode] = useState<(typeof modes)[number]>("Exécution");
  const [selectedModel, setSelectedModel] = useState(chatModels[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<TaskStatus>("idle");
  const [result, setResult] = useState("");

  const handleLaunchTask = async () => {
    if (!prompt.trim() || !selectedModel) {
      setResult("Veuillez saisir une tâche et choisir un modèle.");
      return;
    }

    setStatus("running");
    setResult("");

    try {
      // Lancement réel sur l'API chat pour éviter le bug "rien ne se passe".
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          message: {
            id: crypto.randomUUID(),
            role: "user",
            parts: [
              {
                type: "text",
                text: `[Coder ${mode}] ${prompt}`,
              },
            ],
          },
          selectedChatModel: selectedModel,
          selectedVisibilityType: "private",
        }),
      });

      if (!response.ok) {
        throw new Error("Lancement impossible");
      }

      setResult("Tâche lancée avec succès. Le traitement est en cours.");
      setStatus("done");
    } catch {
      setResult("Échec du lancement de tâche. Réessayez.");
      setStatus("idle");
    }
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <div className="flex items-center gap-3">
        <Code2 className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Coder</h1>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border/50 bg-card/70 p-4 md:grid-cols-3">
        {modes.map((item) => (
          <button
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${mode === item ? "border-primary bg-primary/10" : "border-border bg-background/60"}`}
            key={item}
            onClick={() => setMode(item)}
            type="button"
          >
            <div className="font-semibold">{item}</div>
            <p className="text-xs text-muted-foreground">
              Disponible uniquement dans Coder.
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/70 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <TerminalSquare className="size-4" /> Paramètres de tâche
        </div>

        <div className="mb-3">
          <label
            className="mb-1 block text-xs text-muted-foreground"
            htmlFor="coder-model"
          >
            Modèle IA pour le codage
          </label>
          <select
            className="liquid-glass h-10 w-full rounded-xl border border-border/60 bg-background/60 px-3 text-sm"
            id="coder-model"
            onChange={(event) => setSelectedModel(event.target.value)}
            value={selectedModel}
          >
            {chatModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>

        <textarea
          className="h-44 w-full resize-none rounded-xl border border-border/50 bg-background/70 p-3 outline-none"
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Décrivez la fonctionnalité à coder…"
          value={prompt}
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {status === "running" ? "Exécution en cours..." : result}
          </p>
          <Button disabled={status === "running"} onClick={handleLaunchTask}>
            <PlayCircle className="mr-2 size-4" /> Lancer {mode}
          </Button>
        </div>
      </div>
    </div>
  );
}
