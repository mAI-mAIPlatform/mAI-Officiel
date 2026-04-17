"use client";

import { Ghost } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const GHOST_MODE_STORAGE_KEY = "mai.ghost-mode";
const GHOST_MODE_UPDATED_EVENT = "mai:ghost-mode-updated";

export function VoiceTopActions({
  chatId: _chatId,
  messages: _messages,
}: {
  chatId: string;
  messages: ChatMessage[];
}) {
  const [isGhostModeEnabled, setIsGhostModeEnabled] = useState(false);

  useEffect(() => {
    const syncGhostState = () => {
      setIsGhostModeEnabled(
        window.localStorage.getItem(GHOST_MODE_STORAGE_KEY) === "true"
      );
    };

    syncGhostState();
    window.addEventListener("storage", syncGhostState);
    window.addEventListener("focus", syncGhostState);
    window.addEventListener(GHOST_MODE_UPDATED_EVENT, syncGhostState);

    return () => {
      window.removeEventListener("storage", syncGhostState);
      window.removeEventListener("focus", syncGhostState);
      window.removeEventListener(GHOST_MODE_UPDATED_EVENT, syncGhostState);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed top-3 right-3 z-40">
      <button
        aria-label="Mode Fantôme"
        className={cn(
          "pointer-events-auto liquid-glass inline-flex items-center justify-center rounded-full border p-2 text-[11px] shadow-[var(--shadow-float)] transition",
          isGhostModeEnabled
            ? "border-purple-500/40 bg-purple-500/20 text-purple-100"
            : "border-border/40 bg-card/70 text-muted-foreground hover:border-border/70"
        )}
        onClick={() => {
          const nextValue = !isGhostModeEnabled;
          setIsGhostModeEnabled(nextValue);
          localStorage.setItem(GHOST_MODE_STORAGE_KEY, String(nextValue));
          window.dispatchEvent(new Event(GHOST_MODE_UPDATED_EVENT));
        }}
        type="button"
      >
        <Ghost className="size-4" />
      </button>
    </div>
  );
}
