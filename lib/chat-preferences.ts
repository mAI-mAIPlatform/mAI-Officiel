export type TagDefinition = {
  id: string;
  name: string;
  color: string;
};

export type ShortcutAction = "newChat" | "likeMessage" | "dislikeMessage" | "copyMessage";

export type ShortcutConfig = Record<ShortcutAction, string>;

export const CHAT_TAGS_STORAGE_KEY = "mai.chat.tags.v1";
export const TAG_DEFINITIONS_STORAGE_KEY = "mai.tag.definitions.v1";
export const SHORTCUTS_STORAGE_KEY = "mai.shortcuts.v1";

export const TAG_PALETTE = [
  "#f87171", "#fb7185", "#f472b6", "#e879f9", "#c084fc", "#a78bfa",
  "#818cf8", "#6366f1", "#3b82f6", "#0ea5e9", "#06b6d4", "#14b8a6",
  "#10b981", "#22c55e", "#84cc16", "#eab308", "#f59e0b", "#f97316",
  "#ef4444", "#ec4899", "#8b5cf6", "#6366f1", "#2563eb", "#0891b2",
  "#0f766e", "#15803d", "#65a30d", "#a16207", "#b45309", "#92400e",
] as const;

export const defaultShortcuts: ShortcutConfig = {
  newChat: "ctrl+shift+o",
  likeMessage: "ctrl+shift+l",
  dislikeMessage: "ctrl+shift+d",
  copyMessage: "ctrl+shift+c",
};

export function normalizeShortcut(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "");
}

export function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function buildTagMap(chatTags: Record<string, string[]>) {
  return new Map(Object.entries(chatTags));
}
