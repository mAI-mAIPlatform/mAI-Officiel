"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type UndoEntry = {
  label?: string;
  undo: () => Promise<void> | void;
  redo: () => Promise<void> | void;
};

export function useUndoStack(limit = 20) {
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);

  const push = useCallback((entry: UndoEntry) => {
    setUndoStack((prev) => [...prev, entry].slice(-limit));
    setRedoStack([]);
  }, [limit]);

  const undo = useCallback(async () => {
    const entry = undoStack.at(-1);
    if (!entry) return;

    await entry.undo();
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, entry].slice(-limit));

    toast("Action annulée", {
      action: {
        label: "Rétablir",
        onClick: () => {
          void (async () => {
            await entry.redo();
            setRedoStack((prev) => prev.slice(0, -1));
            setUndoStack((prev) => [...prev, entry].slice(-limit));
          })();
        },
      },
    });
  }, [limit, undoStack]);

  const redo = useCallback(async () => {
    const entry = redoStack.at(-1);
    if (!entry) return;

    await entry.redo();
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, entry].slice(-limit));
  }, [limit, redoStack]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? event.metaKey : event.ctrlKey;
      if (!mod || event.key.toLowerCase() !== "z") return;

      event.preventDefault();
      if (event.shiftKey) {
        void redo();
      } else {
        void undo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  return { push, undo, redo, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 };
}
