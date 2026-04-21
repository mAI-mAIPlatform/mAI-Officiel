"use client";

import { useEffect, useState } from "react";
import {
  type AppLanguage,
  getLanguageFromStorage,
  resolveLanguage,
  setLanguageInStorage,
} from "@/lib/i18n";

export function useLanguage() {
  const [language, setLanguage] = useState<AppLanguage>("fr");

  useEffect(() => {
    setLanguage(getLanguageFromStorage());

    const sync = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: string }>;
      setLanguage(resolveLanguage(customEvent.detail?.language));
    };

    const syncOnStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "mai.language.v1") {
        return;
      }
      setLanguage(getLanguageFromStorage());
    };

    window.addEventListener("mai:language-updated", sync as EventListener);
    window.addEventListener("storage", syncOnStorage);
    return () => {
      window.removeEventListener("mai:language-updated", sync as EventListener);
      window.removeEventListener("storage", syncOnStorage);
    };
  }, []);

  return {
    language,
    setLanguage: (nextLanguage: AppLanguage) => {
      setLanguage(nextLanguage);
      setLanguageInStorage(nextLanguage);
    },
  };
}
