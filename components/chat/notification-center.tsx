"use client";

import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Target,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type NotificationItem = {
  id: string;
  projectId: string | null;
  taskId: string | null;
  type:
    | "task_due"
    | "task_assigned"
    | "comment_added"
    | "project_deadline"
    | "task_completed"
    | "mention";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const iconMap = {
  task_due: Clock3,
  task_assigned: UserRoundPlus,
  comment_added: MessageCircle,
  project_deadline: Target,
  task_completed: CheckCircle2,
  mention: Bell,
} as const;

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = async () => {
    const response = await fetch("/api/notifications?limit=100&offset=0");
    if (!response.ok) return;
    const data = (await response.json()) as {
      items: NotificationItem[];
      unreadCount: number;
    };
    setItems(data.items);
    setUnreadCount(data.unreadCount);
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const key = format(new Date(item.createdAt), "yyyy-MM-dd");
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, NotificationItem[]>
    );
  }, [items]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST" });
    await load();
  };

  const markOneRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    await load();
  };

  return (
    <div className="fixed top-3 right-3 z-[96]">
      <button
        className="relative rounded-full border border-sidebar-border/45 bg-sidebar/90 p-2 text-sidebar-foreground shadow-sm backdrop-blur-md"
        onClick={() => setOpen((previous) => !previous)}
        type="button"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="liquid-panel mt-2 w-[360px] rounded-2xl border border-white/30 bg-white/85 p-3 text-black shadow-2xl backdrop-blur-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Notifications</p>
            <button className="text-xs underline" onClick={markAllRead} type="button">
              Tout marquer comme lu
            </button>
          </div>

          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {Object.entries(grouped).map(([day, notifications]) => (
              <div key={day}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-black/55">
                  {format(new Date(day), "EEEE d MMMM", { locale: fr })}
                </p>
                <div className="space-y-1.5">
                  {notifications.map((item) => {
                    const Icon = iconMap[item.type] ?? Bell;
                    const href = item.projectId
                      ? `/projects/${item.projectId}`
                      : "/projects";

                    return (
                      <div
                        className={`rounded-xl border p-2 ${
                          item.isRead ? "border-black/10 bg-white/70" : "border-cyan-300/50 bg-cyan-100/45"
                        }`}
                        key={item.id}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className="mt-0.5 size-4 text-black/65" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-black">{item.title}</p>
                            <p className="line-clamp-2 text-xs text-black/70">{item.message}</p>
                            <p className="mt-1 text-[11px] text-black/55">
                              {formatDistanceToNow(new Date(item.createdAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <Link className="text-xs underline" href={href}>
                                Ouvrir
                              </Link>
                              {!item.isRead ? (
                                <button
                                  className="inline-flex items-center gap-1 text-xs underline"
                                  onClick={() => markOneRead(item.id)}
                                  type="button"
                                >
                                  <CheckCheck className="size-3" /> Lu
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
