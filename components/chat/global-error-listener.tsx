"use client";

import { useEffect } from "react";
import { toast } from "@/components/chat/toast";
import {
  type AppErrorPayload,
  getAppErrorEventName,
  normalizeErrorMessage,
} from "@/lib/client-error-reporter";

export function GlobalErrorListener() {
  useEffect(() => {
    let lastMessage = "";
    let lastAt = 0;

    const pushToast = (description: string) => {
      const normalized = description.trim();
      if (!normalized) {
        return;
      }

      const now = Date.now();
      if (normalized === lastMessage && now - lastAt < 1500) {
        return;
      }

      lastMessage = normalized;
      lastAt = now;

      toast({
        type: "error",
        description: normalized,
      });
    };

    const onWindowError = (event: ErrorEvent) => {
      pushToast(normalizeErrorMessage(event.error ?? event.message));
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      pushToast(normalizeErrorMessage(event.reason));
    };

    const onAppError = (event: Event) => {
      const customEvent = event as CustomEvent<AppErrorPayload>;
      const sourcePrefix = customEvent.detail?.source
        ? `[${customEvent.detail.source}] `
        : "";

      pushToast(
        `${sourcePrefix}${customEvent.detail?.message ?? "Une erreur inattendue est survenue."}`
      );
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener(
      getAppErrorEventName(),
      onAppError as EventListener
    );

    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener(
        getAppErrorEventName(),
        onAppError as EventListener
      );
    };
  }, []);

  return null;
}
