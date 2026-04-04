"use client";

import {
  CheckCircle2,
  ChevronDown,
  Code2,
  FileCode2,
  FilePlus2,
  FolderOpen,
  Pencil,
  PlayCircle,
  TerminalSquare,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { chatModels } from "@/lib/ai/models";
import { cn } from "@/lib/utils";

type CoderMode = "Planification" | "Investigation" | "Exécution";
type WorkspaceTab = "preview" | "files" | "terminal" | "messages";
type FileEntry = { content: string; path: string };

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
  const [isRunning, setIsRunning] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([
    {
      path: "src/app/page.tsx",
      content: "export default function Page(){ return <div>Hello</div>; }",
    },
  ]);
  const [selectedFilePath, setSelectedFilePath] = useState("src/app/page.tsx");
  const [newFilePath, setNewFilePath] = useState("");

  const [accessCode, setAccessCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    fetch("/api/restricted-access?area=coder")
      .then((res) => res.json())
      .then((payload) => setIsUnlocked(payload.unlocked === true));
  }, []);

  const selectedModelLabel =
    chatModels.find((model) => model.id === selectedModel)?.name ?? "Modèle";

  const selectedFile = files.find((file) => file.path === selectedFilePath);
  const modeHint = useMemo(() => modeDescriptions[mode], [mode]);

  useEffect(() => {
    if (!selectedFilePath && files[0]?.path) {
      setSelectedFilePath(files[0].path);
      return;
    }

    if (
      selectedFilePath &&
      !files.some((file) => file.path === selectedFilePath)
    ) {
      setSelectedFilePath(files[0]?.path ?? "");
    }
  }, [files, selectedFilePath]);

  const applyTask = async () => {
    setIsRunning(true);
    try {
      const response = await fetch("/api/coder/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, mode, modelId: selectedModel, prompt }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setLogs([payload?.error ?? "Échec de la tâche."]);
        return;
      }

      setLogs(payload.history ?? []);
      setFiles(payload.updatedFiles ?? files);
      setIsWorkspaceOpen(true);
      setActiveTab("terminal");
    } finally {
      setIsRunning(false);
    }
  };

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

    await applyTask();
  };

  const createFile = () => {
    if (!newFilePath.trim()) {
      return;
    }
    if (files.some((file) => file.path === newFilePath.trim())) {
      return;
    }
    const nextFile = { path: newFilePath.trim(), content: "" };
    setFiles((currentFiles) => [...currentFiles, nextFile]);
    setSelectedFilePath(nextFile.path);
    setNewFilePath("");
  };

  const createFolder = () => {
    if (!newFilePath.trim()) {
      return;
    }
    const folderKeep = `${newFilePath.replace(/\/$/, "")}/.keep`;
    if (files.some((file) => file.path === folderKeep)) {
      return;
    }
    const nextFile = { path: folderKeep, content: "" };
    setFiles((currentFiles) => [...currentFiles, nextFile]);
    setSelectedFilePath(nextFile.path);
    setNewFilePath("");
  };

  const renameFile = (path: string) => {
    const renamed = `${path}.new`;
    if (files.some((file) => file.path === renamed)) {
      return;
    }
    setFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.path === path ? { ...file, path: renamed } : file
      )
    );
    if (selectedFilePath === path) {
      setSelectedFilePath(renamed);
    }
  };

  const deleteFile = (path: string) => {
    const nextFiles = files.filter((file) => file.path !== path);
    setFiles(nextFiles);
    if (selectedFilePath === path) {
      setSelectedFilePath(nextFiles[0]?.path ?? "");
    }
  };

  const updateFileContent = (content: string) => {
    setFiles((currentFiles) =>
      currentFiles.map((file) =>
        file.path === selectedFilePath ? { ...file, content } : file
      )
    );
  };

  if (!isUnlocked) {
    return (
      <div className="liquid-glass flex h-full w-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-card/70 p-5">
          <p className="text-sm font-semibold text-red-500">Accès restreint</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Entrez le code d'accès pour ouvrir Coder.
          </p>
          <input
            className="mt-3 h-10 w-full rounded-xl border border-border/50 bg-background/70 px-3"
            onChange={(event) => setAccessCode(event.target.value)}
            placeholder="Code d'accès"
            value={accessCode}
          />
          <Button
            className="mt-3 w-full"
            onClick={async () => {
              const response = await fetch("/api/restricted-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ area: "coder", code: accessCode }),
              });
              if (response.ok) {
                setIsUnlocked(true);
              }
            }}
          >
            Déverrouiller
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-4 overflow-y-auto p-4 md:p-8">
      <div className="flex items-center gap-3">
        <Code2 className="size-7 text-primary" />
        <h1 className="text-2xl font-bold">Coder</h1>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card/70 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <button
            className="flex h-7 items-center gap-2 rounded-full border border-border/40 bg-background/50 px-2.5 text-[11px] text-muted-foreground"
            onClick={() => setIsDropdownOpen((value) => !value)}
            type="button"
          >
            {mode}
            <ChevronDown className="size-3" />
          </button>

          <select
            className="h-7 rounded-full border border-border/40 bg-background/50 px-2.5 text-[11px] text-muted-foreground outline-none"
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

        <p className="mb-1 text-xs text-muted-foreground">{modeHint}</p>
        <p className="text-xs text-muted-foreground">
          Utilisez la barre de message en bas à gauche pour lancer des
          modifications.
        </p>

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
              readOnly
              value={logs.join("\n")}
            />
          </section>

          <section className="rounded-2xl border border-border/50 bg-card/70 p-3">
            <div className="mb-3 flex items-center gap-2">
              {[
                { id: "preview", icon: FolderOpen, label: "Preview" },
                { id: "files", icon: FileCode2, label: "Fichiers" },
                { id: "terminal", icon: TerminalSquare, label: "Terminal" },
                { id: "messages", icon: Pencil, label: "Messages" },
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
                <pre className="h-full overflow-auto whitespace-pre-wrap">
                  {selectedFile?.content || "Aucun fichier sélectionné."}
                </pre>
              )}

              {activeTab === "files" && (
                <div>
                  <div className="mb-2 flex gap-2">
                    <input
                      className="h-8 flex-1 rounded-lg border border-border/40 bg-background/70 px-2"
                      onChange={(event) => setNewFilePath(event.target.value)}
                      placeholder="Nouveau fichier (ex: src/new.tsx)"
                      value={newFilePath}
                    />
                    <Button onClick={createFile} size="sm" variant="outline">
                      <FilePlus2 className="mr-1 size-3.5" /> Ajouter
                    </Button>
                    <Button onClick={createFolder} size="sm" variant="outline">
                      Dossier
                    </Button>
                    <Button
                      onClick={() => {
                        const blob = new Blob(
                          [JSON.stringify(files, null, 2)],
                          {
                            type: "application/json",
                          }
                        );
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement("a");
                        anchor.href = url;
                        anchor.download = "code-export.json";
                        anchor.click();
                        URL.revokeObjectURL(url);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Exporter
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {files.map((file) => (
                      <div
                        className="flex items-center justify-between rounded-lg border border-border/40 p-2"
                        key={file.path}
                      >
                        <button
                          className="text-left"
                          onClick={() => setSelectedFilePath(file.path)}
                          type="button"
                        >
                          {file.path}
                        </button>
                        <div className="flex gap-1">
                          <button
                            onClick={() => renameFile(file.path)}
                            type="button"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => deleteFile(file.path)}
                            type="button"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "terminal" && (
                <pre className="whitespace-pre-wrap">{logs.join("\n")}</pre>
              )}

              {activeTab === "messages" && (
                <textarea
                  className="h-full w-full resize-none rounded-lg border border-border/40 bg-background/70 p-2"
                  onChange={(event) => updateFileContent(event.target.value)}
                  value={selectedFile?.content ?? ""}
                />
              )}
            </div>
          </section>
        </div>
      )}

      <div className="sticky bottom-0 left-0 mt-2 w-full max-w-xl rounded-2xl border border-border/50 bg-card/80 p-2 shadow-[var(--shadow-float)] backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <textarea
            className="h-16 flex-1 resize-none rounded-xl border border-border/40 bg-background/70 p-2 text-sm outline-none"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Envoyer un message ou demander une modification..."
            value={prompt}
          />
          <Button disabled={isRunning} onClick={launchTask} size="sm">
            <PlayCircle className="mr-1 size-4" /> Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
