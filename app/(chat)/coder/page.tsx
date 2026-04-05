"use client";

import {
  CheckCircle2,
  Code2,
  FilePlus2,
  FolderPlus,
  Pencil,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { chatModels } from "@/lib/ai/models";

type CoderMode = "Planification" | "Investigation" | "Exécution";
type WorkspaceTab = "preview" | "terminal" | "messages";
type FileEntry = { content: string; path: string };

const modeDescriptions: Record<CoderMode, string> = {
  Planification: "Créer un plan avant les modifications.",
  Investigation: "Corrections des bugs et failles de sécurité.",
  Exécution: "Modifications sans plan d'action.",
};

function getFolder(path: string) {
  const parts = path.split("/");
  return parts.length > 1 ? parts.slice(0, -1).join("/") : "racine";
}

export default function CoderPage() {
  const [mode, setMode] = useState<CoderMode>("Exécution");
  const [selectedModel, setSelectedModel] = useState(chatModels[0]?.id ?? "");
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("preview");
  const [plan, setPlan] = useState("");
  const [isPlanApproved, setIsPlanApproved] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [files, setFiles] = useState<FileEntry[]>([
    {
      path: "src/App.tsx",
      content: "export default function App(){ return <main>Bonjour</main>; }",
    },
  ]);
  const [selectedFilePath, setSelectedFilePath] = useState("src/App.tsx");
  const [newFilePath, setNewFilePath] = useState("");
  const [newFolderPath, setNewFolderPath] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const coderBubbles = useMemo(
    () =>
      [
        "Refactoriser pour TypeScript strict",
        "Ajouter tests e2e Playwright",
        "Optimiser bundle Next.js",
        "Audit sécurité API",
        "Créer composant Liquid Glass",
      ]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3),
    []
  );

  useEffect(() => {
    fetch("/api/restricted-access?area=coder")
      .then((res) => res.json())
      .then((payload) => setIsUnlocked(payload.unlocked === true));
  }, []);

  const selectedFile = files.find((file) => file.path === selectedFilePath);

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

  useEffect(() => {
    setRenameValue(selectedFilePath);
  }, [selectedFilePath]);

  const folders = useMemo(() => {
    const grouped = new Map<string, FileEntry[]>();
    for (const file of files) {
      const folder = getFolder(file.path);
      const current = grouped.get(folder) ?? [];
      current.push(file);
      grouped.set(folder, current);
    }
    return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [files]);

  const launchTask = async () => {
    if (!prompt.trim()) {
      setLogs(["Veuillez décrire une tâche avant de lancer."]);
      return;
    }

    if (mode === "Planification" && !isPlanApproved) {
      setPlan(
        [
          `1. Auditer les fichiers concernés par: ${prompt}`,
          "2. Détailler les patchs et impacts.",
          "3. Valider puis exécuter.",
        ].join("\n")
      );
      setLogs(["Plan généré. Validation requise."]);
      setActiveTab("messages");
      return;
    }

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
      setActiveTab("terminal");
    } finally {
      setIsRunning(false);
    }
  };

  const createFile = () => {
    const path = newFilePath.trim();
    if (!path || files.some((file) => file.path === path)) {
      return;
    }
    const next = { path, content: "" };
    setFiles((current) => [...current, next]);
    setSelectedFilePath(path);
    setNewFilePath("");
  };

  const createFolder = () => {
    const path = newFolderPath.trim().replace(/\/$/, "");
    if (!path) {
      return;
    }
    const keepPath = `${path}/.keep`;
    if (files.some((file) => file.path === keepPath)) {
      return;
    }
    setFiles((current) => [...current, { path: keepPath, content: "" }]);
    setNewFolderPath("");
  };

  const renameFile = () => {
    const target = renameValue.trim();
    if (
      !selectedFilePath ||
      !target ||
      files.some((file) => file.path === target)
    ) {
      return;
    }
    setFiles((current) =>
      current.map((file) =>
        file.path === selectedFilePath ? { ...file, path: target } : file
      )
    );
    setSelectedFilePath(target);
  };

  const deleteFile = (path: string) => {
    setFiles((current) => current.filter((file) => file.path !== path));
  };

  const exportAllCode = () => {
    const blob = new Blob([JSON.stringify(files, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "code-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!isUnlocked) {
    return (
      <div className="liquid-glass flex h-full w-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-card/70 p-5">
          <p className="text-sm font-semibold text-red-500">Accès restreint</p>
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
    <div className="liquid-glass flex h-full w-full flex-col gap-3 overflow-y-auto p-4 md:p-6">
      <div className="flex flex-wrap gap-2">
        {coderBubbles.map((bubble) => (
          <button
            className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
            key={bubble}
            onClick={() => setPrompt(bubble)}
            type="button"
          >
            ✨ {bubble}
          </button>
        ))}
      </div>
      <div className="grid min-h-[560px] grid-cols-1 gap-3 lg:grid-cols-[300px_1fr_360px]">
        <aside className="rounded-2xl border border-border/50 bg-card/70 p-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            FILES
          </p>
          <div className="mb-2 grid gap-2">
            <input
              className="h-8 rounded-lg border border-border/40 bg-background/70 px-2 text-xs"
              onChange={(e) => setNewFilePath(e.target.value)}
              placeholder="Nouveau fichier"
              value={newFilePath}
            />
            <Button onClick={createFile} size="sm" variant="outline">
              <FilePlus2 className="mr-1 size-3.5" />
              Créer fichier
            </Button>
            <input
              className="h-8 rounded-lg border border-border/40 bg-background/70 px-2 text-xs"
              onChange={(e) => setNewFolderPath(e.target.value)}
              placeholder="Nouveau dossier"
              value={newFolderPath}
            />
            <Button onClick={createFolder} size="sm" variant="outline">
              <FolderPlus className="mr-1 size-3.5" />
              Créer dossier
            </Button>
            <Button onClick={exportAllCode} size="sm" variant="outline">
              Exporter code
            </Button>
          </div>
          <div className="max-h-[350px] space-y-2 overflow-auto">
            {folders.map(([folder, folderFiles]) => (
              <div key={folder}>
                <p className="text-[11px] font-medium text-muted-foreground">
                  📁 {folder}
                </p>
                <div className="mt-1 space-y-1 pl-2">
                  {folderFiles.map((file) => (
                    <div
                      className="flex items-center justify-between rounded-lg border border-border/30 px-2 py-1"
                      key={file.path}
                    >
                      <button
                        className="truncate text-xs"
                        onClick={() => setSelectedFilePath(file.path)}
                        type="button"
                      >
                        {file.path.split("/").at(-1)}
                      </button>
                      <button
                        onClick={() => deleteFile(file.path)}
                        type="button"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-border/50 bg-card/70 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Code2 className="size-4 text-primary" />
            <p className="text-sm font-medium">
              {selectedFilePath || "Aucun fichier"}
            </p>
          </div>
          <div className="mb-2 flex gap-2">
            <input
              className="h-8 flex-1 rounded-lg border border-border/40 bg-background/70 px-2 text-xs"
              onChange={(e) => setRenameValue(e.target.value)}
              value={renameValue}
            />
            <Button onClick={renameFile} size="sm" variant="outline">
              <Pencil className="mr-1 size-3.5" />
              Renommer
            </Button>
          </div>
          <textarea
            className="h-[420px] w-full resize-none rounded-xl border border-border/40 bg-background/70 p-3 text-sm"
            onChange={(event) => {
              const content = event.target.value;
              setFiles((current) =>
                current.map((file) =>
                  file.path === selectedFilePath ? { ...file, content } : file
                )
              );
            }}
            value={selectedFile?.content ?? ""}
          />
        </section>

        <section className="rounded-2xl border border-border/50 bg-card/70 p-3">
          <div className="mb-2 flex items-center gap-2">
            <button
              className="rounded-full border border-border/40 px-2 py-1 text-[11px]"
              onClick={() => setActiveTab("preview")}
              type="button"
            >
              Preview
            </button>
            <button
              className="rounded-full border border-border/40 px-2 py-1 text-[11px]"
              onClick={() => setActiveTab("terminal")}
              type="button"
            >
              Terminal
            </button>
            <button
              className="rounded-full border border-border/40 px-2 py-1 text-[11px]"
              onClick={() => setActiveTab("messages")}
              type="button"
            >
              Messages
            </button>
          </div>
          {activeTab === "preview" && (
            <pre className="h-[460px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/40 bg-background/70 p-3 text-xs">
              {selectedFile?.content ?? "Aucun fichier"}
            </pre>
          )}
          {activeTab === "terminal" && (
            <pre className="h-[460px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/40 bg-background/70 p-3 text-xs">
              {logs.join("\n")}
            </pre>
          )}
          {activeTab === "messages" && (
            <pre className="h-[460px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/40 bg-background/70 p-3 text-xs">
              {plan || logs.join("\n")}
            </pre>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 left-0 w-full max-w-2xl rounded-2xl border border-border/50 bg-card/80 p-2 shadow-[var(--shadow-float)] backdrop-blur-xl">
        <div className="mb-2 flex items-center gap-2">
          <select
            className="h-7 rounded-full border border-border/40 bg-background/50 px-2.5 text-[11px] text-muted-foreground"
            onChange={(event) => setMode(event.target.value as CoderMode)}
            value={mode}
          >
            {(Object.keys(modeDescriptions) as CoderMode[]).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="h-7 rounded-full border border-border/40 bg-background/50 px-2.5 text-[11px] text-muted-foreground"
            onChange={(event) => setSelectedModel(event.target.value)}
            value={selectedModel}
          >
            {chatModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-muted-foreground">
            {modeDescriptions[mode]}
          </span>
        </div>
        {mode === "Planification" && plan && !isPlanApproved && (
          <div className="mb-2 rounded-lg border border-primary/30 bg-primary/10 p-2 text-xs">
            <pre className="whitespace-pre-wrap">{plan}</pre>
            <Button
              className="mt-2"
              onClick={() => setIsPlanApproved(true)}
              size="sm"
              variant="outline"
            >
              <CheckCircle2 className="mr-1 size-3.5" />
              Valider le plan
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            className="h-16 flex-1 resize-none rounded-xl border border-border/40 bg-background/70 p-2 text-sm"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Envoyer un message ou demander une modification..."
            value={prompt}
          />
          <Button disabled={isRunning} onClick={launchTask} size="sm">
            <PlayCircle className="mr-1 size-4" />
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  );
}
