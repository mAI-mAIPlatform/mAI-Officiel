"use client";

import { Bell, CheckCheck, Copy, Ghost, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type AppNotification,
  clearNotifications,
  deleteNotification,
  getNotificationHistory,
  markNotificationRead,
  subscribeNotifications,
} from "@/lib/notifications";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const GHOST_MODE_STORAGE_KEY = "mai.ghost-mode";
const GHOST_MODE_UPDATED_EVENT = "mai:ghost-mode-updated";

export function VoiceTopActions({
  chatId: _chatId,
  messages: _messages,
}: {
  chatId: string;
  messages: ChatMessage[];
}) {
  const [isGhostModeEnabled, setIsGhostModeEnabled] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState<
    string | null
  >(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncGhostState = () => {
      setIsGhostModeEnabled(
        window.localStorage.getItem(GHOST_MODE_STORAGE_KEY) === "true"
      );
    };

    syncGhostState();
    window.addEventListener("storage", syncGhostState);
    window.addEventListener("focus", syncGhostState);
    window.addEventListener(GHOST_MODE_UPDATED_EVENT, syncGhostState);

    return () => {
      window.removeEventListener("storage", syncGhostState);
      window.removeEventListener("focus", syncGhostState);
      window.removeEventListener(GHOST_MODE_UPDATED_EVENT, syncGhostState);
    };
  }, []);

  useEffect(() => {
    setNotifications(getNotificationHistory());
    return subscribeNotifications(() =>
      setNotifications(getNotificationHistory())
    );
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );
  const activeNotification = useMemo(
    () =>
      notifications.find(
        (notification) => notification.id === activeNotificationId
      ) ??
      notifications[0] ??
      null,
    [activeNotificationId, notifications]
  );

  return (
    <div
      className="pointer-events-none fixed top-3 right-3 z-40 flex items-center gap-2"
      ref={containerRef}
    >
      <button
        aria-label="Mode Fantôme"
        className={cn(
          "pointer-events-auto liquid-glass inline-flex items-center justify-center rounded-full border p-2 text-[11px] shadow-[var(--shadow-float)] transition",
          isGhostModeEnabled
            ? "border-purple-500/40 bg-purple-500/20 text-purple-100"
            : "border-border/40 bg-card/70 text-muted-foreground hover:border-border/70"
        )}
        onClick={() => {
          const nextValue = !isGhostModeEnabled;
          setIsGhostModeEnabled(nextValue);
          localStorage.setItem(GHOST_MODE_STORAGE_KEY, String(nextValue));
          window.dispatchEvent(new Event(GHOST_MODE_UPDATED_EVENT));
        }}
        type="button"
      >
        <Ghost className="size-4" />
      </button>
      <button
        aria-expanded={isNotificationsOpen}
        aria-label="Notifications"
        className="pointer-events-auto relative liquid-glass inline-flex items-center justify-center rounded-full border border-border/40 bg-card/70 p-2 text-muted-foreground shadow-[var(--shadow-float)] transition hover:border-border/70"
        onClick={() => setIsNotificationsOpen((prev) => !prev)}
        type="button"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
            {Math.min(99, unreadCount)}
          </span>
        ) : null}
      </button>
      {isNotificationsOpen && (
        <div className="pointer-events-auto absolute top-11 right-0 w-[340px] rounded-2xl border border-border/60 bg-card/90 p-3 text-xs shadow-[var(--shadow-float)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Notifications</p>
            <button
              className="rounded-md border border-border/50 px-2 py-1 text-[11px] text-muted-foreground transition hover:text-foreground"
              onClick={() => {
                clearNotifications();
                setActiveNotificationId(null);
              }}
              type="button"
            >
              Tout supprimer
            </button>
          </div>

          <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 px-2 py-3 text-center text-muted-foreground">
                Aucune notification pour le moment.
              </p>
            ) : (
              notifications.map((item) => (
                <button
                  className={cn(
                    "w-full rounded-lg border px-2 py-1.5 text-left transition",
                    activeNotification?.id === item.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-border/50 bg-background/60",
                    !item.read && "ring-1 ring-primary/30"
                  )}
                  key={item.id}
                  onClick={() => setActiveNotificationId(item.id)}
                  type="button"
                >
                  <p className="line-clamp-1 text-[11px] font-medium">
                    {item.title}
                  </p>
                  <p className="line-clamp-2 text-[11px] text-muted-foreground">
                    {item.message}
                  </p>
                </button>
              ))
            )}
          </div>

          {activeNotification && (
            <div className="mt-3 rounded-xl border border-border/60 bg-background/55 p-2">
              <p className="text-[11px] font-medium">
                {activeNotification.title}
              </p>
              <p className="mt-1 line-clamp-3 text-[11px] text-muted-foreground">
                {activeNotification.message}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1">
                <button
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[11px] transition hover:bg-background/70"
                  onClick={() =>
                    navigator.clipboard.writeText(activeNotification.message)
                  }
                  type="button"
                >
                  <Copy className="size-3.5" /> Copier
                </button>
                <button
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-border/60 px-2 py-1 text-[11px] transition hover:bg-background/70"
                  onClick={() =>
                    markNotificationRead(
                      activeNotification.id,
                      !activeNotification.read
                    )
                  }
                  type="button"
                >
                  <CheckCheck className="size-3.5" />
                  {activeNotification.read ? "Marquer non lu" : "Marquer lu"}
                </button>
                <button
                  className="col-span-2 inline-flex items-center justify-center gap-1 rounded-md border border-rose-400/40 px-2 py-1 text-[11px] text-rose-600 transition hover:bg-rose-500/10"
                  onClick={() => {
                    deleteNotification(activeNotification.id);
                    setActiveNotificationId(null);
                  }}
                  type="button"
                >
                  <Trash2 className="size-3.5" /> Supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
