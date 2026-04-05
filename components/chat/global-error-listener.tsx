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
    const onWindowError = (event: ErrorEvent) => {
      toast({
        type: "error",
        description: normalizeErrorMessage(event.error ?? event.message),
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      toast({
        type: "error",
        description: normalizeErrorMessage(event.reason),
      });
    };

    const onAppError = (event: Event) => {
      const customEvent = event as CustomEvent<AppErrorPayload>;
      const sourcePrefix = customEvent.detail?.source
        ? `[${customEvent.detail.source}] `
        : "";

      toast({
        type: "error",
        description: `${sourcePrefix}${customEvent.detail?.message ?? "Une erreur inattendue est survenue."}`,
      });
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
