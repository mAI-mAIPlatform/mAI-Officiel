import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, normalize } from "node:path";
import { NextResponse } from "next/server";

const EXEC_TIMEOUT_MS = 8000;
const MAX_CODE_LENGTH = 60_000;
const MAX_FILES = 5;
const MAX_FILE_BYTES = 1_000_000;

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

type RuntimeFile = {
  contentBase64: string;
  name: string;
};

type RuntimeConfig = {
  args: string[];
  command: string;
  entryFile: string;
};

const runtimeConfigs: Record<Runtime, RuntimeConfig> = {
  python: {
    command: "python3",
    args: ["-I", "main.py"],
    entryFile: "main.py",
  },
  javascript: {
    command: "node",
    args: ["main.mjs"],
    entryFile: "main.mjs",
  },
  typescript: {
    command: "node",
    args: ["main.mts"],
    entryFile: "main.mts",
  },
  bash: {
    command: "bash",
    args: ["main.sh"],
    entryFile: "main.sh",
  },
  html: {
    command: "bash",
    args: [
      "-lc",
      "echo 'HTML preview (first 80 lines):'; sed -n '1,80p' main.html",
    ],
    entryFile: "main.html",
  },
  c: {
    command: "bash",
    args: ["-lc", "gcc main.c -O2 -std=c11 -o main && ./main"],
    entryFile: "main.c",
  },
  cpp: {
    command: "bash",
    args: ["-lc", "g++ main.cpp -O2 -std=c++17 -o main && ./main"],
    entryFile: "main.cpp",
  },
  go: {
    command: "go",
    args: ["run", "main.go"],
    entryFile: "main.go",
  },
  ruby: {
    command: "ruby",
    args: ["main.rb"],
    entryFile: "main.rb",
  },
  php: {
    command: "php",
    args: ["main.php"],
    entryFile: "main.php",
  },
  sql: {
    command: "python3",
    args: [
      "-c",
      "import sqlite3, pathlib; con=sqlite3.connect(':memory:'); cur=con.cursor(); sql=pathlib.Path('main.sql').read_text(encoding='utf-8'); stmts=[s.strip() for s in sql.split(';') if s.strip()]; last=[]; [cur.execute(stmt) or (last:=cur.fetchall() if cur.description else last) for stmt in stmts]; [print('\\t'.join(map(str,row))) for row in last]",
    ],
    entryFile: "main.sql",
  },
  json: {
    command: "python3",
    args: [
      "-c",
      "import json; data=json.load(open('main.json', encoding='utf-8')); print(json.dumps(data, indent=2, ensure_ascii=False))",
    ],
    entryFile: "main.json",
  },
  markdown: {
    command: "bash",
    args: [
      "-lc",
      "echo 'Markdown preview (first 120 lines):'; sed -n '1,120p' main.md",
    ],
    entryFile: "main.md",
  },
};

function sanitizeFileName(input: string): string {
  const normalized = normalize(input).replace(/^([/\\])+/, "");
  const safe = normalized.replace(/\.\./g, "").trim();
  return safe.length > 0 ? safe : `file-${randomUUID().slice(0, 8)}.txt`;
}

function executeProcess(command: string, args: string[], cwd: string) {
  return new Promise<{ code: number | null; stderr: string; stdout: string }>(
    (resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          PATH: process.env.PATH,
          HOME: cwd,
          LANG: "C.UTF-8",
          PYTHONNOUSERSITE: "1",
        },
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (chunk: unknown) => {
        stdout += String(chunk);
      });

      child.stderr?.on("data", (chunk: unknown) => {
        stderr += String(chunk);
      });

      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        resolve({
          code: 124,
          stderr:
            `${stderr}\nExecution timed out after ${EXEC_TIMEOUT_MS}ms`.trim(),
          stdout,
        });
      }, EXEC_TIMEOUT_MS);

      child.on("error", (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });

      child.on("close", (code: number | null) => {
        clearTimeout(timeout);
        resolve({ code, stderr, stdout });
      });
    }
  );
}

export async function POST(request: Request) {
  let sandboxDir = "";

  try {
    const body = (await request.json()) as {
      code?: string;
      files?: RuntimeFile[];
      runtime?: Runtime;
    };

    const code = body.code?.trim();
    const runtime = body.runtime;

    if (!code || !runtime || !runtimeConfigs[runtime]) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }

    if (code.length > MAX_CODE_LENGTH) {
      return NextResponse.json(
        { error: "Code trop long pour le sandbox" },
        { status: 413 }
      );
    }

    const files = (body.files ?? []).slice(0, MAX_FILES);
    sandboxDir = await mkdtemp(join(tmpdir(), "mai-code-interpreter-"));

    for (const file of files) {
      if (!file?.name || !file?.contentBase64) {
        return NextResponse.json(
          { error: "Fichier invalide fourni au sandbox" },
          { status: 400 }
        );
      }

      let decoded = Buffer.alloc(0);
      try {
        decoded = Buffer.from(file.contentBase64, "base64");
      } catch {
        return NextResponse.json(
          { error: `Base64 invalide: ${file.name}` },
          { status: 400 }
        );
      }

      if (decoded.byteLength > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: `Fichier trop volumineux: ${file.name}` },
          { status: 413 }
        );
      }

      const safeName = sanitizeFileName(file.name);
      await mkdir(dirname(join(sandboxDir, safeName)), { recursive: true });
      await writeFile(join(sandboxDir, safeName), decoded);
    }

    const runtimeConfig = runtimeConfigs[runtime];
    await writeFile(join(sandboxDir, runtimeConfig.entryFile), `${code}\n`);

    let execution: { code: number | null; stderr: string; stdout: string };
    try {
      execution = await executeProcess(
        runtimeConfig.command,
        runtimeConfig.args,
        sandboxDir
      );
    } catch (error) {
      return NextResponse.json(
        {
          logs: [`[sandbox] runtime=${runtime}`],
          output: "",
          error:
            error instanceof Error
              ? `Impossible d'exécuter ${runtimeConfig.command}: ${error.message}`
              : `Impossible d'exécuter ${runtimeConfig.command}`,
          exitCode: 127,
          success: false,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: [
        `[sandbox] runtime=${runtime}`,
        `[sandbox] files=${files.length}`,
        "[sandbox] isolation=process+tempdir",
      ],
      output: execution.stdout,
      error: execution.stderr,
      exitCode: execution.code,
      success: execution.code === 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erreur interne du code interpreter",
      },
      { status: 500 }
    );
  } finally {
    if (sandboxDir) {
      await rm(sandboxDir, { force: true, recursive: true });
    }
  }
}
