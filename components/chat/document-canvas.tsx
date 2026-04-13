"use client";

import { EyeIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type CanvasBlock = {
  id: string;
  text: string;
};

type DocumentCanvasProps = {
  content: string;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  status: "streaming" | "idle";
};

function parseContentToBlocks(content: string): CanvasBlock[] {
  const blocks = content
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((text, index) => ({ id: `block-${index}`, text }));

  return blocks.length > 0 ? blocks : [{ id: "block-0", text: "" }];
}

export function DocumentCanvas({
  content,
  onSaveContent,
  status,
}: DocumentCanvasProps) {
  const [mode, setMode] = useState<"edit" | "read">("edit");
  const [blocks, setBlocks] = useState<CanvasBlock[]>(() =>
    parseContentToBlocks(content)
  );

  useEffect(() => {
    if (status === "streaming") {
      return;
    }

    setBlocks(parseContentToBlocks(content));
  }, [content, status]);

  const serializedContent = useMemo(
    () => blocks.map((block) => block.text.trim()).join("\n\n"),
    [blocks]
  );

  const updateBlock = (id: string, nextText: string) => {
    setBlocks((current) => {
      const nextBlocks = current.map((block) =>
        block.id === id ? { ...block, text: nextText } : block
      );
      const nextContent = nextBlocks.map((block) => block.text.trim()).join("\n\n");
      onSaveContent(nextContent, true);
      return nextBlocks;
    });
  };

  return (
    <section className="liquid-panel w-full rounded-2xl border border-white/30 bg-white/75 p-4 backdrop-blur-2xl dark:bg-black/35">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Canevas documentaire
          </p>
          <p className="text-xs text-muted-foreground">
            Édition par blocs avec aperçu fidèle à l'export.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/70 p-1">
          <button
            className={cn(
              "rounded-full px-2 py-1 text-xs",
              mode === "edit" && "bg-primary/10 text-primary"
            )}
            onClick={() => setMode("edit")}
            type="button"
          >
            <PencilIcon className="mr-1 inline size-3" /> Édition
          </button>
          <button
            className={cn(
              "rounded-full px-2 py-1 text-xs",
              mode === "read" && "bg-primary/10 text-primary"
            )}
            onClick={() => setMode("read")}
            type="button"
          >
            <EyeIcon className="mr-1 inline size-3" /> Lecture
          </button>
        </div>
      </header>

      {mode === "read" ? (
        <article className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground dark:prose-invert">
          {serializedContent || "Document vide"}
        </article>
      ) : (
        <div className="space-y-2">
          {blocks.map((block, index) => (
            <div
              className="rounded-xl border border-border/60 bg-background/70 p-2"
              key={block.id}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Bloc {index + 1}
                </span>
                {blocks.length > 1 ? (
                  <button
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      const next = blocks.filter((item) => item.id !== block.id);
                      setBlocks(next);
                      onSaveContent(
                        next.map((item) => item.text.trim()).join("\n\n"),
                        true
                      );
                    }}
                    type="button"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                ) : null}
              </div>
              <textarea
                className="min-h-24 w-full resize-y rounded-lg border border-border/50 bg-background/80 p-2 text-sm outline-none"
                onChange={(event) => updateBlock(block.id, event.target.value)}
                value={block.text}
              />
            </div>
          ))}

          <button
            className="inline-flex items-center rounded-lg border border-dashed border-border/70 px-2 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-primary"
            onClick={() =>
              setBlocks((current) => [
                ...current,
                {
                  id: `block-${
                    typeof crypto !== "undefined" && "randomUUID" in crypto
                      ? crypto.randomUUID()
                      : Date.now()
                  }`,
                  text: "",
                },
              ])
            }
            type="button"
          >
            <PlusIcon className="mr-1 size-3" /> Ajouter un bloc
          </button>
        </div>
      )}
    </section>
  );
}
