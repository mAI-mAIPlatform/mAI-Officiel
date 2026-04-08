"use client";

import {
  Bold,
  Bot,
  Download,
  Italic,
  MessageSquare,
  PenBox,
  Sparkles,
  Underline,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

const tones = ["Professionnel", "Amical", "Créatif", "Chill"] as const;
const formats = [
  "Post LinkedIn",
  "Email",
  "Chapitre de roman",
  "Essai académique",
] as const;
const fontFamilies = ["Inter", "Georgia", "Roboto", "Montserrat"] as const;
const fontSizes = [12, 14, 16, 18, 20, 24] as const;

type Tone = (typeof tones)[number];
type Format = (typeof formats)[number];

type DraftComment = {
  id: string;
  createdAt: string;
  note: string;
  selection: string;
};

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

function applyWrap(
  text: string,
  start: number,
  end: number,
  wrap: [string, string]
) {
  const left = text.slice(0, start);
  const middle = text.slice(start, end);
  const right = text.slice(end);
  return `${left}${wrap[0]}${middle}${wrap[1]}${right}`;
}

export default function Ecri20Page() {
  const [tone, setTone] = useState<Tone>("Professionnel");
  const [format, setFormat] = useState<Format>("Post LinkedIn");
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState("");
  const [fontFamily, setFontFamily] =
    useState<(typeof fontFamilies)[number]>("Inter");
  const [fontSize, setFontSize] = useState<(typeof fontSizes)[number]>(16);
  const [comments, setComments] = useState<DraftComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [assistantSuggestion, setAssistantSuggestion] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const generatedDraft = useMemo(
    () => generateDraft(prompt, tone, format),
    [prompt, tone, format]
  );

  const effectiveDraft = draft || generatedDraft;

  const runFormatAction = (kind: "bold" | "italic" | "underline") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const wraps: Record<typeof kind, [string, string]> = {
      bold: ["**", "**"],
      italic: ["*", "*"],
      underline: ["<u>", "</u>"],
    };

    const next = applyWrap(
      effectiveDraft,
      selectionStart,
      selectionEnd,
      wraps[kind]
    );
    setDraft(next);
  };

  const generateAssistantSuggestion = () => {
    const context = prompt.trim() || "Sans brief explicite";
    setAssistantSuggestion(
      `Copilote IA : pour un ton ${tone.toLowerCase()}, ajoutez une preuve chiffrée dans le développement et concluez avec un CTA orienté ${format.toLowerCase()}. Contexte retenu : ${context}.`
    );
  };

  const addComment = () => {
    const textarea = textareaRef.current;
    const selection =
      textarea && textarea.selectionEnd > textarea.selectionStart
        ? effectiveDraft.slice(textarea.selectionStart, textarea.selectionEnd)
        : "Section générale";

    if (!commentText.trim()) {
      return;
    }

    setComments((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        note: commentText.trim(),
        selection,
      },
      ...prev,
    ]);
    setCommentText("");
  };

  const handleExport = (kind: "txt" | "json" | "docx" | "pdf") => {
    if (kind === "txt") {
      downloadBlob(
        effectiveDraft,
        "ecri20-export.txt",
        "text/plain;charset=utf-8"
      );
      return;
    }

    if (kind === "json") {
      downloadBlob(
        JSON.stringify(
          { tone, format, prompt, draft: effectiveDraft, comments },
          null,
          2
        ),
        "ecri20-export.json",
        "application/json;charset=utf-8"
      );
      return;
    }

    if (kind === "docx") {
      const wordHtml = `<!doctype html><html><body><pre>${effectiveDraft.replace(/</g, "&lt;")}</pre></body></html>`;
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
      `<html><head><title>Ecri20 PDF</title></head><body><pre style="white-space:pre-wrap;font-family:${fontFamily};font-size:${fontSize}px">${effectiveDraft.replace(/</g, "&lt;")}</pre></body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="liquid-glass mx-auto flex h-full w-full max-w-6xl flex-col gap-5 overflow-y-auto p-6">
      <header className="liquid-glass rounded-2xl p-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <PenBox className="size-6 text-primary" /> Ecri20
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rédaction augmentée avec collaboration IA, commentaires d&apos;équipe
          et formatage avancé.
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
            className="mt-1 min-h-24 w-full rounded-xl border border-border/60 bg-background/60 p-3"
            onChange={(event) => {
              setPrompt(event.target.value);
              setDraft("");
            }}
            placeholder="Décris le sujet, le contexte et l'objectif du texte..."
            value={prompt}
          />
        </label>
      </section>

      <section className="liquid-glass rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            className="rounded-lg border px-3 py-1 text-xs"
            onClick={() => runFormatAction("bold")}
            type="button"
          >
            <Bold className="mr-1 inline size-3" />
            Gras
          </button>
          <button
            className="rounded-lg border px-3 py-1 text-xs"
            onClick={() => runFormatAction("italic")}
            type="button"
          >
            <Italic className="mr-1 inline size-3" />
            Italique
          </button>
          <button
            className="rounded-lg border px-3 py-1 text-xs"
            onClick={() => runFormatAction("underline")}
            type="button"
          >
            <Underline className="mr-1 inline size-3" />
            Souligné
          </button>
          <label className="text-xs">
            Police
            <select
              className="ml-2 rounded-lg border bg-background/60 px-2 py-1"
              onChange={(event) =>
                setFontFamily(
                  event.target.value as (typeof fontFamilies)[number]
                )
              }
              value={fontFamily}
            >
              {fontFamilies.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            Taille
            <select
              className="ml-2 rounded-lg border bg-background/60 px-2 py-1"
              onChange={(event) =>
                setFontSize(
                  Number(event.target.value) as (typeof fontSizes)[number]
                )
              }
              value={fontSize}
            >
              {fontSizes.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}px
                </option>
              ))}
            </select>
          </label>
        </div>

        <textarea
          className="min-h-80 w-full rounded-xl border border-border/60 bg-background/60 p-3"
          onChange={(event) => setDraft(event.target.value)}
          ref={textareaRef}
          style={{ fontFamily, fontSize }}
          value={effectiveDraft}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="liquid-glass rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">
              <Bot className="mr-1 inline size-4" />
              Copilote IA
            </h2>
            <button
              className="rounded-lg border px-3 py-1 text-xs"
              onClick={generateAssistantSuggestion}
              type="button"
            >
              <Sparkles className="mr-1 inline size-3" />
              Suggérer
            </button>
          </div>
          <p className="rounded-xl bg-background/60 p-3 text-sm text-muted-foreground">
            {assistantSuggestion ||
              "Cliquez sur Suggérer pour obtenir une proposition de collaboration IA."}
          </p>
        </div>

        <div className="liquid-glass rounded-2xl p-5">
          <h2 className="mb-2 font-semibold">
            <MessageSquare className="mr-1 inline size-4" />
            Commentaires
          </h2>
          <div className="flex gap-2">
            <input
              className="h-10 flex-1 rounded-xl border border-border/60 bg-background/60 px-3 text-sm"
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="Ajouter un commentaire de relecture..."
              value={commentText}
            />
            <button
              className="rounded-xl border px-3 text-xs"
              onClick={addComment}
              type="button"
            >
              Ajouter
            </button>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            {comments.length === 0 ? (
              <p className="text-muted-foreground">
                Aucun commentaire pour le moment.
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  className="rounded-xl border border-border/60 bg-background/60 p-2"
                  key={comment.id}
                >
                  <p className="font-medium">{comment.selection}</p>
                  <p>{comment.note}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="liquid-glass rounded-2xl p-5">
        <div className="mt-1 flex flex-wrap gap-2">
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
