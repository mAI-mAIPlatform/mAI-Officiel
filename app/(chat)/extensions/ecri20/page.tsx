"use client";

import { Download, PenBox } from "lucide-react";
import { useMemo, useState } from "react";

const tones = ["Professionnel", "Amical", "Créatif", "Chill"] as const;
const formats = [
  "Post LinkedIn",
  "Email",
  "Chapitre de roman",
  "Essai académique",
] as const;

type Tone = (typeof tones)[number];
type Format = (typeof formats)[number];

function generateDraft(prompt: string, tone: Tone, format: Format) {
  const lead = `Ton: ${tone} · Format: ${format}`;
  const body =
    prompt.trim().length > 0
      ? prompt.trim()
      : "Sujet libre: transformation digitale et impact humain.";

  return `${lead}\n\nIntroduction\n${body}\n\nDéveloppement\n- Idée centrale clarifiée\n- Argument principal avec exemple concret\n- Transition vers une action recommandée\n\nConclusion\nSynthèse concise + prochain pas conseillé.`;
}

function downloadBlob(content: BlobPart, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Ecri20Page() {
  const [tone, setTone] = useState<Tone>("Professionnel");
  const [format, setFormat] = useState<Format>("Post LinkedIn");
  const [prompt, setPrompt] = useState("");

  const draft = useMemo(
    () => generateDraft(prompt, tone, format),
    [prompt, tone, format]
  );

  const handleExport = (kind: "txt" | "json" | "docx" | "pdf") => {
    if (kind === "txt") {
      downloadBlob(draft, "ecri20-export.txt", "text/plain;charset=utf-8");
      return;
    }

    if (kind === "json") {
      downloadBlob(
        JSON.stringify({ tone, format, prompt, draft }, null, 2),
        "ecri20-export.json",
        "application/json;charset=utf-8"
      );
      return;
    }

    if (kind === "docx") {
      // Fallback Word-compatible HTML export renommé en .docx pour usage rapide.
      const wordHtml = `<!doctype html><html><body><pre>${draft.replace(/</g, "&lt;")}</pre></body></html>`;
      downloadBlob(
        wordHtml,
        "ecri20-export.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      return;
    }

    printWindow.document.write(
      `<html><head><title>Ecri20 PDF</title></head><body><pre style="white-space:pre-wrap;font-family:system-ui">${draft.replace(/</g, "&lt;")}</pre></body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="liquid-glass mx-auto flex h-full w-full max-w-5xl flex-col gap-5 overflow-y-auto p-6">
      <header className="liquid-glass rounded-2xl p-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <PenBox className="size-6 text-primary" /> Ecri20
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          IA de rédaction augmentée avec choix de ton, format et export direct
          depuis le module.
        </p>
      </header>

      <section className="liquid-glass grid gap-4 rounded-2xl p-5 md:grid-cols-2">
        <label className="text-sm">
          Ton
          <select
            className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2"
            onChange={(event) => setTone(event.target.value as Tone)}
            value={tone}
          >
            {tones.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Format
          <select
            className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2"
            onChange={(event) => setFormat(event.target.value as Format)}
            value={format}
          >
            {formats.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </label>

        <label className="text-sm md:col-span-2">
          Brief utilisateur
          <textarea
            className="mt-1 min-h-28 w-full rounded-xl border border-border/60 bg-background/60 p-3"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Décris le sujet, le contexte et l'objectif du texte..."
            value={prompt}
          />
        </label>
      </section>

      <section className="liquid-glass rounded-2xl p-5">
        <h2 className="mb-2 font-semibold">Brouillon généré</h2>
        <pre className="max-h-80 overflow-y-auto rounded-xl bg-background/60 p-3 text-sm whitespace-pre-wrap">
          {draft}
        </pre>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["txt", "json", "docx", "pdf"] as const).map((kind) => (
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-xs font-semibold hover:border-primary/40"
              key={kind}
              onClick={() => handleExport(kind)}
              type="button"
            >
              <Download className="size-3.5" /> Export {kind.toUpperCase()}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
