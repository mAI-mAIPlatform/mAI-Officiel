"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { setClientPreferenceCookie } from "@/lib/client-preferences";
import { appLogoOptions } from "@/lib/logo-options";

type BrandContextType = {
  appLogoId: string;
  appFaviconId: string;
  setAppLogoId: (id: string) => void;
  setAppFaviconId: (id: string) => void;
  currentLogoSrc: string;
  currentFaviconSrc: string;
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [appLogoId, setAppLogoIdLocal] = useLocalStorage("mai.settings.app-logo", "logo");
  const [appFaviconId, setAppFaviconIdLocal] = useLocalStorage("mai.settings.app-favicon", "logo");

  const setAppLogoId = (id: string) => {
    setAppLogoIdLocal(id);
    setClientPreferenceCookie("mai-app-logo", id);
  };

  const setAppFaviconId = (id: string) => {
    setAppFaviconIdLocal(id);
    setClientPreferenceCookie("mai-app-favicon", id);
  };

  const currentLogoSrc = appLogoOptions.find((l) => l.id === appLogoId)?.src ?? "/images/logo.png";
  const currentFaviconSrc = appLogoOptions.find((l) => l.id === appFaviconId)?.src ?? "/images/logo.png";

  useEffect(() => {
    setClientPreferenceCookie("mai-app-logo", appLogoId);
    setClientPreferenceCookie("mai-app-favicon", appFaviconId);

    // Update favicon instantly in DOM
    if (typeof document !== "undefined") {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = currentFaviconSrc;
    }
  }, [appLogoId, appFaviconId, currentFaviconSrc]);

  return (
    <BrandContext.Provider
      value={{
        appLogoId,
        appFaviconId,
        setAppLogoId,
        setAppFaviconId,
        currentLogoSrc,
        currentFaviconSrc,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
}
