"use client";
import { playUiSound } from "@/lib/sound";

export type NotificationLevel = "success" | "warning" | "error" | "info";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  level: NotificationLevel;
  createdAt: string;
  read: boolean;
  source: "user" | "system";
  pinned?: boolean;
  metadata?: {
    chatId?: string;
    assistantMessageId?: string;
    conversationTitle?: string;
    modelId?: string;
    phase?: "started" | "completed" | "error";
  };
};

type NotificationVariables = Record<
  string,
  string | number | boolean | null | undefined
>;

export const interpolateTemplate = (
  template: string,
  variables?: NotificationVariables
) =>
  template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_fullMatch, key: string) => {
    const value = variables?.[key];
    if (value === null || value === undefined) {
      return "";
    }
    return String(value);
  });

const STORAGE_KEY = "mai.notifications.history.v1";
const EVENT_NAME = "mai:notifications-updated";
const DUPLICATE_WINDOW_MS = 30_000;

async function deliverSystemNotification(notification: AppNotification) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const body = notification.message;

  // PWA / iOS: on privilégie showNotification via Service Worker lorsqu'il est disponible.
  const registration = await navigator.serviceWorker
    ?.getRegistration()
    .catch(() => undefined);

  if (registration) {
    await registration.showNotification(notification.title, {
      body,
      data: notification.metadata,
      icon: "/images/logo.png",
      tag: `mai-${notification.level}`,
    });
    return;
  }

  new Notification(notification.title, {
    body,
    icon: "/images/logo.png",
  });
}

function emitUpdate() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getNotificationHistory(): AppNotification[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as AppNotification[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item && typeof item === "object")
      .filter((item) => {
        const maybeItem = item as AppNotification;
        if (maybeItem.metadata?.phase === "error") {
          return false;
        }
        if (maybeItem.title === "Réponse IA interrompue") {
          return false;
        }
        return true;
      })
      .slice(0, 150);
  } catch {
    return [];
  }
}

function saveNotificationHistory(items: AppNotification[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 150)));
  emitUpdate();
}

export function createNotification(input: {
  level: NotificationLevel;
  message: string;
  source?: "user" | "system";
  title?: string;
  variables?: NotificationVariables;
  metadata?: AppNotification["metadata"];
}) {
  const titleByLevel: Record<NotificationLevel, string> = {
    error: "Erreur",
    info: "Information",
    success: "Succès",
    warning: "Avertissement",
  };

  const next: AppNotification = {
    createdAt: new Date().toISOString(),
    id: crypto.randomUUID(),
    level: input.level,
    message: interpolateTemplate(input.message, input.variables).trim(),
    metadata: input.metadata,
    read: false,
    source: input.source ?? "system",
    title:
      interpolateTemplate(
        input.title?.trim() || titleByLevel[input.level],
        input.variables
      ) || titleByLevel[input.level],
  };

  const current = getNotificationHistory();
  const latest = current[0];
  if (latest) {
    const latestTimestamp = new Date(latest.createdAt).getTime();
    const nextTimestamp = new Date(next.createdAt).getTime();
    const isDuplicate =
      latest.level === next.level &&
      latest.title === next.title &&
      latest.message === next.message &&
      nextTimestamp - latestTimestamp < DUPLICATE_WINDOW_MS;

    if (isDuplicate) {
      return;
    }
  }
  saveNotificationHistory([next, ...current]);
  playUiSound(next.level === "success" ? "success" : "notification");
  void deliverSystemNotification(next);
}

export function createAiResponseNotification(input: {
  phase: "started" | "completed" | "error";
  chatId: string;
  conversationTitle?: string;
  assistantMessageId?: string;
  modelId?: string;
  preview?: string;
}) {
  // UX: les notifications d'erreur de réponse IA ont été désactivées
  // pour éviter le bruit répétitif sur "Sans titre".
  if (input.phase === "error") {
    return;
  }

  const templateByPhase = {
    started: {
      level: "info" as const,
      title: "Réponse IA en cours",
      message:
        "La conversation « {{conversationTitle}} » est en cours de génération.",
    },
    completed: {
      level: "success" as const,
      title: "Réponse IA terminée",
      message: "{{preview}}",
    },
    error: {
      level: "error" as const,
      title: "Réponse IA interrompue",
      message:
        "Une erreur est survenue sur la conversation « {{conversationTitle}} ».",
    },
  } as const;

  const selectedTemplate = templateByPhase[input.phase];
  const fallbackPreview = "La réponse est disponible dans la conversation.";

  createNotification({
    level: selectedTemplate.level,
    message: selectedTemplate.message,
    metadata: {
      chatId: input.chatId,
      assistantMessageId: input.assistantMessageId,
      conversationTitle: input.conversationTitle,
      modelId: input.modelId,
      phase: input.phase,
    },
    source: "system",
    title: selectedTemplate.title,
    variables: {
      conversationTitle: input.conversationTitle ?? "Sans titre",
      preview: input.preview?.trim() || fallbackPreview,
    },
  });
}

export function markNotificationRead(id: string, read: boolean) {
  const items = getNotificationHistory();
  saveNotificationHistory(
    items.map((item) => (item.id === id ? { ...item, read } : item))
  );
}

export function pinNotification(id: string, pinned: boolean) {
  const items = getNotificationHistory();
  saveNotificationHistory(
    items.map((item) => (item.id === id ? { ...item, pinned } : item))
  );
}

export function deleteNotification(id: string) {
  const items = getNotificationHistory();
  saveNotificationHistory(items.filter((item) => item.id !== id));
}

export function markAllNotificationsRead(read: boolean) {
  const items = getNotificationHistory();
  saveNotificationHistory(items.map((item) => ({ ...item, read })));
}

export function clearNotifications() {
  saveNotificationHistory([]);
}

export function subscribeNotifications(onUpdate: () => void) {
  if (typeof window === "undefined") {
    return () => {
      // no-op côté serveur
    };
  }

  window.addEventListener(EVENT_NAME, onUpdate);
  return () => window.removeEventListener(EVENT_NAME, onUpdate);
}
