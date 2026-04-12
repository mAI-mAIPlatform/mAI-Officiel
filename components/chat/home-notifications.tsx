"use client";

import { Bell, CheckCheck, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type AppNotification,
  clearNotifications,
  getNotificationHistory,
  markAllNotificationsRead,
  subscribeNotifications,
} from "@/lib/notifications";
import { Button } from "../ui/button";

export function HomeNotifications() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setItems(getNotificationHistory());
    return subscribeNotifications(() => setItems(getNotificationHistory()));
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );

  return (
    <div className="fixed top-3 right-3 z-40" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-label="Afficher les notifications"
        className="liquid-glass flex items-center gap-2 rounded-full border border-border/50 bg-card/80 px-3 py-2 shadow-[var(--shadow-float)] backdrop-blur-xl"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <Bell className="size-4" />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {unreadCount}
        </span>
        {isOpen ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </button>

      {isOpen && (
        <div className="liquid-glass mt-2 ml-auto w-[320px] rounded-2xl border border-border/50 bg-card/80 p-3 shadow-[var(--shadow-float)] backdrop-blur-xl">
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
