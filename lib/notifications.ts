import { and, eq, gte, lte } from "drizzle-orm";
import { createNotification as createDbNotification, db } from "@/lib/db/queries";
import { notification, project, task } from "@/lib/db/schema";

export type NotificationType =
  | "task_due"
  | "task_assigned"
  | "comment_added"
  | "project_deadline"
  | "task_completed"
  | "mention";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  source: "system" | "ai" | "user";
  metadata?: Record<string, string | number | boolean | null>;
};

const STORAGE_KEY = "mai.notifications.history.v1";
const EVENT_NAME = "mai:notifications:changed";

export function interpolateTemplate(
  template: string,
  variables: Record<string, unknown> = {}
) {
  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_m, key: string) => {
    const value = variables[key];
    return value === null || value === undefined ? "" : String(value);
  });
}

function getWindow() {
  return typeof window === "undefined" ? null : window;
}

export function getNotificationHistory(): AppNotification[] {
  const w = getWindow();
  if (!w) return [];

  try {
    const raw = w.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is AppNotification => Boolean(item && typeof item === "object"))
      .slice(0, 150);
  } catch {
    return [];
  }
}

function saveNotificationHistory(items: AppNotification[]) {
  const w = getWindow();
  if (!w) return;
  w.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 150)));
  w.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function subscribeNotifications(callback: () => void) {
  const w = getWindow();
  if (!w) return () => {};
  w.addEventListener(EVENT_NAME, callback as EventListener);
  return () => w.removeEventListener(EVENT_NAME, callback as EventListener);
}

export function clearNotifications() {
  saveNotificationHistory([]);
}

export function deleteNotification(id: string) {
  const next = getNotificationHistory().filter((item) => item.id !== id);
  saveNotificationHistory(next);
}

export function createNotification(input: {
  level: AppNotification["level"];
  message: string;
  title?: string;
  variables?: Record<string, unknown>;
  source?: AppNotification["source"];
  metadata?: AppNotification["metadata"];
}) {
  const levelTitle: Record<AppNotification["level"], string> = {
    info: "Information",
    success: "Succès",
    warning: "Avertissement",
    error: "Erreur",
  };

  const next: AppNotification = {
    id: crypto.randomUUID(),
    title: input.title ?? levelTitle[input.level],
    message: interpolateTemplate(input.message, input.variables),
    level: input.level,
    read: false,
    source: input.source ?? "system",
    metadata: input.metadata,
    createdAt: new Date().toISOString(),
  };

  saveNotificationHistory([next, ...getNotificationHistory()]);
  return next;
}

export function createAiResponseNotification(input: {
  phase: "started" | "completed" | "error" | "failed";
  chatId?: string;
  conversationTitle?: string;
  preview?: string;
  assistantMessageId?: string;
  modelId?: string;
  error?: string;
}) {
  if (input.phase === "started") {
    return createNotification({
      level: "info",
      title: "Réponse IA en cours",
      message: "La conversation « {{title}} » est en cours de génération.",
      variables: { title: input.conversationTitle ?? "Sans titre" },
      source: "ai",
      metadata: {
        chatId: input.chatId ?? null,
        phase: "started",
        modelId: input.modelId ?? null,
      },
    });
  }

  if (input.phase === "completed") {
    return createNotification({
      level: "success",
      title: "Réponse IA terminée",
      message: input.preview ?? "Une nouvelle réponse IA est disponible.",
      source: "ai",
      metadata: {
        chatId: input.chatId ?? null,
        assistantMessageId: input.assistantMessageId ?? null,
        phase: "completed",
        modelId: input.modelId ?? null,
      },
    });
  }

  return createNotification({
    level: "error",
    title: "Réponse IA en erreur",
    message:
      input.error ??
      `Une erreur est survenue sur la conversation « ${input.conversationTitle ?? "Sans titre"} ».`,
    source: "ai",
    metadata: {
      chatId: input.chatId ?? null,
      phase: "error",
      modelId: input.modelId ?? null,
    },
  });
}

export async function createUserNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  projectId?: string | null;
  taskId?: string | null;
}) {
  return createDbNotification(input);
}

export async function markNotificationRead(
  id: string,
  secondArg?: string | boolean
) {
  if (typeof secondArg === "boolean" || secondArg === undefined) {
    const next = getNotificationHistory().map((item) =>
      item.id === id ? { ...item, read: true } : item
    );
    saveNotificationHistory(next);
    return undefined;
  }

  return db
    .update(notification)
    .set({ isRead: true })
    .where(and(eq(notification.id, id), eq(notification.userId, secondArg)))
    .returning();
}

export async function markAllNotificationsRead(arg?: string | boolean) {
  if (typeof arg === "boolean" || arg === undefined) {
    const next = getNotificationHistory().map((item) => ({
      ...item,
      read: true,
    }));
    saveNotificationHistory(next);
    return undefined;
  }

  return db
    .update(notification)
    .set({ isRead: true })
    .where(eq(notification.userId, arg))
    .returning();
}

export async function runDueTaskReminderCheck() {
  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await db
    .select({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      projectId: task.projectId,
      ownerId: project.userId,
    })
    .from(task)
    .innerJoin(project, eq(task.projectId, project.id))
    .where(
      and(
        gte(task.dueDate, now),
        lte(task.dueDate, next24h),
        eq(task.status, "todo")
      )
    );

  for (const item of tasks) {
    const [existing] = await db
      .select({ id: notification.id })
      .from(notification)
      .where(
        and(
          eq(notification.userId, item.ownerId),
          eq(notification.taskId, item.id),
          eq(notification.type, "task_due")
        )
      )
      .limit(1);

    if (existing) continue;

    await createDbNotification({
      userId: item.ownerId,
      projectId: item.projectId,
      taskId: item.id,
      type: "task_due",
      title: "Tâche en échéance",
      message: `La tâche « ${item.title} » arrive à échéance sous 24h.`,
    });
  }
}
