"use client";

import { useEffect, useMemo, useState } from "react";
import { QUIZZLY_THEME_EVENT, QUIZZLY_THEME_KEY, getThemeById, type QuizzlyTheme } from "@/lib/quizzly/themes";
import type { ReactNode } from "react";

export function QuizzlyThemeShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<QuizzlyTheme>(getThemeById("classic-light"));

  useEffect(() => {
    const apply = () => {
      const stored = localStorage.getItem(QUIZZLY_THEME_KEY) ?? "classic-light";
      setTheme(getThemeById(stored));
    };
    apply();
    window.addEventListener(QUIZZLY_THEME_EVENT, apply);
    return () => window.removeEventListener(QUIZZLY_THEME_EVENT, apply);
  }, []);

  const style = useMemo(
    () =>
      ({
        "--q-bg": theme.vars.bg,
        "--q-card": theme.vars.card,
        "--q-card-alt": theme.vars.cardAlt,
        "--q-text": theme.vars.text,
        "--q-text-muted": theme.vars.textMuted,
        "--q-accent": theme.vars.accent,
        "--q-border": theme.vars.border,
        "--q-button": theme.vars.button,
        "--q-button-text": theme.vars.buttonText,
        "--q-button-soft": theme.vars.buttonSoft,
        "--q-button-soft-text": theme.vars.buttonSoftText,
        "--q-nav": theme.vars.nav,
        transition: "background-color 300ms ease, color 300ms ease",
      }) as React.CSSProperties,
    [theme]
  );

  return (
    <div className="quizzly-theme min-h-full" data-q-theme={theme.id} style={style}>
      {children}
    </div>
  );
}
