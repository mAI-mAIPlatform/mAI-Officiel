"use client";

import {
  Bell,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Ghost,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  clearNotifications,
  type AppNotification,
  getNotificationHistory,
  markAllNotificationsRead,
  subscribeNotifications,
} from "@/lib/notifications";
import { Button } from "../ui/button";

export function HomeNotifications() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isGhostModeEnabled, setIsGhostModeEnabled] = useState(false);

  useEffect(() => {
    setItems(getNotificationHistory());
    return subscribeNotifications(() => setItems(getNotificationHistory()));
  }, []);

  useEffect(() => {
    setIsGhostModeEnabled(localStorage.getItem("mai.ghost-mode") === "true");
  }, []);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );
  const hasUnread = unreadCount > 0;

  return (
    <div className="absolute top-3 right-3 z-30">
      <div className="flex items-center justify-end gap-1.5">
        <button
          aria-label="Activer le mode fantôme"
          className={`liquid-glass inline-flex size-8 items-center justify-center rounded-full border transition ${
            isGhostModeEnabled
              ? "border-purple-500/45 bg-purple-500/20 text-purple-100"
              : "border-border/50 bg-card/80 text-muted-foreground"
          }`}
          onClick={() => {
            const nextValue = !isGhostModeEnabled;
            setIsGhostModeEnabled(nextValue);
            localStorage.setItem("mai.ghost-mode", String(nextValue));
            window.dispatchEvent(
              new CustomEvent("mai:ghost-mode-changed", {
                detail: { enabled: nextValue },
              })
            );
          }}
          type="button"
        >
          <Ghost className="size-3.5" />
        </button>

        <button
          aria-expanded={isOpen}
          aria-label="Ouvrir les notifications"
          className="liquid-glass relative inline-flex h-8 items-center gap-1 rounded-full border border-border/50 bg-card/80 px-2 shadow-[var(--shadow-float)] backdrop-blur-xl"
          onClick={() => setIsOpen((prev) => !prev)}
          type="button"
        >
          <Bell className="size-3.5" />
          {hasUnread && (
            <span className="-top-0.5 -right-0.5 absolute size-2 rounded-full bg-rose-500" />
          )}
          {isOpen ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="liquid-glass mt-2 w-[320px] rounded-2xl border border-border/50 bg-card/80 p-3 shadow-[var(--shadow-float)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-semibold">
              Notifications
            </p>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => markAllNotificationsRead(true)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <CheckCheck className="size-4" />
              </Button>
              <Button
                onClick={clearNotifications}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {items[0]?.message ?? "Aucune notification."}
          </p>
        </div>
      )}
    </div>
  );
}
