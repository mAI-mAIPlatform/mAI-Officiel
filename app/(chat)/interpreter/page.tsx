"use client";

import {
  BarChart3,
  Bookmark,
  FileSpreadsheet,
  History,
  Play,
  SquareTerminal,
  Table,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

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
  | "markdown";

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
];

const quickPresets: Array<{ label: string; runtime: Runtime }> = [
  { label: "Analyse CSV", runtime: "python" },
  { label: "Script CLI", runtime: "bash" },
  { label: "Sandbox JS", runtime: "javascript" },
  { label: "Requête SQL", runtime: "sql" },
];

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
  const [runtime, setRuntime] = useState<Runtime>("python");
  const [code, setCode] = useState(runtimeSnippets.python);
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
      const payloadFiles = await Promise.all(files.map(toRuntimeFile));
      const response = await fetch("/api/code-interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, files: payloadFiles, runtime }),
      });

      const payload = (await response.json()) as ExecutionResponse;
      setResult(payload);
      setHistory((current) =>
        [
          {
            createdAt: new Date().toISOString(),
            output: payload,
            runtime,
            sourceCode: code,
          },
          ...current,
        ].slice(0, 20)
      );
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

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="liquid-panel space-y-3 rounded-2xl p-4">
          <textarea
            className={`min-h-[360px] w-full rounded-xl border border-border/40 p-3 font-mono text-xs ${editorThemeClass}`}
            onChange={(event) => setCode(event.target.value)}
            value={code}
          />

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

        <section className="liquid-panel rounded-2xl p-4">
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
            <div className="max-h-32 space-y-1 overflow-auto pr-1">
              {history.slice(0, 6).map((entry) => (
                <button
                  className="block w-full rounded-md border border-border/40 px-2 py-1 text-left text-[11px]"
                  key={entry.createdAt}
                  onClick={() => {
                    setRuntime(entry.runtime);
                    setCode(entry.sourceCode);
                    setResult(entry.output);
                  }}
                  type="button"
                >
                  {runtimeLabels[entry.runtime]} ·{" "}
                  {new Date(entry.createdAt).toLocaleTimeString("fr-FR")}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
