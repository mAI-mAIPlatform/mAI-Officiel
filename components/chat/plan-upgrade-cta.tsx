"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PlanKey } from "@/lib/subscription";
import { cn } from "@/lib/utils";

export function PlanUpgradeCTA({
  className,
  currentPlan,
  compact = false,
}: {
  className?: string;
  currentPlan: PlanKey;
  compact?: boolean;
}) {
  if (currentPlan === "max") {
    return null;
  }

  const label = currentPlan === "pro" ? "Obtenir Max" : "Obtenir Plus";

  return (
    <Button
      asChild
      className={cn(
        "group pointer-events-auto relative overflow-hidden rounded-full border border-primary/20 bg-white/30 text-primary backdrop-blur-xl shadow-[0_8px_25px_rgba(112,93,255,0.25)] hover:bg-white/45 dark:bg-primary/20 dark:text-primary-foreground/95",
        compact ? "h-10 px-5 text-sm" : "h-12 px-7 text-lg",
        className
      )}
      variant="ghost"
    >
      <Link href="/pricing">
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-white/30 to-primary/15 opacity-90" />
        <span className="relative flex items-center gap-2 font-semibold tracking-tight">
          <Sparkles className={cn(compact ? "size-4" : "size-5")} />
          {label}
        </span>
      </Link>
    </Button>
  );
}
