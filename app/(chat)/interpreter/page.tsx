"use client";

import {
  BarChart3,
  Brain,
  Bookmark,
  Braces,
  ChevronDown,
  ChevronRight,
  EllipsisVertical,
  FileCode2,
  FileSpreadsheet,
  History,
  Info,
  Plus,
  Play,
  SquareTerminal,
  Table,
  Upload,
  X,
  FolderTree,
  FolderPlus,
  FileDown,
  FileUp,
  Palette,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageResponse } from "@/components/ai-elements/message";
import { addStatsEvent } from "@/lib/user-stats";
import { addInterpreterRun } from "@/lib/user-stats";

type Runtime =
  | "python"
  | "javascript"
  | "typescript"
  | "bash"
  | "html"
  | "c"
  | "cpp"
  | "go"
  | "ruby"
  | "php"
  | "sql"
  | "json"
  | "markdown"
  | "rust"
  | "java"
  | "r"
  | "perl";

type RuntimeFile = { contentBase64: string; name: string };
type EditorTheme = "monokai" | "dracula" | "one-dark";

type ExecutionResponse = {
  error?: string;
  exitCode?: number | null;
  logs?: string[];
  output?: string;
  success?: boolean;
};

type ExecutionEntry = {
  createdAt: string;
  output: ExecutionResponse | null;
  runtime: Runtime;
  sourceCode: string;
};

type SavedSnippet = {
  id: string;
  name: string;
  runtime: Runtime;
  sourceCode: string;
};
type AssistantMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string };
type VirtualCodeFile = { id: string; name: string; content: string };
type VirtualFolder = { id: string; path: string };
type ProjectMeta = { logo: string; memory: string; info: string };
type EditorTab = { id: string; name: string; runtime: Runtime; content: string };
type FoldRange = { end: number; start: number };

const runtimeSnippets: Record<Runtime, string> = {
  python: `import statistics\nvalues = [2, 4, 6, 8]\nprint("Mean:", statistics.mean(values))`,
  javascript: `const values = [2, 4, 6, 8];\nconst mean = values.reduce((acc, value) => acc + value, 0) / values.length;\nconsole.log("Mean:", mean);`,
  typescript: `const values: number[] = [2, 4, 6, 8];\nconst mean = values.reduce((acc, value) => acc + value, 0) / values.length;\nconsole.log("Mean:", mean);`,
  bash: `#!/usr/bin/env bash\necho "Sandbox ready"`,
  html: `<!doctype html>\n<html lang="fr"><body><h1>Hello Interpreter</h1></body></html>`,
  c: `#include <stdio.h>\nint main(void){ printf("Hello C\\n"); return 0; }`,
  cpp: `#include <iostream>\nint main(){ std::cout << "Hello C++\\n"; }`,
  go: `package main\nimport "fmt"\nfunc main(){ fmt.Println("Hello Go") }`,
  ruby: `puts "Hello Ruby"`,
  php: `<?php\necho "Hello PHP\\n";`,
  sql: `CREATE TABLE sales(month TEXT, amount INTEGER);\nINSERT INTO sales VALUES ('Jan', 20), ('Feb', 40), ('Mar', 35);\nSELECT month, amount FROM sales ORDER BY amount DESC;`,
  json: `{\n  "project": "mAI Code Interpreter",\n  "version": 2,\n  "features": ["snippets", "history", "multi-runtime"]\n}`,
  markdown: `# Rapport rapide\n\n- Dataset: ventes mensuelles\n- Insight principal: **février** est le meilleur mois.\n\n\`\`\`python\nprint("Export prêt")\n\`\`\``,
  rust: `fn main() {\n  println!("Hello Rust");\n}`,
  java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello Java");\n  }\n}`,
  r: `values <- c(2,4,6,8)\nmean(values)`,
  perl: `my @values = (2, 4, 6, 8);\nmy $sum = 0;\n$sum += $_ for @values;\nmy $mean = $sum / scalar(@values);\nprint \"Mean: $mean\\n\";`,
};

const runtimeLabels: Record<Runtime, string> = {
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  bash: "Bash",
  html: "HTML",
  c: "C",
  cpp: "C++",
  go: "Go",
  ruby: "Ruby",
  php: "PHP",
  sql: "SQL (SQLite)",
  json: "JSON",
  markdown: "Markdown",
  rust: "Rust",
  java: "Java",
  r: "R",
  perl: "Perl",
};

const runtimeOrder: Runtime[] = [
  "python",
  "javascript",
  "typescript",
  "bash",
  "html",
  "c",
  "cpp",
  "go",
  "ruby",
  "php",
  "sql",
  "json",
  "markdown",
  "rust",
  "java",
  "r",
  "perl",
];

const quickPresets: Array<{ label: string; runtime: Runtime }> = [
  { label: "Analyse CSV", runtime: "python" },
  { label: "Script CLI", runtime: "bash" },
  { label: "Sandbox JS", runtime: "javascript" },
  { label: "Requête SQL", runtime: "sql" },
];

const runtimeExtensions: Record<Runtime, string> = {
  python: "py",
  javascript: "js",
  typescript: "ts",
  bash: "sh",
  html: "html",
  c: "c",
  cpp: "cpp",
  go: "go",
  ruby: "rb",
  php: "php",
  sql: "sql",
  json: "json",
  markdown: "md",
  rust: "rs",
  java: "java",
  r: "r",
  perl: "pl",
};

const runtimeIcons: Record<Runtime, typeof Braces> = {
  python: FileCode2,
  javascript: Braces,
  typescript: Braces,
  bash: SquareTerminal,
  html: FileCode2,
  c: FileCode2,
  cpp: FileCode2,
  go: FileCode2,
  ruby: FileCode2,
  php: FileCode2,
  sql: Table,
  json: Braces,
  markdown: FileCode2,
  rust: FileCode2,
  java: FileCode2,
  r: BarChart3,
  perl: FileCode2,
};

const toUtf8Bytes = (text: string) => new TextEncoder().encode(text).length;

const computeFoldRanges = (content: string): FoldRange[] => {
  const lines = content.split("\n");
  const ranges: FoldRange[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const hasBraceStart = /[{[(]\s*$/.test(trimmed);
    const hasKeywordStart = /^(def|class|for|while|if|else|elif|function|public|private|protected|fn|loop)\b/.test(trimmed);
    if (!hasBraceStart && !hasKeywordStart) continue;
    let end = index;
    if (hasBraceStart) {
      let balance = 0;
      for (let cursor = index; cursor < lines.length; cursor += 1) {
        const l = lines[cursor] ?? "";
        balance += (l.match(/[{[(]/g) ?? []).length;
        balance -= (l.match(/[})\]]/g) ?? []).length;
        if (cursor > index && balance <= 0) {
          end = cursor;
          break;
        }
      }
    } else {
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        const nextLine = lines[cursor] ?? "";
        if (!nextLine.trim()) continue;
        const nextIndent = nextLine.match(/^\s*/)?.[0].length ?? 0;
        if (nextIndent <= indent) {
          end = cursor - 1;
          break;
        }
        end = cursor;
      }
    }
    if (end > index) ranges.push({ start: index + 1, end: end + 1 });
  }
  return ranges;
};

async function toRuntimeFile(file: File): Promise<RuntimeFile> {
  const buffer = await file.arrayBuffer();
  const contentBase64 = btoa(
    new Uint8Array(buffer).reduce(
      (acc, byte) => acc + String.fromCharCode(byte),
      ""
    )
  );

  return { contentBase64, name: file.name };
}

export default function InterpreterPage() {
  const [editorTabs, setEditorTabs] = useState<EditorTab[]>([
    { id: crypto.randomUUID(), name: "main.py", runtime: "python", content: runtimeSnippets.python },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(() => editorTabs[0]?.id ?? "");
  const [foldedStarts, setFoldedStarts] = useState<Record<string, number[]>>({});
  const [cursorPosition, setCursorPosition] = useState({ column: 1, line: 1 });
  const [activeLineNumber, setActiveLineNumber] = useState(1);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResponse | null>(null);
  const [snippetName, setSnippetName] = useState("");
  const [editorTheme, setEditorTheme] = useState<EditorTheme>("dracula");
  const [history, setHistory] = useLocalStorage<ExecutionEntry[]>(
    "mai.interpreter.history.v1",
    []
  );
  const [savedSnippets, setSavedSnippets] = useLocalStorage<SavedSnippet[]>(
    "mai.interpreter.snippets.v1",
    []
  );
  const [virtualFiles, setVirtualFiles] = useState<VirtualCodeFile[]>([]);
  const [virtualFolders, setVirtualFolders] = useState<VirtualFolder[]>([]);
  const [newFolderPath, setNewFolderPath] = useState("");
  const [terminalCommand, setTerminalCommand] = useState("echo 'hello from terminal'");
  const [terminalOutput, setTerminalOutput] = useState("");
  const [assistantMessages, setAssistantMessages] = useLocalStorage<AssistantMessage[]>(
    "mai.interpreter.ai-messages.v1",
    []
  );
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [compareWithEntry, setCompareWithEntry] = useState<ExecutionEntry | null>(null);
  const [versionSnapshots, setVersionSnapshots] = useLocalStorage<ExecutionEntry[]>(
    "mai.interpreter.snapshots.v1",
    []
  );
  const [projectMeta, setProjectMeta] = useLocalStorage<ProjectMeta>(
    "mai.interpreter.project-meta.v1",
    { info: "Projet local", logo: "🧪", memory: "" }
  );
  const activeTab = editorTabs.find((tab) => tab.id === activeTabId) ?? editorTabs[0];
  const runtime = activeTab?.runtime ?? "python";
  const code = activeTab?.content ?? "";

  const setCode = (nextCode: string) => {
    setEditorTabs((current) =>
      current.map((tab) =>
        tab.id === activeTabId ? { ...tab, content: nextCode } : tab
      )
    );
  };

  const setRuntime = (nextRuntime: Runtime) => {
    setEditorTabs((current) =>
      current.map((tab) =>
        tab.id === activeTabId ? { ...tab, runtime: nextRuntime } : tab
      )
    );
  };

  const features = useMemo(
    () => [
      { icon: Table, label: "Analyse DataFrame / CSV" },
      { icon: FileSpreadsheet, label: "Import CSV / Excel" },
      { icon: BarChart3, label: "Génération de graphiques" },
      { icon: SquareTerminal, label: "Logs & erreurs structurés" },
      { icon: Play, label: "Runtimes code + aperçu JSON/Markdown" },
    ],
    []
  );

  const editorThemeClass =
    editorTheme === "monokai"
      ? "bg-[#272822] text-[#f8f8f2]"
      : editorTheme === "one-dark"
        ? "bg-[#282c34] text-[#abb2bf]"
        : "bg-[#282a36] text-[#f8f8f2]";

  const onRun = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const uploadedFiles = await Promise.all(files.map(toRuntimeFile));
      const virtualRuntimeFiles: RuntimeFile[] = virtualFiles
        .filter((file) => file.name.trim().length > 0 && file.content.trim().length > 0)
        .map((file) => ({
          name: file.name.trim(),
          contentBase64: btoa(unescape(encodeURIComponent(file.content))),
        }));
      const payloadFiles = [...uploadedFiles, ...virtualRuntimeFiles].slice(0, 5);
      const response = await fetch("/api/code-interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, files: payloadFiles, runtime }),
      });

      const payload = (await response.json()) as ExecutionResponse;
      addStatsEvent("api_call", 1);
      addInterpreterRun(1);
      setResult(payload);
      const nextEntry: ExecutionEntry = {
        createdAt: new Date().toISOString(),
        output: payload,
        runtime,
        sourceCode: code,
      };
      setHistory((current) => [nextEntry, ...current].slice(0, 20));
      setVersionSnapshots((current) => [
        nextEntry,
        ...current,
      ].slice(0, 50));
    } catch (error) {
      const errorPayload = {
        error:
          error instanceof Error
            ? error.message
            : "Erreur inconnue pendant l'exécution",
        success: false,
      } satisfies ExecutionResponse;
      setResult(errorPayload);
      setHistory((current) =>
        [
          {
            createdAt: new Date().toISOString(),
            output: errorPayload,
            runtime,
            sourceCode: code,
          },
          ...current,
        ].slice(0, 20)
      );
    } finally {
      setIsRunning(false);
    }
  };

  const runTerminalCommand = async () => {
    if (!terminalCommand.trim()) return;
    setTerminalOutput("Running...");
    try {
      const response = await fetch("/api/code-interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runtime: "bash", code: terminalCommand }),
      });
      const payload = (await response.json()) as ExecutionResponse;
      setTerminalOutput(payload.output || payload.logs?.join("\n") || payload.error || "Command completed.");
    } catch (error) {
      setTerminalOutput(error instanceof Error ? error.message : "Terminal error");
    }
  };

  const askAssistant = async () => {
    if (!assistantPrompt.trim()) return;
    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: assistantPrompt.trim(),
      createdAt: new Date().toISOString(),
    };
    setAssistantMessages((current) => [userMessage, ...current].slice(0, 30));
    setIsGenerating(true);
    try {
      const response = await fetch("/api/code-interpreter/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: assistantPrompt.trim(), runtime }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) {
        throw new Error(payload.error ?? "Réponse IA indisponible");
      }
      const assistantMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload.answer,
        createdAt: new Date().toISOString(),
      };
      setAssistantMessages((current) => [assistantMessage, ...current].slice(0, 30));
      const codeBlockMatch = payload.answer.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
      if (codeBlockMatch?.[1]) {
        setCode(codeBlockMatch[1].trim());
      }
      setAssistantPrompt("");
    } catch (error) {
      setAssistantMessages((current) => [
        {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content: `Erreur: ${error instanceof Error ? error.message : "inconnue"}`,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 30));
    } finally {
      setIsGenerating(false);
    }
  };

  const computeLineDiff = (oldText: string, newText: string) => {
    const before = oldText.split("\n");
    const after = newText.split("\n");
    const max = Math.max(before.length, after.length);
    const lines: string[] = [];
    for (let i = 0; i < max; i += 1) {
      const a = before[i] ?? "";
      const b = after[i] ?? "";
      if (a === b) lines.push(`  ${b}`);
      else {
        if (a) lines.push(`- ${a}`);
        if (b) lines.push(`+ ${b}`);
      }
    }
    return lines.join("\n");
  };

  const exportProject = () => {
    const payload = {
      runtime,
      code,
      virtualFiles,
      virtualFolders,
      projectMeta,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mai-project-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProject = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as {
        runtime?: Runtime;
        code?: string;
        virtualFiles?: VirtualCodeFile[];
        virtualFolders?: VirtualFolder[];
        projectMeta?: ProjectMeta;
      };
      if (data.runtime && runtimeOrder.includes(data.runtime)) setRuntime(data.runtime);
      if (typeof data.code === "string") setCode(data.code);
      if (Array.isArray(data.virtualFiles)) setVirtualFiles(data.virtualFiles.slice(0, 30));
      if (Array.isArray(data.virtualFolders)) setVirtualFolders(data.virtualFolders.slice(0, 20));
      if (data.projectMeta) {
        setProjectMeta({
          logo: data.projectMeta.logo || "🧪",
          info: data.projectMeta.info || "Projet local",
          memory: data.projectMeta.memory || "",
        });
      }
    } catch {
      setTerminalOutput("Import impossible: archive projet invalide.");
    }
  };

  const foldRanges = useMemo(() => computeFoldRanges(code), [code]);
  const foldedForTab = foldedStarts[activeTabId] ?? [];
  const foldedSet = new Set(foldedForTab);
  const lineList = code.split("\n");
  const hiddenLines = new Set<number>();
  for (const startLine of foldedForTab) {
    const match = foldRanges.find((range) => range.start === startLine);
    if (!match) continue;
    for (let line = match.start + 1; line <= match.end; line += 1) hiddenLines.add(line);
  }
  const visibleLines = lineList
    .map((content, index) => ({ content, lineNumber: index + 1 }))
    .filter((item) => !hiddenLines.has(item.lineNumber));

  const onLineNumberClick = (lineNumber: number) => {
    setActiveLineNumber(lineNumber);
    setCursorPosition((current) => ({ ...current, line: lineNumber }));
  };

  const toggleFold = (start: number) => {
    setFoldedStarts((current) => {
      const currentTab = current[activeTabId] ?? [];
      const next = currentTab.includes(start)
        ? currentTab.filter((line) => line !== start)
        : [...currentTab, start];
      return { ...current, [activeTabId]: next };
    });
  };

  const addEditorTab = () => {
    const fileName = window.prompt("Nom du fichier (ex: src/main.py)");
    if (!fileName?.trim()) return;
    const runtimeInput = window.prompt(
      `Runtime (${runtimeOrder.join(", ")})`,
      "python"
    );
    const nextRuntime = (runtimeInput?.trim().toLowerCase() ?? "python") as Runtime;
    if (!runtimeOrder.includes(nextRuntime)) return;
    const newTab: EditorTab = {
      id: crypto.randomUUID(),
      name: fileName.trim(),
      runtime: nextRuntime,
      content: runtimeSnippets[nextRuntime],
    };
    setEditorTabs((current) => [...current, newTab]);
    setActiveTabId(newTab.id);
  };

  return (
    <div className="liquid-glass flex h-full flex-col gap-4 overflow-auto p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Code Interpreter</h1>
          <p className="text-sm text-muted-foreground">
            Mini-IDE avec thèmes, snippets, historique d'exécution et presets.
          </p>
        </div>

        <div className="liquid-panel rounded-xl px-3 py-2 text-xs">
          <label>
            Runtime
            <select
              className="ml-2 rounded-lg border border-border/50 bg-background px-2 py-1"
              onChange={(event) => {
                const nextRuntime = event.target.value as Runtime;
                setRuntime(nextRuntime);
                setCode(runtimeSnippets[nextRuntime]);
              }}
              value={runtime}
            >
              {runtimeOrder.map((item) => (
                <option key={item} value={item}>
                  {runtimeLabels[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="ml-2">
            Thème
            <select
              className="ml-2 rounded-lg border border-border/50 bg-background px-2 py-1"
              onChange={(event) =>
                setEditorTheme(event.target.value as EditorTheme)
              }
              value={editorTheme}
            >
              <option value="monokai">Monokai</option>
              <option value="dracula">Dracula</option>
              <option value="one-dark">One Dark</option>
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {quickPresets.map((preset) => (
          <button
            className="rounded-xl border border-border/60 bg-background/60 px-3 py-1 text-xs"
            key={preset.label}
            onClick={() => {
              setRuntime(preset.runtime);
              setCode(runtimeSnippets[preset.runtime]);
            }}
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <section className="grid gap-3 rounded-xl border border-border/60 bg-background/40 p-3 md:grid-cols-3">
        <label className="text-xs text-muted-foreground">
          <span className="mb-1 inline-flex items-center gap-1 font-semibold"><Palette className="size-3.5" /> Logo projet</span>
          <input
            className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm"
            maxLength={4}
            onChange={(event) => setProjectMeta((current) => ({ ...current, logo: event.target.value || "🧪" }))}
            value={projectMeta.logo}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          <span className="mb-1 inline-flex items-center gap-1 font-semibold"><Info className="size-3.5" /> Informations</span>
          <input
            className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm"
            onChange={(event) => setProjectMeta((current) => ({ ...current, info: event.target.value }))}
            placeholder="Nom / objectif du projet"
            value={projectMeta.info}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          <span className="mb-1 inline-flex items-center gap-1 font-semibold"><Brain className="size-3.5" /> Mémoire</span>
          <input
            className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 text-sm"
            onChange={(event) => setProjectMeta((current) => ({ ...current, memory: event.target.value }))}
            placeholder="Rappels projet, décisions, TODO..."
            value={projectMeta.memory}
          />
        </label>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <section className="liquid-panel rounded-2xl p-4 lg:order-2">
          <div className="overflow-hidden rounded-xl border border-border/50">
            <div className="flex items-center justify-between border-b border-border/40 bg-background/80 px-2 py-1">
              <div className="flex flex-1 items-center gap-1 overflow-x-auto">
                {editorTabs.map((tab) => {
                  const TabIcon = runtimeIcons[tab.runtime] ?? FileCode2;
                  return (
                    <button
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${tab.id === activeTabId ? "bg-primary/15 text-primary" : "hover:bg-background"}`}
                      key={tab.id}
                      onClick={() => setActiveTabId(tab.id)}
                      type="button"
                    >
                      <TabIcon className="size-3.5" />
                      <span>{tab.name}</span>
                      {editorTabs.length > 1 && (
                        <span
                          className="ml-1 rounded p-0.5 hover:bg-destructive/15"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditorTabs((current) => {
                              const nextTabs = current.filter((item) => item.id !== tab.id);
                              if (tab.id === activeTabId && nextTabs[0]) {
                                setActiveTabId(nextTabs[0].id);
                              }
                              return nextTabs.length ? nextTabs : current;
                            });
                          }}
                        >
                          <X className="size-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
                <button className="inline-flex items-center rounded-md border border-dashed px-2 py-1 text-xs" onClick={addEditorTab} type="button">
                  <Plus className="mr-1 size-3.5" /> Nouveau
                </button>
              </div>
              <button className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 text-[11px]" onClick={() => setShowMiniMap((current) => !current)} type="button">
                <FileCode2 className="size-3.5" /> Mini-map {showMiniMap ? "ON" : "OFF"}
              </button>
            </div>
            <div className={`grid min-h-[360px] ${showMiniMap ? "grid-cols-[1fr_120px]" : "grid-cols-1"}`}>
              <div className={`${editorThemeClass} relative grid grid-cols-[52px_1fr]`}>
                <div className="border-r border-border/30 bg-muted/30 px-1 py-2 text-right text-[11px]">
                  {visibleLines.map((line) => {
                    const fold = foldRanges.find((item) => item.start === line.lineNumber);
                    const isFolded = foldedSet.has(line.lineNumber);
                    const hiddenCount = fold ? fold.end - fold.start : 0;
                    return (
                      <div className={`group flex h-5 items-center justify-end gap-1 rounded px-1 ${activeLineNumber === line.lineNumber ? "bg-primary/15 text-primary" : ""}`} key={line.lineNumber}>
                        {fold ? (
                          <button className="opacity-0 transition group-hover:opacity-100" onClick={() => toggleFold(line.lineNumber)} type="button">
                            {isFolded ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
                          </button>
                        ) : <span className="w-3" />}
                        <button className="min-w-6 text-right" onClick={() => onLineNumberClick(line.lineNumber)} type="button">{line.lineNumber}</button>
                        {isFolded && hiddenCount > 0 ? <span className="text-[10px] text-muted-foreground">+{hiddenCount}</span> : null}
                      </div>
                    );
                  })}
                </div>
                <textarea
                  className="min-h-[360px] w-full resize-none bg-transparent px-3 py-2 font-mono text-xs outline-none"
                  onChange={(event) => setCode(event.target.value)}
                  onClick={(event) => {
                    const target = event.target as HTMLTextAreaElement;
                    const before = target.value.slice(0, target.selectionStart);
                    const line = before.split("\n").length;
                    const column = before.split("\n").at(-1)?.length ?? 0;
                    setActiveLineNumber(line);
                    setCursorPosition({ line, column: column + 1 });
                  }}
                  onKeyUp={(event) => {
                    const target = event.currentTarget;
                    const before = target.value.slice(0, target.selectionStart);
                    const line = before.split("\n").length;
                    const column = before.split("\n").at(-1)?.length ?? 0;
                    setActiveLineNumber(line);
                    setCursorPosition({ line, column: column + 1 });
                  }}
                  value={code}
                />
              </div>
              {showMiniMap && (
                <div className="border-l border-border/40 bg-muted/20 p-2">
                  <div className="max-h-[360px] overflow-auto rounded bg-background/60 p-1 font-mono text-[8px] leading-3">
                    {lineList.map((line, index) => (
                      <button className={`block w-full truncate text-left ${activeLineNumber === index + 1 ? "bg-primary/15 text-primary" : "text-muted-foreground"}`} key={`${index + 1}-${line}`} onClick={() => onLineNumberClick(index + 1)} type="button">
                        {line || "·"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-border/40 bg-background/80 px-3 py-1 text-[11px]">
              <span>Runtime: {runtimeLabels[runtime]}</span>
              <span>Ligne {cursorPosition.line}, Col {cursorPosition.column}</span>
              <span>Total lignes: {lineList.length}</span>
              <span>UTF-8</span>
              <span>{toUtf8Bytes(code)} octets</span>
            </div>
          </div>
          <div className="mt-3 space-y-2 rounded-xl border border-border/40 p-3">
            <p className="flex items-center gap-1 text-xs font-semibold"><FolderTree className="size-3.5" /> Arborescence fichiers (multi-fichiers)</p>
            <div className="flex gap-2">
              <input className="h-7 flex-1 rounded border border-border/50 px-2 text-xs" placeholder="src/utils" value={newFolderPath} onChange={(event) => setNewFolderPath(event.target.value)} />
              <button className="inline-flex items-center gap-1 rounded border px-2 text-xs" onClick={() => {
                const normalized = newFolderPath.trim().replace(/^\/+|\/+$/g, "");
                if (!normalized) return;
                setVirtualFolders((current) => [...current, { id: crypto.randomUUID(), path: normalized }]);
                setNewFolderPath("");
              }} type="button"><FolderPlus className="size-3.5" /> Dossier</button>
              <button className="inline-flex items-center gap-1 rounded border px-2 text-xs" onClick={exportProject} type="button"><FileDown className="size-3.5" /> Export .zip</button>
              <label className="inline-flex cursor-pointer items-center gap-1 rounded border px-2 text-xs">
                <FileUp className="size-3.5" /> Import .zip
                <input className="hidden" onChange={(event) => importProject(event.target.files?.[0] ?? null)} type="file" />
              </label>
            </div>
            {virtualFolders.length > 0 && (
              <div className="rounded border border-border/40 p-2 text-[11px]">
                Dossiers: {virtualFolders.map((folder) => folder.path).join(" • ")}
              </div>
            )}
            {virtualFiles.map((file) => (
              <div key={file.id} className="space-y-1 rounded-md border border-border/40 p-2">
                <div className="flex gap-2">
                  <input
                    className="h-7 flex-1 rounded border border-border/50 px-2 text-xs"
                    onChange={(event) =>
                      setVirtualFiles((current) =>
                        current.map((item) => (item.id === file.id ? { ...item, name: event.target.value } : item))
                      )
                    }
                    placeholder="utils.py"
                    value={file.name}
                  />
                  <button className="rounded border px-2 text-xs" onClick={() => setVirtualFiles((current) => current.filter((item) => item.id !== file.id))} type="button">Suppr.</button>
                </div>
                <textarea
                  className="min-h-16 w-full rounded border border-border/50 p-2 font-mono text-xs"
                  onChange={(event) =>
                    setVirtualFiles((current) =>
                      current.map((item) => (item.id === file.id ? { ...item, content: event.target.value } : item))
                    )
                  }
                  placeholder="Contenu du fichier..."
                  value={file.content}
                />
                <p className="text-[10px] text-muted-foreground">Astuce: utilisez des chemins comme <code>src/main.py</code> pour organiser le file tree.</p>
              </div>
            ))}
            <button
              className="rounded-md border border-border/50 px-2 py-1 text-xs"
              onClick={() =>
                setVirtualFiles((current) => [
                  ...current,
                  { id: crypto.randomUUID(), name: `file-${current.length + 1}.txt`, content: "" },
                ])
              }
              type="button"
            >
              + Ajouter un fichier
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              className="h-8 rounded-lg border border-border/60 bg-background/70 px-2 text-xs"
              onChange={(event) => setSnippetName(event.target.value)}
              placeholder="Nom du snippet"
              value={snippetName}
            />
            <button
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2 py-1 text-xs"
              onClick={() => {
                if (!snippetName.trim()) {
                  return;
                }
                setSavedSnippets([
                  {
                    id: crypto.randomUUID(),
                    name: snippetName.trim(),
                    runtime,
                    sourceCode: code,
                  },
                  ...savedSnippets,
                ]);
                setSnippetName("");
              }}
              type="button"
            >
              <Bookmark className="size-3.5" /> Sauver snippet
            </button>
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/50 px-3 py-2 text-xs text-muted-foreground">
            <Upload className="size-3.5" />
            Ajouter CSV / Excel / TXT / JSON
            <input
              accept=".csv,.xlsx,.xls,.txt,.json"
              className="hidden"
              multiple
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
              type="file"
            />
          </label>

          {files.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Fichiers: {files.map((item) => item.name).join(", ")}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
              disabled={isRunning}
              onClick={onRun}
              type="button"
            >
              <Play className="size-4" />
              {isRunning ? "Exécution..." : "Run"}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2 text-sm"
              onClick={() => {
                setFiles([]);
                setResult(null);
              }}
              type="button"
            >
              Réinitialiser sortie
            </button>
          </div>
        </section>

        <section className="liquid-panel rounded-2xl p-4 lg:order-1">
          <h2 className="mb-2 text-sm font-medium">Output</h2>
          <div className="space-y-2 text-xs">
            {result?.logs?.length ? (
              <pre className="rounded-xl bg-background/80 p-2">
                {result.logs.join("\n")}
              </pre>
            ) : null}
            {result?.output ? (
              <pre className="rounded-xl bg-emerald-500/10 p-2">
                {result.output}
              </pre>
            ) : null}
            {result?.error ? (
              <pre className="rounded-xl bg-red-500/10 p-2 text-red-700">
                {result.error}
              </pre>
            ) : null}
            {typeof result?.exitCode === "undefined" ? null : (
              <p>Code retour: {String(result.exitCode)}</p>
            )}
            {result ? null : (
              <p className="text-muted-foreground">
                Aucun résultat pour le moment.
              </p>
            )}
          </div>

          <div className="mt-4 grid gap-2">
            {features.map((item) => (
              <div
                className="flex items-center gap-2 text-xs text-muted-foreground"
                key={item.label}
              >
                <item.icon className="size-3.5" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <p className="flex items-center gap-1 text-xs font-semibold">
              <Bookmark className="size-3.5" /> Snippets
            </p>
            <div className="max-h-24 space-y-1 overflow-auto pr-1">
              {savedSnippets.slice(0, 6).map((snippet) => (
                <button
                  className="block w-full rounded-md border border-border/40 px-2 py-1 text-left text-[11px]"
                  key={snippet.id}
                  onClick={() => {
                    setRuntime(snippet.runtime);
                    setCode(snippet.sourceCode);
                  }}
                  type="button"
                >
                  {snippet.name}
                </button>
              ))}
            </div>

            <p className="flex items-center gap-1 pt-2 text-xs font-semibold">
              <History className="size-3.5" /> Historique runs
            </p>
            <div className="max-h-40 space-y-1 overflow-auto pr-1">
              {history.slice(0, 12).map((entry) => (
                <div className="flex items-center gap-1" key={entry.createdAt}>
                  <button
                    className="block flex-1 rounded-md border border-border/40 px-2 py-1 text-left text-[11px]"
                    onClick={() => {
                      setRuntime(entry.runtime);
                      setCode(entry.sourceCode);
                      setResult(entry.output);
                    }}
                    type="button"
                  >
                    {runtimeLabels[entry.runtime]} · {new Date(entry.createdAt).toLocaleTimeString("fr-FR")}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="rounded-md border px-2 py-1 text-[10px]"
                        type="button"
                      >
                        <EllipsisVertical className="size-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          setSavedSnippets((current) => [
                            {
                              id: crypto.randomUUID(),
                              name: `Pinned ${runtimeLabels[entry.runtime]}`,
                              runtime: entry.runtime,
                              sourceCode: entry.sourceCode,
                            },
                            ...current,
                          ])
                        }
                      >
                        Épingler
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          navigator.clipboard.writeText(entry.sourceCode)
                        }
                      >
                        Copier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          const blob = new Blob([entry.sourceCode], {
                            type: "text/plain",
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `run-${entry.createdAt}.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                      >
                        Exporter
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => setCompareWithEntry(entry)}
                      >
                        Comparer (diff)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
            <p className="flex items-center gap-1 pt-2 text-xs font-semibold"><History className="size-3.5" /> Versions (mini-git local)</p>
            <div className="max-h-32 space-y-1 overflow-auto pr-1">
              {versionSnapshots.slice(0, 8).map((entry) => (
                <div className="flex items-center gap-1" key={`${entry.createdAt}-snapshot`}>
                  <button className="block flex-1 rounded-md border border-border/40 px-2 py-1 text-left text-[11px]" onClick={() => setCompareWithEntry(entry)} type="button">
                    Snapshot {new Date(entry.createdAt).toLocaleTimeString("fr-FR")}
                  </button>
                  <button className="rounded border px-2 py-1 text-[10px]" onClick={() => setCode(entry.sourceCode)} type="button">Restaurer</button>
                </div>
              ))}
            </div>
          </div>
          {compareWithEntry ? (
            <div className="mt-4 rounded-xl border border-border/40 p-2">
              <p className="text-xs font-semibold">Diff avec version {new Date(compareWithEntry.createdAt).toLocaleTimeString("fr-FR")}</p>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-background/80 p-2 text-[11px]">
                {computeLineDiff(compareWithEntry.sourceCode, code)}
              </pre>
              <div className="mt-2 flex gap-2">
                <button className="rounded border px-2 py-1 text-xs" onClick={() => setCode(compareWithEntry.sourceCode)} type="button">Restaurer cette version</button>
                <button className="rounded border px-2 py-1 text-xs" onClick={() => setCompareWithEntry(null)} type="button">Fermer</button>
              </div>
            </div>
          ) : null}
          <div className="mt-4 space-y-2 rounded-xl border border-border/40 p-2">
            <p className="text-xs font-semibold">Assistant IA code + historique</p>
            <textarea
              className="min-h-16 w-full rounded-md border border-border/50 bg-background/70 p-2 text-xs"
              onChange={(event) => setAssistantPrompt(event.target.value)}
              placeholder="Ex: Crée un script Python qui lit un CSV et exporte le top 5 en JSON."
              value={assistantPrompt}
            />
            <div className="flex gap-2">
              <button className="rounded-md bg-violet-600 px-2 py-1 text-xs text-white disabled:opacity-50" disabled={isGenerating} onClick={askAssistant} type="button">
                {isGenerating ? "Génération..." : "Demander à l'IA"}
              </button>
              <button
                className="rounded-md border border-border/50 px-2 py-1 text-xs"
                onClick={() => {
                  const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `generated-${runtime}.${runtimeExtensions[runtime]}`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                type="button"
              >
                Télécharger le code
              </button>
            </div>
            <div className="max-h-40 space-y-1 overflow-auto">
              {assistantMessages.slice(0, 8).map((message) => (
                <div className="rounded-md border border-border/40 p-1 text-[11px]" key={message.id}>
                  <p className="font-semibold">{message.role === "assistant" ? "IA" : "Vous"} · {new Date(message.createdAt).toLocaleTimeString("fr-FR")}</p>
                  <MessageResponse className="text-xs text-muted-foreground">{message.content}</MessageResponse>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-2 rounded-xl border border-border/40 p-2">
            <p className="text-xs font-semibold">Terminal</p>
            <div className="flex gap-2">
              <input className="h-8 flex-1 rounded border border-border/50 px-2 text-xs" onChange={(event) => setTerminalCommand(event.target.value)} value={terminalCommand} />
              <button className="rounded-md bg-black px-2 py-1 text-xs text-white" onClick={runTerminalCommand} type="button">Run</button>
            </div>
            <pre className="max-h-28 overflow-auto rounded bg-background/80 p-2 text-[11px]">{terminalOutput || "Aucune commande exécutée."}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
