"use client";

import { useEffect } from "react";
import { useAppLogo } from "@/hooks/use-app-logo";

export function AppLogoUpdater() {
  const { appLogo } = useAppLogo();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const links = document.querySelectorAll(
        "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
      );
      for (const el of Array.from(links)) {
        el.setAttribute("href", appLogo);
      }
    }
  }, [appLogo]);

  return null;
}
