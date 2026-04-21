import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

type CreditMetric = {
  key: string;
  limit: number;
  period: "hour" | "day" | "week" | "month";
  title: string;
  used: number;
};

type CreditsSectionProps = {
  className?: string;
  creditMetrics: CreditMetric[];
  formatDateTime: (date: Date) => string;
  getCreditBadgeColor: (remainingRatio: number) => string;
  getNextResetDate: (period: CreditMetric["period"]) => Date;
};

export function CreditsSection({
  className,
  creditMetrics,
  formatDateTime,
  getCreditBadgeColor,
  getNextResetDate,
}: CreditsSectionProps) {
  return (
    <section
      className={cn(
        "liquid-glass rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl",
        className
      )}
      id="credits"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Gauge className="size-5" />
        Crédits
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Suivi des crédits IA par tier, des fichiers, des images et de la musique.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {creditMetrics.map((metric) => {
          const isUnlimited = metric.limit < 0;
          const consumed = isUnlimited
            ? 0
            : Math.min(metric.used, metric.limit);
          const remaining = isUnlimited
            ? Number.POSITIVE_INFINITY
            : Math.max(metric.limit - consumed, 0);
          const remainingRatio =
            metric.limit <= 0 || !Number.isFinite(remaining)
              ? 1
              : remaining / metric.limit;
          const resetDate = formatDateTime(getNextResetDate(metric.period));

          return (
            <article
              className="rounded-xl border border-border/50 bg-background/60 p-4"
              key={metric.key}
            >
              <p className="text-sm font-semibold">{metric.title}</p>
              <p
                className={cn(
                  "mt-2 text-lg font-bold tabular-nums",
                  getCreditBadgeColor(remainingRatio)
                )}
              >
                {isUnlimited ? "Illimité" : `${remaining}/${metric.limit}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {isUnlimited
                  ? "Accès sans limite"
                  : `Consommé: ${consumed} • Réinitialisation: ${resetDate}`}
              </p>
            </article>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-border/50 bg-background/60 p-4">
        <h3 className="text-sm font-semibold">Infos</h3>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          Tier 1 : GPT-5.4, GPT-5.2, Claude Opus 4.6/4.7 et Mistral Large 3.
          Tier 2 : GPT-5.1, GPT-5, Claude Sonnet 4/4.6, DeepSeek 3.2, Kimi
          K2.5/K2.6 et les modèles AI Horde les plus coûteux. Tier 3 : modèles
          rapides/économiques (GPT-5.4 Mini/Nano, Claude Haïku 4.5 et AI Horde
          compacts). Les images Studio disposent aussi d&apos;un quota quotidien
          dédié selon le forfait.
        </p>
      </div>
    </section>
  );
}
