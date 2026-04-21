"use client";

import { Ghost } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/use-language";
import { greetingPrompts } from "@/lib/constants";
import { getDefaultSuggestions, pickRandomSuggestions } from "@/lib/suggestion-pool";

const GHOST_MODE_STORAGE_KEY = "mai.ghost-mode";
const GHOST_MODE_UPDATED_EVENT = "mai:ghost-mode-updated";

export function Preview() {
  const router = useRouter();
  const { language } = useLanguage();
  const [greetingText, setGreetingText] = useState<string>(greetingPrompts[0]);
  const [isGhostModeEnabled, setIsGhostModeEnabled] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    getDefaultSuggestions(4, language)
  );

  useEffect(() => {
    // Génération pseudo-aléatoire côté client uniquement (build-safe).
    const randomIndex = Math.floor(Math.random() * greetingPrompts.length);
    setGreetingText(greetingPrompts[randomIndex] ?? greetingPrompts[0]);
    setSuggestions(pickRandomSuggestions(4, language));
  }, [language]);

  useEffect(() => {
    const syncGhostState = () => {
      const persistedValue =
        localStorage.getItem(GHOST_MODE_STORAGE_KEY) === "true";
      setIsGhostModeEnabled(persistedValue);
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

  const handleAction = (query?: string) => {
    const url = query ? `/?query=${encodeURIComponent(query)}` : "/";
    router.push(url);
  };

  return (
    <div className="liquid-glass flex h-full flex-col overflow-hidden rounded-tl-2xl">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/20 px-5">
        <Image
          alt="Logo mAI"
          className="size-5"
          height={20}
          src="/mai-logo.svg"
          width={20}
        />
        <span className="text-[13px] text-muted-foreground">mAI</span>
        <button
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition ${
            isGhostModeEnabled
              ? "border-purple-500/40 bg-purple-500/20 text-purple-200 shadow-[0_0_0_3px_rgba(168,85,247,0.15)]"
              : "border-border/40 bg-card/40 text-muted-foreground hover:border-border/70"
          }`}
          onClick={() => {
            const nextValue = !isGhostModeEnabled;
            setIsGhostModeEnabled(nextValue);
            localStorage.setItem(GHOST_MODE_STORAGE_KEY, String(nextValue));
            window.dispatchEvent(new Event(GHOST_MODE_UPDATED_EVENT));
          }}
          type="button"
        >
          <Ghost className="size-3.5" />
          {isGhostModeEnabled ? "Mode Fantôme actif" : "Mode Fantôme"}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight">
            {greetingText}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {language === "en"
              ? "With mAI, take things to the next level!"
              : language === "es"
                ? "¡Con mAI, pasa al siguiente nivel!"
                : "Avec mAI, passez à la vitesse supérieure !"}
          </p>
          {isGhostModeEnabled && (
            <>
              <p className="mt-2 text-xs font-medium text-purple-300">
                ✅ Mode Fantôme activé.
              </p>
              <p className="mt-1 text-xs text-purple-300">
                Le prochain message ne sera pas enregistré dans
                l&apos;historique.
              </p>
            </>
          )}
        </div>

        <div className="flex w-full max-w-md flex-wrap justify-center gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              className="liquid-glass rounded-full px-3 py-1.5 text-left text-[10px] leading-snug text-muted-foreground/80 transition-all duration-200 hover:-translate-y-0.5 hover:text-foreground"
              key={suggestion}
              onClick={() => handleAction(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 px-5 pb-5">
        <button
          className="flex w-full items-center rounded-2xl border border-border/30 bg-card/30 px-4 py-3 text-left text-[13px] text-muted-foreground/40 transition-colors hover:border-border/50 hover:text-muted-foreground/60"
          onClick={() => handleAction()}
          type="button"
        >
          {language === "en"
            ? "Write your message..."
            : language === "es"
              ? "Escribe tu mensaje..."
              : "Écrivez votre message..."}
        </button>
      </div>
    </div>
  );
}
