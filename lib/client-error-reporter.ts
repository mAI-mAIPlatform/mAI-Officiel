"use client";

const APP_ERROR_EVENT = "mai:error";

export type AppErrorPayload = {
  message: string;
  source?: string;
  status?: number;
};

function toText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (value && typeof value === "object" && "message" in value) {
    return String((value as { message?: unknown }).message ?? "");
  }

  return "Une erreur inattendue est survenue.";
}

export function normalizeErrorMessage(error: unknown): string {
  const message = toText(error).trim();
  return message.length > 0 ? message : "Une erreur inattendue est survenue.";
}

export function reportClientError(error: unknown, source?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const detail: AppErrorPayload = {
    message: normalizeErrorMessage(error),
    source,
  };

  window.dispatchEvent(
    new CustomEvent<AppErrorPayload>(APP_ERROR_EVENT, { detail })
  );
}

export function getAppErrorEventName() {
  return APP_ERROR_EVENT;
}
