"use client";

import {
  CheckCircle2,
  ChevronDown,
  Code2,
  FileCode2,
  FolderOpen,
  Monitor,
  PlayCircle,
  TerminalSquare,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { chatModels } from "@/lib/ai/models";
import { cn } from "@/lib/utils";

type CoderMode = "Planification" | "Investigation" | "Exécution";
type WorkspaceTab = "preview" | "files" | "terminal" | "messages";

const modeDescriptions: Record<CoderMode, string> = {
  Planification: "Créer un plan avant les modifications.",
  Investigation: "Corrections des bugs et failles de sécurité.",
  Exécution: "Modifications sans plan d'action.",
};

export default function CoderPage() {
  const [mode, setMode] = useState<CoderMode>("Exécution");
  const [selectedModel, setSelectedModel] = useState(chatModels[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("preview");
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [plan, setPlan] = useState("");
  const [isPlanApproved, setIsPlanApproved] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const selectedModelLabel =
    chatModels.find((model) => model.id === selectedModel)?.name ?? "Modèle";

  const modeHint = useMemo(() => modeDescriptions[mode], [mode]);

  const launchTask = async () => {
    if (!prompt.trim()) {
      setLogs(["Veuillez décrire une tâche avant de lancer."]);
      return;
    }

    if (mode === "Planification" && !isPlanApproved) {
      const generatedPlan = [
        `1. Auditer les composants touchés par: ${prompt}`,
        "2. Lister les changements UI/UX et impacts techniques.",
        "3. Proposer les patchs et vérifier la régression.",
      ].join("\n");

      setPlan(generatedPlan);
      setLogs(["Plan généré. Validation utilisateur requise."]);
      setIsWorkspaceOpen(true);
      setActiveTab("messages");
      return;
    }

    // Exécution simulée (UI) + garde anti-bug pour toujours afficher un résultat.
    setLogs([
      `Mode: ${mode}`,
      `Modèle: ${selectedModelLabel}`,
      "Analyse du contexte...",
      "Application des changements...",
      "Tâche terminée avec succès.",
    ]);
    setIsWorkspaceOpen(true);
    setActiveTab("terminal");
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-4 overflow-y-auto p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Code2 className="size-7 text-primary" />
        <h1 className="text-2xl font-bold">Coder</h1>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/70 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <button
            className="flex h-8 items-center gap-2 rounded-full border border-border/50 bg-background/50 px-3 text-xs text-muted-foreground"
            onClick={() => setIsDropdownOpen((value) => !value)}
            type="button"
          >
            {mode}
            <ChevronDown className="size-3.5" />
          </button>

          <select
            className="h-8 rounded-full border border-border/50 bg-background/50 px-3 text-xs text-muted-foreground outline-none"
            onChange={(event) => setSelectedModel(event.target.value)}
            value={selectedModel}
          >
            {chatModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {isDropdownOpen && (
          <div className="mb-3 grid gap-2 rounded-xl border border-border/50 bg-background/60 p-2">
            {(Object.keys(modeDescriptions) as CoderMode[]).map((item) => (
              <button
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-xs",
                  mode === item
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/40"
                )}
                key={item}
                onClick={() => {
                  setMode(item);
                  setIsDropdownOpen(false);
                  setIsPlanApproved(false);
                  setPlan("");
                }}
                type="button"
              >
                <p className="font-medium">{item}</p>
                <p>{modeDescriptions[item]}</p>
              </button>
            ))}
          </div>
        )}

        <p className="mb-3 text-xs text-muted-foreground">{modeHint}</p>

        <div className="flex gap-2">
          <textarea
            className="h-24 flex-1 resize-none rounded-xl border border-border/50 bg-background/70 p-3 text-sm outline-none"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Décrivez votre tâche de développement..."
            value={prompt}
          />
          <Button className="h-10 self-end" onClick={launchTask}>
            <PlayCircle className="mr-2 size-4" /> Lancer
          </Button>
        </div>

        {mode === "Planification" && plan && !isPlanApproved && (
          <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs">
            <p className="mb-2 font-semibold text-primary">
              Plan généré (validation requise)
            </p>
            <pre className="whitespace-pre-wrap text-muted-foreground">
              {plan}
            </pre>
            <Button
              className="mt-3"
              onClick={() => {
                setIsPlanApproved(true);
                setLogs((currentLogs) => [
                  ...currentLogs,
                  "Plan validé par l'utilisateur.",
                ]);
              }}
              size="sm"
              variant="outline"
            >
              <CheckCircle2 className="mr-2 size-4" /> Valider le plan
            </Button>
          </div>
        )}
      </div>

      {isWorkspaceOpen && (
        <div className="grid min-h-[520px] grid-cols-1 gap-3 md:grid-cols-[380px_1fr]">
          <section className="rounded-2xl border border-border/50 bg-card/70 p-3">
            <div className="mb-3 rounded-xl border border-border/40 bg-background/60 p-3 text-sm">
              {prompt}
            </div>
            <div className="rounded-xl border border-border/40 bg-background/60 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">MODELE</p>
              <p className="mt-1">{selectedModelLabel}</p>
            </div>
            <textarea
              className="mt-3 h-[260px] w-full resize-none rounded-xl border border-border/40 bg-background/60 p-3 text-sm outline-none"
              placeholder="Suivi des messages..."
            />
          </section>

          <section className="rounded-2xl border border-border/50 bg-card/70 p-3">
            <div className="mb-3 flex items-center gap-2">
              {[
                { id: "preview", icon: Monitor, label: "Preview" },
                { id: "files", icon: FolderOpen, label: "Fichiers" },
                { id: "terminal", icon: TerminalSquare, label: "Terminal" },
                { id: "messages", icon: FileCode2, label: "Messages" },
              ].map((tab) => (
                <button
                  className={cn(
                    "rounded-full border border-border/50 px-3 py-1 text-xs",
                    activeTab === tab.id
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground"
                  )}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                  type="button"
                >
                  <tab.icon className="mr-1 inline size-3.5" /> {tab.label}
                </button>
              ))}
            </div>

            <div className="h-[440px] rounded-xl border border-border/40 bg-background/70 p-3 text-xs text-muted-foreground">
              {activeTab === "preview" && (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/40">
                  Prévisualisation du résultat de code
                </div>
              )}
              {activeTab === "files" && (
                <ul className="space-y-2">
                  <li>src/app/page.tsx</li>
                  <li>src/components/Feature.tsx</li>
                  <li>src/styles/globals.css</li>
                </ul>
              )}
              {activeTab === "terminal" && (
                <pre className="whitespace-pre-wrap">{logs.join("\n")}</pre>
              )}
              {activeTab === "messages" && (
                <pre className="whitespace-pre-wrap">
                  {plan || "Aucun message technique."}
                </pre>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
