import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CompteSectionProps = {
  children: ReactNode;
  className?: string;
};

export function CompteSection({ children, className }: CompteSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl",
        className
      )}
      id="compte"
    >
      <h2 className="text-lg font-semibold">Compte</h2>
      {children}
    </section>
  );
}
