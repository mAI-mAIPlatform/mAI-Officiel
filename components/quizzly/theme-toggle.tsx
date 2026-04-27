"use client";

import { Moon, Sun } from "lucide-react";
import { QUIZZLY_THEME_EVENT, QUIZZLY_THEME_KEY } from "@/lib/quizzly/themes";
import { useEffect, useState } from "react";

export function QuizzlyThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const current = localStorage.getItem(QUIZZLY_THEME_KEY) ?? "classic-light";
    setDark(current !== "classic-light");
  }, []);

  return (
    <button
      className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-violet-100 hover:text-violet-700"
      onClick={() => {
        const next = dark ? "classic-light" : "classic-dark";
        localStorage.setItem(QUIZZLY_THEME_KEY, next);
        setDark(!dark);
        window.dispatchEvent(new Event(QUIZZLY_THEME_EVENT));
      }}
      type="button"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
