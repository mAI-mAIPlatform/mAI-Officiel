"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast as sonnerToast } from "sonner";
import { createNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { CheckCircleFillIcon, WarningIcon } from "./icons";

const iconsByType: Record<"success" | "error" | "warning" | "info", ReactNode> =
  {
    success: <CheckCircleFillIcon />,
    error: <WarningIcon />,
    warning: <WarningIcon />,
    info: <CheckCircleFillIcon />,
  };

export function toast(props: Omit<ToastProps, "id">) {
  createNotification({
    level: props.type,
    message: props.description,
    source: "system",
  });
  return sonnerToast.custom((id) => (
    <Toast description={props.description} id={id} type={props.type} />
  ));
}

function Toast(props: ToastProps) {
  const { id, type, description } = props;

  const descriptionRef = useRef<HTMLDivElement>(null);
  const [multiLine, setMultiLine] = useState(false);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) {
      return;
    }

    const update = () => {
      const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
      const lines = Math.round(el.scrollHeight / lineHeight);
      setMultiLine(lines > 1);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex w-full justify-end">
      <div
        className={cn(
          "liquid-panel flex max-w-[min(356px,calc(100vw-1rem))] flex-row gap-3 rounded-lg border border-border/50 bg-card/90 p-3 shadow-[var(--shadow-float)]",
          multiLine ? "items-start" : "items-center"
        )}
        data-testid="toast"
        key={id}
      >
        <div
          className={cn(
            "data-[type=error]:text-red-600 data-[type=success]:text-green-600 data-[type=warning]:text-amber-600 data-[type=info]:text-sky-600",
            { "pt-1": multiLine }
          )}
          data-type={type}
        >
          {iconsByType[type]}
        </div>
        <div className="text-sm text-foreground" ref={descriptionRef}>
          {description}
        </div>
      </div>
    </div>
  );
}

type ToastProps = {
  id: string | number;
  type: "success" | "error" | "warning" | "info";
  description: string;
};
