"use client";

import {
  BarChart3,
  Brain,
  Bookmark,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Braces,
  ChevronDown,
  ChevronRight,
  Clock3,
  Cog,
  EllipsisVertical,
  FileCode2,
  FunctionSquare,
  Funnel,
  FileSpreadsheet,
  History,
  Info,
  KeyRound,
  Plus,
  Play,
  Sparkles,
  SquareTerminal,
  Table,
  Upload,
  Variable,
  WandSparkles,
  X,
  FolderTree,
  FolderPlus,
  FileDown,
  FileUp,
  Palette,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { DEFAULT_TEXT_MODEL_KEY, FALLBACK_DEFAULT_TEXT_MODEL } from "@/lib/default-models";

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
type ThemeColors = {
  comment: string;
  cursor: string;
  editorBg: string;
  function: string;
  gutterBg: string;
  keyword: string;
  number: string;
  string: string;
  text: string;
};
type EditorThemeConfig = { colors: ThemeColors; id: string; label: string; mode: "dark" | "light" };

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
type SuggestionKind = "class" | "function" | "keyword" | "module" | "variable";
type AutoSuggestion = { detail: string; insertText: string; kind: SuggestionKind; label: string; score: number };
type SnippetPlaceholder = { end: number; start: number };
type SnippetSession = { index: number; placeholders: SnippetPlaceholder[] } | null;
type AssistantMode = "explain" | "fix" | "optimize";
type GenerationHistoryEntry = { createdAt: string; prompt: string; runtime: Runtime };
type EditorPreferences = {
  autoClearOutputBeforeRun: boolean;
  autoSaveSnippetOnRun: boolean;
  confirmBeforeResetOutput: boolean;
  fontFamily: string;
  fontLigatures: boolean;
  fontSize: number;
  indentSize: number;
  minimapEnabled: boolean;
  outputPanelPosition: "bottom" | "right";
  showInvisibleChars: boolean;
  tabMode: "spaces" | "tabs";
  wordWrap: boolean;
};
type DataRow = Record<string, string | number | null>;
type ColumnFilter = { max?: number; min?: number; mode: "contains" | "exact" | "range"; value?: string };

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

const defaultThemeColors: ThemeColors = {
  comment: "#6272a4",
  cursor: "#f8f8f2",
  editorBg: "#282a36",
  function: "#8be9fd",
  gutterBg: "#1f2230",
  keyword: "#ff79c6",
  number: "#bd93f9",
  string: "#f1fa8c",
  text: "#f8f8f2",
};

const builtInThemes: EditorThemeConfig[] = [
  { id: "monokai", label: "Monokai", mode: "dark", colors: { ...defaultThemeColors, editorBg: "#272822", gutterBg: "#1f201c", keyword: "#f92672", string: "#e6db74", comment: "#75715e", function: "#66d9ef", number: "#ae81ff", cursor: "#f8f8f0", text: "#f8f8f2" } },
  { id: "dracula", label: "Dracula", mode: "dark", colors: defaultThemeColors },
  { id: "one-dark", label: "One Dark", mode: "dark", colors: { ...defaultThemeColors, editorBg: "#282c34", gutterBg: "#1f2329", text: "#abb2bf", keyword: "#c678dd", string: "#98c379", comment: "#5c6370", function: "#61afef", number: "#d19a66" } },
  { id: "github-dark", label: "GitHub Dark", mode: "dark", colors: { ...defaultThemeColors, editorBg: "#0d1117", gutterBg: "#161b22", text: "#c9d1d9", keyword: "#ff7b72", string: "#a5d6ff", comment: "#8b949e", function: "#d2a8ff", number: "#ffa657", cursor: "#c9d1d9" } },
  { id: "nord", label: "Nord", mode: "dark", colors: { ...defaultThemeColors, editorBg: "#2e3440", gutterBg: "#3b4252", text: "#d8dee9", keyword: "#81a1c1", string: "#a3be8c", comment: "#616e88", function: "#88c0d0", number: "#b48ead", cursor: "#eceff4" } },
  { id: "tokyo-night", label: "Tokyo Night", mode: "dark", colors: { ...defaultThemeColors, editorBg: "#1a1b26", gutterBg: "#16161e", text: "#c0caf5", keyword: "#bb9af7", string: "#9ece6a", comment: "#565f89", function: "#7aa2f7", number: "#ff9e64", cursor: "#c0caf5" } },
  { id: "catppuccin-mocha", label: "Catppuccin Mocha", mode: "dark", colors: { ...defaultThemeColors, editorBg: "#1e1e2e", gutterBg: "#181825", text: "#cdd6f4", keyword: "#cba6f7", string: "#a6e3a1", comment: "#6c7086", function: "#89dceb", number: "#fab387", cursor: "#f5e0dc" } },
  { id: "synthwave-84", label: "Synthwave 84", mode: "dark", colors: { ...defaultThemeColors, editorBg: "#2a2139", gutterBg: "#241b2f", text: "#f92aad", keyword: "#f97e72", string: "#72f1b8", comment: "#848bbd", function: "#36f9f6", number: "#fede5d", cursor: "#36f9f6" } },
  { id: "gruvbox-dark", label: "Gruvbox Dark", mode: "dark", colors: { ...defaultThemeColors, editorBg: "#282828", gutterBg: "#1d2021", text: "#ebdbb2", keyword: "#fb4934", string: "#b8bb26", comment: "#928374", function: "#83a598", number: "#d3869b", cursor: "#ebdbb2" } },
  { id: "material-ocean", label: "Material Ocean", mode: "dark", colors: { ...defaultThemeColors, editorBg: "#0f111a", gutterBg: "#090b10", text: "#a6accd", keyword: "#c792ea", string: "#c3e88d", comment: "#546e7a", function: "#82aaff", number: "#f78c6c", cursor: "#ffcc00" } },
  { id: "ayu-dark", label: "Ayu Dark", mode: "dark", colors: { ...defaultThemeColors, editorBg: "#0a0e14", gutterBg: "#11151c", text: "#b3b1ad", keyword: "#ff8f40", string: "#b8cc52", comment: "#5c6773", function: "#59c2ff", number: "#d2a6ff", cursor: "#e6b450" } },
  { id: "github-light", label: "GitHub Light", mode: "light", colors: { ...defaultThemeColors, editorBg: "#ffffff", gutterBg: "#f6f8fa", text: "#24292f", keyword: "#cf222e", string: "#0a3069", comment: "#6e7781", function: "#8250df", number: "#953800", cursor: "#24292f" } },
  { id: "solarized-light", label: "Solarized Light", mode: "light", colors: { ...defaultThemeColors, editorBg: "#fdf6e3", gutterBg: "#eee8d5", text: "#657b83", keyword: "#859900", string: "#2aa198", comment: "#93a1a1", function: "#268bd2", number: "#d33682", cursor: "#586e75" } },
  { id: "vitesse-light", label: "Vitesse Light", mode: "light", colors: { ...defaultThemeColors, editorBg: "#f8f8f8", gutterBg: "#f0f0f0", text: "#393a34", keyword: "#1f6feb", string: "#ab5959", comment: "#a0ada0", function: "#2993a3", number: "#b75501", cursor: "#393a34" } },
  { id: "palenight-light", label: "Palenight Light", mode: "light", colors: { ...defaultThemeColors, editorBg: "#f7f7ff", gutterBg: "#ececff", text: "#403f53", keyword: "#7c4dff", string: "#43a047", comment: "#9ea0b3", function: "#1565c0", number: "#ff7043", cursor: "#403f53" } },
];

const defaultEditorPreferences: EditorPreferences = {
  autoClearOutputBeforeRun: true,
  autoSaveSnippetOnRun: false,
  confirmBeforeResetOutput: true,
  fontFamily: "Fira Code",
  fontLigatures: true,
  fontSize: 12,
  indentSize: 2,
  minimapEnabled: true,
  outputPanelPosition: "right",
  showInvisibleChars: false,
  tabMode: "spaces",
  wordWrap: false,
};

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

const suggestionIconByKind: Record<SuggestionKind, typeof Variable> = {
  class: Braces,
  function: FunctionSquare,
  keyword: KeyRound,
  module: FileCode2,
  variable: Variable,
};

const pythonKeywords = ["def", "class", "for", "while", "if", "elif", "else", "try", "except", "return", "import", "from"];
const pythonModuleMembers: Record<string, Array<{ detail: string; label: string }>> = {
  csv: [{ label: "DictReader", detail: "class" }, { label: "reader", detail: "fn(iterable) -> iterator" }],
  json: [{ label: "dump", detail: "fn(obj, fp) -> None" }, { label: "dumps", detail: "fn(obj) -> str" }, { label: "loads", detail: "fn(str) -> object" }],
  math: [{ label: "sqrt", detail: "fn(x) -> float" }, { label: "pow", detail: "fn(x, y) -> float" }, { label: "pi", detail: "const float" }],
  matplotlib: [{ label: "pyplot", detail: "module" }],
  os: [{ label: "getcwd", detail: "fn() -> str" }, { label: "listdir", detail: "fn(path) -> list[str]" }, { label: "path", detail: "module" }],
  pandas: [{ label: "DataFrame", detail: "class" }, { label: "read_csv", detail: "fn(path) -> DataFrame" }],
  statistics: [{ label: "mean", detail: "fn(data) -> float" }, { label: "median", detail: "fn(data) -> float" }, { label: "stdev", detail: "fn(data) -> float" }],
};
const jsTsKeywords = ["function", "const", "let", "class", "if", "else", "for", "while", "return", "async", "await", "import", "export"];
const jsTsMembers: Record<string, Array<{ detail: string; label: string }>> = {
  Array: [{ label: "map", detail: "fn(callback) -> Array" }, { label: "filter", detail: "fn(callback) -> Array" }, { label: "reduce", detail: "fn(callback, init) -> any" }],
  Date: [{ label: "now", detail: "fn() -> number" }, { label: "toISOString", detail: "fn() -> string" }],
  Math: [{ label: "floor", detail: "fn(x) -> number" }, { label: "random", detail: "fn() -> number" }, { label: "max", detail: "fn(...n) -> number" }],
  Object: [{ label: "keys", detail: "fn(obj) -> string[]" }, { label: "entries", detail: "fn(obj) -> [k,v][]" }],
  Promise: [{ label: "then", detail: "fn(onFulfilled) -> Promise" }, { label: "catch", detail: "fn(onRejected) -> Promise" }],
  String: [{ label: "toUpperCase", detail: "fn() -> string" }, { label: "trim", detail: "fn() -> string" }, { label: "split", detail: "fn(sep) -> string[]" }],
};

const snippetTemplates: Partial<Record<Runtime, Record<string, string>>> = {
  python: { for: "for ${1:item} in ${2:items}:\n    ${3:pass}" },
  javascript: { for: "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i} += 1) {\n  ${3:// code}\n}" },
  typescript: { for: "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i} += 1) {\n  ${3:// code}\n}" },
};

const parseSnippetTemplate = (template: string) => {
  const regex = /\$\{(\d+):([^}]+)\}/g;
  let output = "";
  let lastIndex = 0;
  const placeholders: Array<{ index: number; start: number; end: number }> = [];
  for (const match of template.matchAll(regex)) {
    const full = match[0];
    const idx = Number(match[1]);
    const text = match[2] ?? "";
    const start = match.index ?? 0;
    output += template.slice(lastIndex, start);
    const rangeStart = output.length;
    output += text;
    placeholders.push({ index: idx, start: rangeStart, end: rangeStart + text.length });
    lastIndex = start + full.length;
  }
  output += template.slice(lastIndex);
  placeholders.sort((a, b) => a.index - b.index);
  return { placeholders: placeholders.map((item) => ({ start: item.start, end: item.end })), text: output };
};

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

const extractDeclaredSymbols = (source: string, runtime: Runtime) => {
  const variables = new Set<string>();
  const functions = new Set<string>();
  if (runtime === "python") {
    for (const line of source.split("\n")) {
      const funcMatch = line.match(/^\s*def\s+([a-zA-Z_]\w*)/);
      if (funcMatch?.[1]) functions.add(funcMatch[1]);
      const variableMatch = line.match(/^\s*([a-zA-Z_]\w*)\s*=/);
      if (variableMatch?.[1]) variables.add(variableMatch[1]);
    }
  }
  if (runtime === "javascript" || runtime === "typescript") {
    for (const line of source.split("\n")) {
      const funcMatch = line.match(/^\s*(?:function\s+)?([a-zA-Z_$]\w*)\s*=\s*\(/) ?? line.match(/^\s*function\s+([a-zA-Z_$]\w*)/);
      if (funcMatch?.[1]) functions.add(funcMatch[1]);
      const variableMatch = line.match(/^\s*(?:const|let|var)\s+([a-zA-Z_$]\w*)/);
      if (variableMatch?.[1]) variables.add(variableMatch[1]);
    }
  }
  return { functions: Array.from(functions), variables: Array.from(variables) };
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
  const [showEditorPreferences, setShowEditorPreferences] = useState(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<AutoSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [autocompleteAnchor, setAutocompleteAnchor] = useState({ left: 20, top: 40 });
  const [autocompleteTarget, setAutocompleteTarget] = useState({ end: 0, start: 0 });
  const [snippetSession, setSnippetSession] = useState<SnippetSession>(null);
  const [assistantPanelOpen, setAssistantPanelOpen] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("explain");
  const [assistantPanelContent, setAssistantPanelContent] = useState("");
  const [assistantDiffPreview, setAssistantDiffPreview] = useState("");
  const [assistantOptimizations, setAssistantOptimizations] = useState<string[]>([]);
  const [assistantProposedCode, setAssistantProposedCode] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState("");
  const [showExplainBubble, setShowExplainBubble] = useState(false);
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [commandBarOpen, setCommandBarOpen] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generationRefinement, setGenerationRefinement] = useState("");
  const [isGeneratingFromPrompt, setIsGeneratingFromPrompt] = useState(false);
  const [showGenerationHistory, setShowGenerationHistory] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<{
    code: string;
    end: number;
    previousCode: string;
    prompt: string;
    start: number;
  } | null>(null);
  const [cursorOffset, setCursorOffset] = useState(0);
  const [outputTab, setOutputTab] = useState<"data" | "output">("output");
  const [dataRows, setDataRows] = useState<DataRow[]>([]);
  const [dataColumns, setDataColumns] = useState<string[]>([]);
  const [dataTypes, setDataTypes] = useState<Record<string, string>>({});
  const [globalDataSearch, setGlobalDataSearch] = useState("");
  const [dataSort, setDataSort] = useState<{ column: string; direction: "asc" | "desc" } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [quickPreviewMode, setQuickPreviewMode] = useState(true);
  const [dataPage, setDataPage] = useState(1);
  const [dataPageSize, setDataPageSize] = useState<25 | 50 | 100>(25);
  const [dataProfile, setDataProfile] = useState<Array<{ column: string; count: number; max: number; mean: number; median: number; min: number; q1: number; q3: number; stddev: number }>>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResponse | null>(null);
  const [snippetName, setSnippetName] = useState("");
  const [editorTheme, setEditorTheme] = useState<string>("dracula");
  const [customThemes, setCustomThemes] = useLocalStorage<EditorThemeConfig[]>(
    "mai.interpreter.custom-themes.v1",
    []
  );
  const [showThemeLibrary, setShowThemeLibrary] = useState(false);
  const [hoveredThemeId, setHoveredThemeId] = useState<string>("dracula");
  const [showCustomThemeEditor, setShowCustomThemeEditor] = useState(false);
  const [customThemeName, setCustomThemeName] = useState("Mon thème");
  const [customThemeDraft, setCustomThemeDraft] = useState<ThemeColors>(defaultThemeColors);
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
  const [selectedModelId] = useLocalStorage<string>(
    DEFAULT_TEXT_MODEL_KEY,
    FALLBACK_DEFAULT_TEXT_MODEL
  );
  const [generationHistory, setGenerationHistory] = useLocalStorage<GenerationHistoryEntry[]>(
    "mai.interpreter.generation-history.v1",
    []
  );
  const [editorPreferences, setEditorPreferences] = useLocalStorage<EditorPreferences>(
    "mai.interpreter.preferences.v1",
    defaultEditorPreferences
  );
  const activeTab = editorTabs.find((tab) => tab.id === activeTabId) ?? editorTabs[0];
  const runtime = activeTab?.runtime ?? "python";
  const code = activeTab?.content ?? "";
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const commandInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandBarOpen(true);
        setTimeout(() => commandInputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const allThemes = [...builtInThemes, ...customThemes];
  const activeTheme = allThemes.find((theme) => theme.id === editorTheme) ?? builtInThemes[1];

  const onRun = async () => {
    setIsRunning(true);
    if (editorPreferences.autoClearOutputBeforeRun) {
      setResult(null);
    }

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
      if (editorPreferences.autoSaveSnippetOnRun) {
        setSavedSnippets((current) => [
          {
            id: crypto.randomUUID(),
            name: `Auto ${runtimeLabels[runtime]} ${new Date().toLocaleTimeString("fr-FR")}`,
            runtime,
            sourceCode: code,
          },
          ...current,
        ].slice(0, 50));
      }
      if (payload.error) {
        const lineMatch = payload.error.match(/line\s+(\d+)/i) ?? payload.error.match(/:(\d+):\d+/);
        const parsedLine = lineMatch?.[1] ? Number(lineMatch[1]) : null;
        setErrorLine(Number.isFinite(parsedLine) ? parsedLine : null);
        void analyzeFixFromError(payload.error);
      } else {
        setErrorLine(null);
      }
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
      setErrorLine(null);
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
        body: JSON.stringify({ modelId: selectedModelId, prompt: assistantPrompt.trim(), runtime }),
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

  const parseDatasetFile = async (file: File) => {
    if (file.name.endsWith(".csv")) {
      const text = await file.text();
      const rows = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (!rows.length) return { columns: [] as string[], records: [] as DataRow[] };
      const columns = rows[0]?.split(",").map((item) => item.trim()) ?? [];
      const records = rows.slice(1).map((row) => {
        const values = row.split(",");
        return columns.reduce<DataRow>((acc, column, index) => {
          const raw = values[index]?.trim() ?? "";
          const asNumber = Number(raw);
          acc[column] = raw.length === 0 ? null : Number.isFinite(asNumber) && raw !== "" ? asNumber : raw;
          return acc;
        }, {});
      });
      return { columns, records };
    }
    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) return { columns: [] as string[], records: [] as DataRow[] };
      const records = XLSX.utils.sheet_to_json<DataRow>(workbook.Sheets[firstSheet], { defval: null });
      const columns = Object.keys(records[0] ?? {});
      return { columns, records };
    }
    return { columns: [] as string[], records: [] as DataRow[] };
  };

  const computeStats = (values: number[]) => {
    if (!values.length) return { max: 0, mean: 0, median: 0, min: 0, q1: 0, q3: 0, stddev: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const getQ = (q: number) => {
      const position = (sorted.length - 1) * q;
      const base = Math.floor(position);
      const rest = position - base;
      const next = sorted[base + 1] ?? sorted[base] ?? 0;
      return (sorted[base] ?? 0) + rest * (next - (sorted[base] ?? 0));
    };
    const mean = sorted.reduce((acc, current) => acc + current, 0) / sorted.length;
    const variance = sorted.reduce((acc, current) => acc + (current - mean) ** 2, 0) / sorted.length;
    return {
      max: sorted[sorted.length - 1] ?? 0,
      mean,
      median: getQ(0.5),
      min: sorted[0] ?? 0,
      q1: getQ(0.25),
      q3: getQ(0.75),
      stddev: Math.sqrt(variance),
    };
  };

  useEffect(() => {
    const loadDataPreview = async () => {
      const source = files.find((file) => /\.(csv|xlsx|xls)$/i.test(file.name));
      if (!source) {
        setDataRows([]);
        setDataColumns([]);
        setDataTypes({});
        return;
      }
      const parsed = await parseDatasetFile(source);
      setDataRows(parsed.records);
      setDataColumns(parsed.columns);
      if (parsed.records.length > 0) {
        setOutputTab("data");
      }
      setDataTypes(
        parsed.columns.reduce<Record<string, string>>((acc, column) => {
          const sample = parsed.records.find((row) => row[column] !== null && row[column] !== "")?.[column];
          acc[column] = typeof sample === "number" ? "number" : "string";
          return acc;
        }, {})
      );
    };
    void loadDataPreview();
  }, [files]);

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
  const generatedLineRange = pendingGeneration
    ? {
        end: code.slice(0, pendingGeneration.end).split("\n").length,
        start: code.slice(0, pendingGeneration.start).split("\n").length,
      }
    : null;

  const filteredDataRows = dataRows.filter((row) => {
    const matchesGlobal = globalDataSearch.trim().length === 0
      || Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(globalDataSearch.toLowerCase()));
    if (!matchesGlobal) return false;
    return dataColumns.every((column) => {
      const filter = columnFilters[column];
      if (!filter) return true;
      const rawValue = row[column];
      const asString = String(rawValue ?? "").toLowerCase();
      if (filter.mode === "contains") return asString.includes((filter.value ?? "").toLowerCase());
      if (filter.mode === "exact") return asString === (filter.value ?? "").toLowerCase();
      if (filter.mode === "range") {
        const numeric = Number(rawValue);
        if (!Number.isFinite(numeric)) return false;
        if (typeof filter.min === "number" && numeric < filter.min) return false;
        if (typeof filter.max === "number" && numeric > filter.max) return false;
      }
      return true;
    });
  });

  const sortedDataRows = [...filteredDataRows].sort((a, b) => {
    if (!dataSort) return 0;
    const left = a[dataSort.column];
    const right = b[dataSort.column];
    const multiplier = dataSort.direction === "asc" ? 1 : -1;
    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * multiplier;
    }
    return String(left ?? "").localeCompare(String(right ?? "")) * multiplier;
  });

  const pagedDataRows = sortedDataRows.slice((dataPage - 1) * dataPageSize, dataPage * dataPageSize);
  const totalPages = Math.max(1, Math.ceil(sortedDataRows.length / dataPageSize));
  const previewRows = quickPreviewMode && sortedDataRows.length > 20
    ? [...sortedDataRows.slice(0, 10), ...sortedDataRows.slice(-10)]
    : pagedDataRows;

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

  const askCodeAssistant = async (prompt: string) => {
    const response = await fetch("/api/code-interpreter/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: selectedModelId, prompt, runtime }),
    });
    const payload = (await response.json()) as { answer?: string; error?: string };
    if (!response.ok || !payload.answer) {
      throw new Error(payload.error ?? "Assistant indisponible");
    }
    return payload.answer;
  };

  const extractImportedDataContext = async () => {
    const contextChunks: string[] = [];
    for (const file of files.slice(0, 2)) {
      if (file.name.endsWith(".csv")) {
        const text = await file.text();
        const rows = text.split(/\r?\n/).filter(Boolean);
        const headers = (rows[0] ?? "").split(",").map((item) => item.trim()).filter(Boolean);
        const preview = rows.slice(1, 4).join("\n");
        contextChunks.push(`CSV ${file.name}\nColonnes: ${headers.join(", ")}\nAperçu:\n${preview}`);
      }
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) continue;
        const json = XLSX.utils.sheet_to_json<Array<string | number | boolean>>(workbook.Sheets[firstSheetName], { header: 1 });
        const firstRow = (json[0] ?? []).map((item) => String(item));
        const preview = json.slice(1, 4).map((line) => line.map((item) => String(item)).join(", ")).join("\n");
        contextChunks.push(`Excel ${file.name}\nColonnes: ${firstRow.join(", ")}\nAperçu:\n${preview}`);
      }
    }
    return contextChunks.join("\n\n");
  };

  const animateCodeInsertion = async (baseCode: string, insertAt: number, generatedCode: string) => {
    const safeStart = Math.max(0, Math.min(insertAt, baseCode.length));
    for (let step = 1; step <= generatedCode.length; step += 1) {
      const nextCode = `${baseCode.slice(0, safeStart)}${generatedCode.slice(0, step)}${baseCode.slice(safeStart)}`;
      setCode(nextCode);
      // biome-ignore lint/suspicious/noConsole: animation delay
      await new Promise((resolve) => setTimeout(resolve, 6));
    }
    return { end: safeStart + generatedCode.length, start: safeStart };
  };

  const generateCodeFromCommand = async (customPrompt?: string) => {
    const prompt = (customPrompt ?? generationPrompt).trim();
    if (!prompt) return;
    setIsGeneratingFromPrompt(true);
    try {
      const dataContext = await extractImportedDataContext();
      const answer = await askCodeAssistant(
        `Génère du code ${runtimeLabels[runtime]} exécutable uniquement.\nInsère uniquement un bloc de code markdown.\nInstruction: ${prompt}\n${dataContext ? `\nContexte des données importées:\n${dataContext}` : ""}`
      );
      const generatedCode = answer.match(/```[a-zA-Z]*\n([\s\S]*?)```/)?.[1]?.trim() ?? answer.trim();
      if (!generatedCode) return;
      const previousCode = code;
      const insertionPoint = Math.max(0, Math.min(cursorOffset, previousCode.length));
      const range = await animateCodeInsertion(previousCode, insertionPoint, generatedCode);
      setPendingGeneration({
        code: generatedCode,
        end: range.end,
        previousCode,
        prompt,
        start: range.start,
      });
      setGenerationHistory((current) => [
        { createdAt: new Date().toISOString(), prompt, runtime },
        ...current,
      ].slice(0, 20));
      setGenerationPrompt("");
      setGenerationRefinement("");
    } catch (error) {
      setAssistantPanelOpen(true);
      setAssistantMode("fix");
      setAssistantPanelContent(`Erreur génération IA: ${error instanceof Error ? error.message : "inconnue"}`);
    } finally {
      setIsGeneratingFromPrompt(false);
    }
  };

  const explainSelection = async () => {
    if (!selectedCode.trim()) return;
    setAssistantPanelOpen(true);
    setAssistantMode("explain");
    setIsAssistantLoading(true);
    try {
      const answer = await askCodeAssistant(
        `Explique ce bloc de code en français, ligne par ligne, de façon pédagogique. Ajoute un mini résumé final.\n\nCode:\n${selectedCode}`
      );
      setAssistantPanelContent(answer);
    } catch (error) {
      setAssistantPanelContent(`Erreur assistant: ${error instanceof Error ? error.message : "inconnue"}`);
    } finally {
      setIsAssistantLoading(false);
      setShowExplainBubble(false);
    }
  };

  const analyzeFixFromError = async (errorMessage: string) => {
    setAssistantPanelOpen(true);
    setAssistantMode("fix");
    setIsAssistantLoading(true);
    try {
      const answer = await askCodeAssistant(
        `Diagnostique cette erreur et propose un correctif.\nRéponds avec les sections EXACTES:\n[CAUSE]\n...\n[LINE]\nnuméro ou ?\n[PATCH]\n\`\`\`\ncode corrigé complet\n\`\`\`\n\nRuntime: ${runtime}\nErreur:\n${errorMessage}\n\nCode actuel:\n${code}`
      );
      const cause = answer.match(/\[CAUSE\]([\s\S]*?)\[LINE\]/)?.[1]?.trim() ?? answer;
      const line = answer.match(/\[LINE\]\s*([0-9]+)/)?.[1];
      const patch = answer.match(/\[PATCH\][\s\S]*?```[\w-]*\n([\s\S]*?)```/)?.[1]?.trim();
      setAssistantPanelContent(cause);
      if (patch) {
        setAssistantProposedCode(patch);
        setAssistantDiffPreview(computeLineDiff(code, patch));
      } else {
        setAssistantProposedCode(null);
        setAssistantDiffPreview("");
      }
      if (line) setErrorLine(Number(line));
    } catch (error) {
      setAssistantPanelContent(`Erreur assistant: ${error instanceof Error ? error.message : "inconnue"}`);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const analyzeOptimizations = async () => {
    setAssistantPanelOpen(true);
    setAssistantMode("optimize");
    setIsAssistantLoading(true);
    try {
      const answer = await askCodeAssistant(
        `Analyse ce code et propose 3 à 5 optimisations (performance, lisibilité, bonnes pratiques).\nFormat:\n- Titre: ...\n  Avant: ...\n  Après: ...\n\nCode:\n${code}`
      );
      setAssistantPanelContent(answer);
      const suggestions = answer
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "));
      setAssistantOptimizations(suggestions);
    } catch (error) {
      setAssistantPanelContent(`Erreur assistant: ${error instanceof Error ? error.message : "inconnue"}`);
      setAssistantOptimizations([]);
    } finally {
      setIsAssistantLoading(false);
    }
  };

  const buildAutocomplete = (
    forceOpen = false,
    sourceText?: string,
    caretPosition?: number
  ) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;
    const currentCode = sourceText ?? code;
    const caret = caretPosition ?? textarea.selectionStart;
    const before = currentCode.slice(0, caret);
    const dotMatch = before.match(/([a-zA-Z_$][\w$]*)\.([\w$]*)$/);
    const tokenMatch = before.match(/([a-zA-Z_$][\w$]*)$/);
    const rawToken = tokenMatch?.[1] ?? "";
    const minCharsReached = rawToken.length >= 2;
    if (!forceOpen && !dotMatch && !minCharsReached) {
      setAutocompleteOpen(false);
      return;
    }
    const symbols = extractDeclaredSymbols(currentCode, runtime);
    const suggestions: AutoSuggestion[] = [];
    if (runtime === "python") {
      for (const moduleName of Object.keys(pythonModuleMembers)) {
        suggestions.push({ detail: "module", insertText: moduleName, kind: "module", label: moduleName, score: 1 });
      }
      for (const fnName of symbols.functions) {
        suggestions.push({ detail: "fn(...) -> Any", insertText: fnName, kind: "function", label: fnName, score: 2 });
      }
      for (const variableName of symbols.variables) {
        suggestions.push({ detail: "variable", insertText: variableName, kind: "variable", label: variableName, score: 2 });
      }
      for (const keyword of pythonKeywords) {
        suggestions.push({ detail: "keyword", insertText: keyword, kind: "keyword", label: keyword, score: 0 });
      }
      const imports = Array.from(before.matchAll(/^\s*import\s+([a-zA-Z_]\w*)/gm)).map((item) => item[1]).filter(Boolean) as string[];
      for (const imported of imports) {
        for (const item of pythonModuleMembers[imported] ?? []) {
          suggestions.push({ detail: item.detail, insertText: item.label, kind: "function", label: item.label, score: 3 });
        }
      }
    }
    if (runtime === "javascript" || runtime === "typescript") {
      for (const [objectName, members] of Object.entries(jsTsMembers)) {
        suggestions.push({ detail: "class", insertText: objectName, kind: "class", label: objectName, score: 1 });
        for (const member of members) {
          suggestions.push({ detail: member.detail, insertText: member.label, kind: "function", label: member.label, score: 2 });
        }
      }
      for (const fnName of symbols.functions) {
        suggestions.push({ detail: "fn(...): any", insertText: fnName, kind: "function", label: fnName, score: 3 });
      }
      for (const variableName of symbols.variables) {
        suggestions.push({ detail: "variable", insertText: variableName, kind: "variable", label: variableName, score: 3 });
      }
      for (const keyword of jsTsKeywords) {
        suggestions.push({ detail: "keyword", insertText: keyword, kind: "keyword", label: keyword, score: 0 });
      }
    }
    const query = dotMatch ? (dotMatch[2] ?? "") : rawToken;
    const dotTarget = dotMatch?.[1] ?? "";
    const filtered = suggestions
      .filter((item) => {
        if (dotMatch) {
          const byObject = jsTsMembers[dotTarget]?.some((entry) => entry.label === item.label)
            || pythonModuleMembers[dotTarget]?.some((entry) => entry.label === item.label);
          if (!byObject) return false;
        }
        return forceOpen || !query ? true : item.label.toLowerCase().includes(query.toLowerCase());
      })
      .sort((a, b) => {
        const aStarts = query && a.label.toLowerCase().startsWith(query.toLowerCase()) ? 3 : 0;
        const bStarts = query && b.label.toLowerCase().startsWith(query.toLowerCase()) ? 3 : 0;
        return b.score + bStarts - (a.score + aStarts);
      })
      .slice(0, 8);
    if (!filtered.length) {
      setAutocompleteOpen(false);
      return;
    }
    const lastLine = before.split("\n").at(-1) ?? "";
    setAutocompleteAnchor({ left: 8 + lastLine.length * 7, top: 10 + (before.split("\n").length - 1) * 20 });
    setAutocompleteItems(filtered);
    setSelectedSuggestionIndex(0);
    setAutocompleteTarget({
      start: dotMatch ? caret - (dotMatch[2]?.length ?? 0) : caret - rawToken.length,
      end: caret,
    });
    setAutocompleteOpen(true);
  };

  const applySuggestion = (suggestion: AutoSuggestion) => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return;
    const nextCode = `${code.slice(0, autocompleteTarget.start)}${suggestion.insertText}${code.slice(autocompleteTarget.end)}`;
    const nextCaret = autocompleteTarget.start + suggestion.insertText.length;
    setCode(nextCode);
    setAutocompleteOpen(false);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = nextCaret;
      textarea.selectionEnd = nextCaret;
    }, 0);
  };

  const tryExpandSnippet = () => {
    const textarea = editorTextareaRef.current;
    if (!textarea) return false;
    const templates = snippetTemplates[runtime];
    if (!templates) return false;
    const caret = textarea.selectionStart;
    const before = code.slice(0, caret);
    const trigger = before.match(/([a-zA-Z_]\w*)$/)?.[1];
    if (!trigger || !templates[trigger]) return false;
    const parsed = parseSnippetTemplate(templates[trigger]);
    const start = caret - trigger.length;
    const nextCode = `${code.slice(0, start)}${parsed.text}${code.slice(caret)}`;
    const adjusted = parsed.placeholders.map((item) => ({ start: start + item.start, end: start + item.end }));
    setCode(nextCode);
    if (!adjusted.length) return true;
    setSnippetSession({ index: 0, placeholders: adjusted });
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = adjusted[0]?.start ?? start;
      textarea.selectionEnd = adjusted[0]?.end ?? start;
    }, 0);
    return true;
  };

  const moveSnippetPlaceholder = () => {
    const textarea = editorTextareaRef.current;
    if (!textarea || !snippetSession) return false;
    const nextIndex = snippetSession.index + 1;
    if (nextIndex >= snippetSession.placeholders.length) {
      setSnippetSession(null);
      return false;
    }
    const next = snippetSession.placeholders[nextIndex];
    setSnippetSession({ ...snippetSession, index: nextIndex });
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = next.start;
      textarea.selectionEnd = next.end;
    }, 0);
    return true;
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
            <span className="relative ml-2 inline-block">
              <button className="rounded-lg border border-border/50 bg-background px-2 py-1" onClick={() => setShowThemeLibrary((current) => !current)} type="button">
                {activeTheme.label}
              </button>
              {showThemeLibrary && (
                <div className="absolute right-0 z-30 mt-1 grid w-[520px] grid-cols-[1fr_220px] gap-2 rounded-lg border border-border/60 bg-background p-2 shadow-xl">
                  <div className="max-h-72 overflow-auto pr-1">
                    {allThemes.map((theme) => (
                      <button
                        className={`mb-1 flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs ${editorTheme === theme.id ? "bg-primary/15 text-primary" : "hover:bg-muted/40"}`}
                        key={theme.id}
                        onClick={() => {
                          setEditorTheme(theme.id);
                          setShowThemeLibrary(false);
                        }}
                        onMouseEnter={() => setHoveredThemeId(theme.id)}
                        type="button"
                      >
                        <span>{theme.label}</span>
                        <span className="text-[10px] text-muted-foreground">{theme.mode}</span>
                      </button>
                    ))}
                    <button className="mt-1 w-full rounded border border-dashed px-2 py-1 text-xs" onClick={() => {
                      setShowCustomThemeEditor(true);
                      setShowThemeLibrary(false);
                    }} type="button">
                      + Créer mon thème
                    </button>
                  </div>
                  {(() => {
                    const previewTheme = allThemes.find((theme) => theme.id === hoveredThemeId) ?? activeTheme;
                    return (
                      <div className="rounded border border-border/50 p-2 text-[10px]" style={{ background: previewTheme.colors.editorBg, color: previewTheme.colors.text }}>
                        <div className="mb-1 text-[10px] font-semibold">{previewTheme.label}</div>
                        <pre className="space-y-0.5 font-mono">
                          <div><span style={{ color: previewTheme.colors.keyword }}>def</span> <span style={{ color: previewTheme.colors.function }}>build_chart</span>():</div>
                          <div>  <span style={{ color: previewTheme.colors.comment }}># Aperçu thème</span></div>
                          <div>  data = <span style={{ color: previewTheme.colors.string }}>"sales.csv"</span></div>
                          <div>  return <span style={{ color: previewTheme.colors.number }}>42</span></div>
                        </pre>
                      </div>
                    );
                  })()}
                </div>
              )}
            </span>
            <button className="ml-1 inline-flex items-center rounded border px-1.5 py-1" onClick={() => setShowEditorPreferences((current) => !current)} type="button">
              <Cog className="size-3.5" />
            </button>
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
      {showCustomThemeEditor && (
        <section className="rounded-xl border border-border/60 bg-background/70 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Créer mon thème</h3>
            <button className="rounded border px-2 py-1 text-xs" onClick={() => setShowCustomThemeEditor(false)} type="button">Fermer</button>
          </div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            <label className="text-xs">Nom du thème<input className="mt-1 h-8 w-full rounded border px-2" onChange={(event) => setCustomThemeName(event.target.value)} value={customThemeName} /></label>
            {([
              ["editorBg", "Fond éditeur"],
              ["gutterBg", "Fond gouttière"],
              ["text", "Texte principal"],
              ["keyword", "Mots-clés"],
              ["string", "Chaînes"],
              ["comment", "Commentaires"],
              ["function", "Fonctions"],
              ["number", "Nombres"],
              ["cursor", "Curseur"],
            ] as const).map(([key, label]) => (
              <label className="text-xs" key={key}>
                {label}
                <input
                  className="mt-1 h-8 w-full rounded border"
                  onChange={(event) => setCustomThemeDraft((current) => ({ ...current, [key]: event.target.value }))}
                  type="color"
                  value={customThemeDraft[key]}
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
              onClick={() => {
                const id = `custom-${customThemeName.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
                const newTheme: EditorThemeConfig = {
                  id,
                  label: customThemeName.trim() || "Thème personnalisé",
                  mode: "dark",
                  colors: customThemeDraft,
                };
                setCustomThemes((current) => [newTheme, ...current].slice(0, 20));
                setEditorTheme(id);
                setShowCustomThemeEditor(false);
              }}
              type="button"
            >
              Sauvegarder le thème
            </button>
          </div>
        </section>
      )}
      {showEditorPreferences && (
        <section className="rounded-xl border border-border/60 bg-background/70 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Préférences de l’éditeur</h3>
            <button className="rounded border px-2 py-1 text-xs" onClick={() => setShowEditorPreferences(false)} type="button">Fermer</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 rounded border border-border/40 p-2">
              <p className="text-xs font-semibold">Typographie</p>
              <label className="text-xs">Police
                <select className="mt-1 h-8 w-full rounded border px-2" onChange={(event) => setEditorPreferences((current) => ({ ...current, fontFamily: event.target.value }))} value={editorPreferences.fontFamily}>
                  {["Fira Code", "JetBrains Mono", "Source Code Pro", "Cascadia Code", "Menlo", "Monaco"].map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs">Taille police: {editorPreferences.fontSize}px
                <input className="mt-1 w-full" max={24} min={10} onChange={(event) => setEditorPreferences((current) => ({ ...current, fontSize: Number(event.target.value) }))} type="range" value={editorPreferences.fontSize} />
              </label>
              <label className="flex items-center gap-2 text-xs"><input checked={editorPreferences.fontLigatures} onChange={(event) => setEditorPreferences((current) => ({ ...current, fontLigatures: event.target.checked }))} type="checkbox" /> Ligatures typographiques</label>
            </div>
            <div className="space-y-2 rounded border border-border/40 p-2">
              <p className="text-xs font-semibold">Édition</p>
              <label className="text-xs">Indentation ({editorPreferences.indentSize})
                <input className="mt-1 w-full" max={8} min={2} onChange={(event) => setEditorPreferences((current) => ({ ...current, indentSize: Number(event.target.value) }))} type="range" value={editorPreferences.indentSize} />
              </label>
              <label className="text-xs">Mode indentation
                <select className="mt-1 h-8 w-full rounded border px-2" onChange={(event) => setEditorPreferences((current) => ({ ...current, tabMode: event.target.value as "spaces" | "tabs" }))} value={editorPreferences.tabMode}>
                  <option value="spaces">Espaces</option>
                  <option value="tabs">Tabulations</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs"><input checked={editorPreferences.showInvisibleChars} onChange={(event) => setEditorPreferences((current) => ({ ...current, showInvisibleChars: event.target.checked }))} type="checkbox" /> Afficher caractères invisibles</label>
              <label className="flex items-center gap-2 text-xs"><input checked={editorPreferences.wordWrap} onChange={(event) => setEditorPreferences((current) => ({ ...current, wordWrap: event.target.checked }))} type="checkbox" /> Retour à la ligne automatique</label>
              <label className="flex items-center gap-2 text-xs"><input checked={editorPreferences.minimapEnabled} onChange={(event) => setEditorPreferences((current) => ({ ...current, minimapEnabled: event.target.checked }))} type="checkbox" /> Mini-map</label>
            </div>
            <div className="space-y-2 rounded border border-border/40 p-2 md:col-span-2">
              <p className="text-xs font-semibold">Comportement</p>
              <div className="grid gap-2 md:grid-cols-2">
                <label className="flex items-center gap-2 text-xs"><input checked={editorPreferences.autoSaveSnippetOnRun} onChange={(event) => setEditorPreferences((current) => ({ ...current, autoSaveSnippetOnRun: event.target.checked }))} type="checkbox" /> Sauvegarde auto des snippets au run</label>
                <label className="flex items-center gap-2 text-xs"><input checked={editorPreferences.autoClearOutputBeforeRun} onChange={(event) => setEditorPreferences((current) => ({ ...current, autoClearOutputBeforeRun: event.target.checked }))} type="checkbox" /> Effacer sortie avant exécution</label>
                <label className="flex items-center gap-2 text-xs"><input checked={editorPreferences.confirmBeforeResetOutput} onChange={(event) => setEditorPreferences((current) => ({ ...current, confirmBeforeResetOutput: event.target.checked }))} type="checkbox" /> Confirmer avant reset sortie</label>
                <label className="text-xs">Position panneau sortie
                  <select className="mt-1 h-8 w-full rounded border px-2" onChange={(event) => setEditorPreferences((current) => ({ ...current, outputPanelPosition: event.target.value as "bottom" | "right" }))} value={editorPreferences.outputPanelPosition}>
                    <option value="right">Droite</option>
                    <option value="bottom">Bas</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className={`grid gap-4 ${editorPreferences.outputPanelPosition === "right" ? "lg:grid-cols-[1.3fr_1fr]" : "grid-cols-1"}`}>
        <section className={`liquid-panel rounded-2xl p-4 ${editorPreferences.outputPanelPosition === "right" ? "lg:order-1" : "order-1"}`}>
          <div className="mb-3 space-y-2 rounded-xl border border-border/50 bg-background/50 p-2">
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1 rounded-md border border-primary/50 bg-primary/10 px-2 py-1 text-xs text-primary"
                onClick={() => {
                  setCommandBarOpen((current) => !current);
                  setTimeout(() => commandInputRef.current?.focus(), 0);
                }}
                type="button"
              >
                <WandSparkles className="size-3.5" /> Générer du code
              </button>
              <p className="text-[11px] text-muted-foreground">Ctrl+K</p>
              <div className="ml-auto relative">
                <button className="rounded-md border px-2 py-1 text-xs" onClick={() => setShowGenerationHistory((current) => !current)} type="button">
                  <Clock3 className="size-3.5" />
                </button>
                {showGenerationHistory && (
                  <div className="absolute right-0 z-20 mt-1 max-h-52 w-80 overflow-auto rounded-md border border-border/60 bg-background p-1 shadow-xl">
                    {generationHistory.length === 0 ? (
                      <p className="px-2 py-1 text-[11px] text-muted-foreground">Aucun historique.</p>
                    ) : (
                      generationHistory.map((entry, index) => (
                        <button
                          className="block w-full rounded px-2 py-1 text-left text-[11px] hover:bg-muted/40"
                          key={`${entry.createdAt}-${index}`}
                          onClick={() => {
                            setGenerationPrompt(entry.prompt);
                            setRuntime(entry.runtime);
                            setCommandBarOpen(true);
                            setShowGenerationHistory(false);
                            setTimeout(() => commandInputRef.current?.focus(), 0);
                          }}
                          type="button"
                        >
                          <p className="truncate">{entry.prompt}</p>
                          <p className="text-[10px] text-muted-foreground">{runtimeLabels[entry.runtime]} · {new Date(entry.createdAt).toLocaleTimeString("fr-FR")}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            {commandBarOpen && (
              <div className="space-y-2">
                <input
                  className="h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-xs"
                  onChange={(event) => setGenerationPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void generateCodeFromCommand();
                    }
                  }}
                  placeholder="Ex: créer un graphique en barres montrant les ventes par mois..."
                  ref={commandInputRef}
                  value={generationPrompt}
                />
                <div className="flex gap-2">
                  <button className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50" disabled={isGeneratingFromPrompt || !generationPrompt.trim()} onClick={() => void generateCodeFromCommand()} type="button">
                    {isGeneratingFromPrompt ? "Génération..." : "Insérer avec IA"}
                  </button>
                  <button className="rounded-md border px-2 py-1 text-xs" onClick={() => setCommandBarOpen(false)} type="button">Fermer</button>
                </div>
              </div>
            )}
            {pendingGeneration && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-2">
                <p className="text-[11px] font-semibold text-emerald-700">Code généré en surbrillance — valider l’insertion ?</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <button className="rounded-md bg-emerald-600 px-2 py-1 text-xs text-white" onClick={() => setPendingGeneration(null)} type="button">Accepter</button>
                  <button className="rounded-md border border-red-400 px-2 py-1 text-xs text-red-600" onClick={() => {
                    setCode(pendingGeneration.previousCode);
                    setPendingGeneration(null);
                  }} type="button">Rejeter</button>
                  <input
                    className="h-7 flex-1 rounded border border-border/60 px-2 text-xs"
                    onChange={(event) => setGenerationRefinement(event.target.value)}
                    placeholder="Affiner la demande (optionnel)"
                    value={generationRefinement}
                  />
                  <button className="rounded-md border px-2 py-1 text-xs" onClick={() => void generateCodeFromCommand(`${pendingGeneration.prompt}. Affinage: ${generationRefinement || "améliore la version précédente"}`)} type="button">
                    Affiner
                  </button>
                </div>
              </div>
            )}
          </div>
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
              <button className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 py-1 text-[11px]" onClick={() => setEditorPreferences((current) => ({ ...current, minimapEnabled: !current.minimapEnabled }))} type="button">
                <FileCode2 className="size-3.5" /> Mini-map {editorPreferences.minimapEnabled ? "ON" : "OFF"}
              </button>
            </div>
            <div className={`grid min-h-[360px] ${editorPreferences.minimapEnabled ? "grid-cols-[1fr_120px]" : "grid-cols-1"}`}>
              <div className="relative grid grid-cols-[52px_1fr]" style={{ background: activeTheme.colors.editorBg, color: activeTheme.colors.text, fontFamily: editorPreferences.fontFamily, fontSize: `${editorPreferences.fontSize}px`, fontVariantLigatures: editorPreferences.fontLigatures ? "normal" : "none" }}>
                <div className="border-r border-border/30 px-1 py-2 text-right text-[11px]" style={{ background: activeTheme.colors.gutterBg }}>
                  {visibleLines.map((line) => {
                    const fold = foldRanges.find((item) => item.start === line.lineNumber);
                    const isFolded = foldedSet.has(line.lineNumber);
                    const hiddenCount = fold ? fold.end - fold.start : 0;
                    return (
                      <div className={`group flex h-5 items-center justify-end gap-1 rounded px-1 ${
                        generatedLineRange && line.lineNumber >= generatedLineRange.start && line.lineNumber <= generatedLineRange.end
                          ? "bg-emerald-500/20 text-emerald-600"
                          : errorLine === line.lineNumber
                          ? "bg-red-500/20 text-red-500"
                          : activeLineNumber === line.lineNumber
                            ? "bg-primary/15 text-primary"
                            : ""
                      }`} key={line.lineNumber}>
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
                  className="min-h-[360px] w-full resize-none bg-transparent px-3 py-2 outline-none"
                  style={{ caretColor: activeTheme.colors.cursor, color: activeTheme.colors.text }}
                  wrap={editorPreferences.wordWrap ? "soft" : "off"}
                  ref={editorTextareaRef}
                  onChange={(event) => {
                    setCode(event.target.value);
                    if (!event.target.value) {
                      setAutocompleteOpen(false);
                    }
                  }}
                  onClick={(event) => {
                    const target = event.target as HTMLTextAreaElement;
                    const before = target.value.slice(0, target.selectionStart);
                    const line = before.split("\n").length;
                    const column = before.split("\n").at(-1)?.length ?? 0;
                    setActiveLineNumber(line);
                    setCursorPosition({ line, column: column + 1 });
                    setCursorOffset(target.selectionStart);
                    buildAutocomplete(false, target.value, target.selectionStart);
                  }}
                  onKeyDown={(event) => {
                    if (event.ctrlKey && event.code === "Space") {
                      event.preventDefault();
                      buildAutocomplete(true);
                      return;
                    }
                    if (autocompleteOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
                      event.preventDefault();
                      setSelectedSuggestionIndex((current) => {
                        if (event.key === "ArrowDown") {
                          return (current + 1) % autocompleteItems.length;
                        }
                        return (current - 1 + autocompleteItems.length) % autocompleteItems.length;
                      });
                      return;
                    }
                    if (event.key === "Escape") {
                      setAutocompleteOpen(false);
                      return;
                    }
                    if (event.key === "Enter" || event.key === "Tab") {
                      if (autocompleteOpen) {
                        event.preventDefault();
                        const selected = autocompleteItems[selectedSuggestionIndex];
                        if (selected) applySuggestion(selected);
                        return;
                      }
                      if (event.key === "Tab" && moveSnippetPlaceholder()) {
                        event.preventDefault();
                        return;
                      }
                      if (event.key === "Tab" && tryExpandSnippet()) {
                        event.preventDefault();
                        return;
                      }
                      if (event.key === "Tab") {
                        event.preventDefault();
                        const target = event.currentTarget;
                        const start = target.selectionStart;
                        const end = target.selectionEnd;
                        const indentation = editorPreferences.tabMode === "tabs" ? "\t" : " ".repeat(editorPreferences.indentSize);
                        const nextValue = `${target.value.slice(0, start)}${indentation}${target.value.slice(end)}`;
                        setCode(nextValue);
                        const nextCursor = start + indentation.length;
                        setTimeout(() => {
                          target.selectionStart = nextCursor;
                          target.selectionEnd = nextCursor;
                          setCursorOffset(nextCursor);
                        }, 0);
                      }
                    }
                  }}
                  onKeyUp={(event) => {
                    const target = event.currentTarget;
                    const before = target.value.slice(0, target.selectionStart);
                    const line = before.split("\n").length;
                    const column = before.split("\n").at(-1)?.length ?? 0;
                    setActiveLineNumber(line);
                    setCursorPosition({ line, column: column + 1 });
                    setCursorOffset(target.selectionStart);
                    if (!["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(event.key)) {
                      buildAutocomplete(false, target.value, target.selectionStart);
                    }
                  }}
                  onSelect={(event) => {
                    const target = event.currentTarget;
                    const start = target.selectionStart;
                    const end = target.selectionEnd;
                    setCursorOffset(start);
                    if (end > start) {
                      setSelectedCode(target.value.slice(start, end));
                      setShowExplainBubble(true);
                    } else {
                      setShowExplainBubble(false);
                    }
                  }}
                  value={code}
                />
                {showExplainBubble && selectedCode.trim() && (
                  <button
                    className="absolute right-3 top-3 z-20 rounded-full bg-primary px-3 py-1 text-[11px] font-medium text-primary-foreground shadow-lg"
                    onClick={explainSelection}
                    type="button"
                  >
                    ✨ Expliquer ce code
                  </button>
                )}
                {autocompleteOpen && (
                  <div
                    className="absolute z-20 max-h-64 w-96 overflow-auto rounded-md border border-border/60 bg-background/95 p-1 text-xs shadow-xl"
                    style={{ left: Math.min(autocompleteAnchor.left, 440), top: Math.min(autocompleteAnchor.top + 26, 300) }}
                  >
                    {autocompleteItems.map((item, index) => {
                      const Icon = suggestionIconByKind[item.kind];
                      return (
                        <button
                          className={`flex w-full items-center justify-between rounded px-2 py-1 text-left ${selectedSuggestionIndex === index ? "bg-primary/15 text-primary" : "hover:bg-muted/50"}`}
                          key={`${item.kind}-${item.label}-${index}`}
                          onClick={() => applySuggestion(item)}
                          type="button"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Icon className="size-3.5" />
                            <span>{item.label}</span>
                          </span>
                          <span className="text-[10px] text-muted-foreground">{item.detail}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {editorPreferences.minimapEnabled && (
                <div className="border-l border-border/40 bg-muted/20 p-2">
                  <div className="max-h-[360px] overflow-auto rounded bg-background/60 p-1 font-mono text-[8px] leading-3">
                    {lineList.map((line, index) => (
                      <button className={`block w-full truncate text-left ${activeLineNumber === index + 1 ? "bg-primary/15 text-primary" : "text-muted-foreground"}`} key={`${index + 1}-${line}`} onClick={() => onLineNumberClick(index + 1)} type="button">
                        {(editorPreferences.showInvisibleChars ? line.replace(/\t/g, "→\t").replace(/ /g, "·") : line) || "·"}
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
              className="inline-flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-3 py-2 text-sm text-primary"
              onClick={() => setAssistantPanelOpen((current) => !current)}
              type="button"
            >
              <Sparkles className="size-4 animate-pulse" />
              Assistant IA
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-4 py-2 text-sm"
              onClick={() => {
                if (editorPreferences.confirmBeforeResetOutput) {
                  const confirmed = window.confirm("Confirmer la réinitialisation de la sortie ?");
                  if (!confirmed) return;
                }
                setFiles([]);
                setResult(null);
              }}
              type="button"
            >
              Réinitialiser sortie
            </button>
          </div>
        </section>

        <section className={`liquid-panel rounded-2xl p-4 ${editorPreferences.outputPanelPosition === "right" ? "lg:order-2" : "order-2"}`}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium">Panneau de sortie</h2>
            <div className="flex gap-1">
              <button className={`rounded px-2 py-1 text-xs ${outputTab === "output" ? "bg-primary text-primary-foreground" : "border border-border/40"}`} onClick={() => setOutputTab("output")} type="button">Output</button>
              <button className={`rounded px-2 py-1 text-xs ${outputTab === "data" ? "bg-primary text-primary-foreground" : "border border-border/40"}`} onClick={() => setOutputTab("data")} type="button">Data Explorer</button>
            </div>
          </div>
          {outputTab === "output" ? (
            <>
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
            </>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="grid gap-2 rounded-lg border border-border/50 bg-background/40 p-2 md:grid-cols-2">
                <p>Lignes: <strong>{dataRows.length}</strong></p>
                <p>Colonnes: <strong>{dataColumns.length}</strong></p>
                <p>Types: {dataColumns.map((column) => `${column}:${dataTypes[column] ?? "?"}`).join(" • ") || "N/A"}</p>
                <p>Valeurs manquantes: {dataColumns.map((column) => {
                  const missing = dataRows.filter((row) => row[column] === null || row[column] === "").length;
                  return <span className={missing > 0 ? "text-amber-600" : "text-emerald-600"} key={column}>{column}={missing} </span>;
                })}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input className="h-8 flex-1 rounded border border-border/50 px-2 text-xs" onChange={(event) => {
                  setGlobalDataSearch(event.target.value);
                  setDataPage(1);
                }} placeholder="Recherche globale..." value={globalDataSearch} />
                <button className="rounded border px-2 py-1 text-xs" onClick={() => setQuickPreviewMode((current) => !current)} type="button">
                  {quickPreviewMode ? "Aperçu rapide ON" : "Aperçu rapide OFF"}
                </button>
                <button className="rounded border px-2 py-1 text-xs" onClick={() => {
                  const profiles = dataColumns
                    .map((column) => {
                      const numeric = dataRows.map((row) => Number(row[column])).filter((value) => Number.isFinite(value));
                      if (!numeric.length) return null;
                      const stats = computeStats(numeric);
                      return { column, count: numeric.length, ...stats };
                    })
                    .filter(Boolean) as Array<{ column: string; count: number; max: number; mean: number; median: number; min: number; q1: number; q3: number; stddev: number }>;
                  setDataProfile(profiles);
                }} type="button">Profiler les données</button>
              </div>
              <div className="overflow-auto rounded-lg border border-border/50">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-muted/40">
                    <tr>
                      {dataColumns.map((column) => (
                        <th className="whitespace-nowrap border-b px-2 py-1" key={column}>
                          <div className="flex items-center gap-1">
                            <button className="inline-flex items-center gap-1" onClick={() => setDataSort((current) => current?.column === column ? { column, direction: current.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" })} type="button">
                              {column}
                              {dataSort?.column === column ? dataSort.direction === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowUpDown className="size-3" />}
                            </button>
                            <button onClick={() => setActiveFilterColumn((current) => current === column ? null : column)} type="button"><Funnel className="size-3" /></button>
                          </div>
                          {activeFilterColumn === column && (
                            <div className="mt-1 space-y-1 rounded border bg-background p-1">
                              <select className="h-6 w-full rounded border px-1" onChange={(event) => setColumnFilters((current) => ({ ...current, [column]: { ...(current[column] ?? { mode: "contains" }), mode: event.target.value as ColumnFilter["mode"] } }))} value={columnFilters[column]?.mode ?? "contains"}>
                                <option value="contains">Texte contient</option>
                                <option value="exact">Valeur exacte</option>
                                <option value="range">Plage numérique</option>
                              </select>
                              {columnFilters[column]?.mode === "range" ? (
                                <div className="flex gap-1">
                                  <input className="h-6 w-full rounded border px-1" onChange={(event) => setColumnFilters((current) => ({ ...current, [column]: { ...(current[column] ?? { mode: "range" }), min: Number(event.target.value) } }))} placeholder="min" type="number" />
                                  <input className="h-6 w-full rounded border px-1" onChange={(event) => setColumnFilters((current) => ({ ...current, [column]: { ...(current[column] ?? { mode: "range" }), max: Number(event.target.value) } }))} placeholder="max" type="number" />
                                </div>
                              ) : (
                                <input className="h-6 w-full rounded border px-1" onChange={(event) => setColumnFilters((current) => ({ ...current, [column]: { ...(current[column] ?? { mode: "contains" }), value: event.target.value } }))} placeholder="Filtrer..." />
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, index) => (
                      <tr className="border-b" key={`row-${index}`}>
                        {dataColumns.map((column) => (
                          <td className="px-2 py-1" key={`${index}-${column}`}>{String(row[column] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                    {quickPreviewMode && sortedDataRows.length > 20 && (
                      <tr><td className="px-2 py-1 text-center text-muted-foreground" colSpan={Math.max(1, dataColumns.length)}>... {Math.max(0, sortedDataRows.length - 20)} lignes masquées ...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-[11px]">Lignes/page
                  <select className="ml-1 rounded border px-1" onChange={(event) => {
                    setDataPageSize(Number(event.target.value) as 25 | 50 | 100);
                    setDataPage(1);
                  }} value={dataPageSize}>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
                <button className="rounded border px-2 py-1 text-[11px]" disabled={dataPage <= 1} onClick={() => setDataPage((current) => Math.max(1, current - 1))} type="button">Préc.</button>
                <span className="text-[11px]">Page {dataPage}/{totalPages}</span>
                <button className="rounded border px-2 py-1 text-[11px]" disabled={dataPage >= totalPages} onClick={() => setDataPage((current) => Math.min(totalPages, current + 1))} type="button">Suiv.</button>
              </div>
              {dataProfile.length > 0 && (
                <div className="grid gap-2 md:grid-cols-2">
                  {dataProfile.map((item) => (
                    <div className="rounded border border-border/50 p-2" key={item.column}>
                      <p className="font-semibold">{item.column}</p>
                      <p>Moyenne: {item.mean.toFixed(2)} | Médiane: {item.median.toFixed(2)} | Écart-type: {item.stddev.toFixed(2)}</p>
                      <p>Min: {item.min.toFixed(2)} | Q1: {item.q1.toFixed(2)} | Q3: {item.q3.toFixed(2)} | Max: {item.max.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
      {assistantPanelOpen && (
        <aside className="fixed right-4 top-20 z-30 h-[78vh] w-[420px] overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Assistant IA Code</p>
              <p className="text-[11px] text-muted-foreground">Modèle actif: {selectedModelId}</p>
            </div>
            <button className="rounded border px-2 py-1 text-xs" onClick={() => setAssistantPanelOpen(false)} type="button">Fermer</button>
          </div>
          <div className="flex gap-1 border-b border-border/40 p-2">
            {([
              ["explain", "Expliquer"],
              ["fix", "Corriger"],
              ["optimize", "Optimiser"],
            ] as const).map(([mode, label]) => (
              <button
                className={`flex-1 rounded-md px-2 py-1 text-xs ${assistantMode === mode ? "bg-primary text-primary-foreground" : "border border-border/40"}`}
                key={mode}
                onClick={() => setAssistantMode(mode)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="h-[calc(78vh-104px)] space-y-3 overflow-auto p-3 text-xs">
            {assistantMode === "explain" && (
              <div className="space-y-2">
                <p className="text-muted-foreground">Sélectionnez un bloc puis cliquez sur « Expliquer ce code » dans l’éditeur.</p>
                {selectedCode ? <pre className="max-h-40 overflow-auto rounded border border-border/40 bg-muted/20 p-2">{selectedCode}</pre> : null}
                <button className="rounded-md bg-primary px-2 py-1 text-primary-foreground disabled:opacity-50" disabled={!selectedCode.trim() || isAssistantLoading} onClick={explainSelection} type="button">
                  {isAssistantLoading ? "Analyse..." : "Expliquer ce code"}
                </button>
                {assistantPanelContent ? <pre className="whitespace-pre-wrap rounded border border-border/40 bg-background p-2">{assistantPanelContent}</pre> : null}
              </div>
            )}
            {assistantMode === "fix" && (
              <div className="space-y-2">
                <p className="text-muted-foreground">Ce mode se déclenche automatiquement après une erreur d’exécution.</p>
                {assistantPanelContent ? <pre className="whitespace-pre-wrap rounded border border-red-500/30 bg-red-500/5 p-2">{assistantPanelContent}</pre> : <p>Aucun diagnostic pour l’instant.</p>}
                {assistantDiffPreview ? (
                  <pre className="max-h-52 overflow-auto rounded border border-border/40 bg-background p-2">
                    {assistantDiffPreview.split("\n").map((line, index) => (
                      <div className={line.startsWith("+") ? "text-emerald-600" : line.startsWith("-") ? "text-red-600" : ""} key={`${line}-${index}`}>{line}</div>
                    ))}
                  </pre>
                ) : null}
                <button
                  className="rounded-md bg-emerald-600 px-2 py-1 text-white disabled:opacity-50"
                  disabled={!assistantProposedCode}
                  onClick={() => {
                    if (!assistantProposedCode) return;
                    setCode(assistantProposedCode);
                    setAssistantDiffPreview("");
                  }}
                  type="button"
                >
                  Appliquer la correction
                </button>
              </div>
            )}
            {assistantMode === "optimize" && (
              <div className="space-y-2">
                <button className="rounded-md bg-primary px-2 py-1 text-primary-foreground disabled:opacity-50" disabled={isAssistantLoading} onClick={analyzeOptimizations} type="button">
                  {isAssistantLoading ? "Analyse..." : "Analyser et optimiser"}
                </button>
                {assistantOptimizations.length > 0 ? (
                  <div className="space-y-1">
                    {assistantOptimizations.map((suggestion, index) => (
                      <button className="block w-full rounded border border-border/40 p-2 text-left hover:bg-muted/30" key={`${suggestion}-${index}`} type="button">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
                {assistantPanelContent ? <pre className="whitespace-pre-wrap rounded border border-border/40 bg-background p-2">{assistantPanelContent}</pre> : null}
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
