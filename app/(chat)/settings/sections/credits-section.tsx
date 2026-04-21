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
        <div className="mt-2 space-y-4 text-xs leading-6 text-muted-foreground">
          <p>
            <strong>Tier 1 · Modèles Ultra-Lourds</strong> — GPT-5.4, GPT-5.2,
            GPT-OSS-120b, Claude Opus 4.7, Claude Opus 4.6, DeepSeek-R1,
            Mistral-Large-3, Mistral Large, Llama 3.3 70b, Nemotron 3 Super
            1220b, Behemoth-R1-123B-v2-w4a16.
            <br />
            Limites: Invité 2/j • Gratuit 10/j • mAI+ 25/j • Pro 50/j • Max
            75/j.
          </p>
          <p>
            <strong>Tier 2 · Modèles Équilibrés</strong> — GPT-5, GPT-5.1,
            GPT-OSS-20b, Claude Sonnet 4.6, Claude Sonnet 4, DeepSeek-V3.2,
            Gemma-4-31B-it, Mixtral:8x7b, Qwen 3.6 Plus, Qwen 3.6 Plus Preview,
            Qwen 3 Coder, Qwen 3 Next, Qwen3-30B-A3B-abliterated-erotic,
            Qwen3:14b, Kimi K2.6, Kimi-K2.5, Artemis-31B-v1b-Q4_K_M,
            Cydonia-24B-v4.3, Rocinante-XL-16B-v1a-Q4_K_M, Skyfall-31B-v4.1,
            WizzGPTv8.
            <br />
            Limites: Invité 5/j • Gratuit 30/j • mAI+ 100/j • Pro 250/j • Max
            500/j.
          </p>
          <p>
            <strong>Tier 3 · Modèles Légers</strong> — GPT-5.4 Mini, GPT-5.4
            Nano, Claude Haiku 4.5, Claude Haïku 3, Gemma2:9b,
            Ministral-3-8B-Instruct-2512, Qwen_Qwen3-0.6B-IQ4_XS, Llama3.1:8b,
            L3-8B-Stheno-v3.2, L3-Super-Nova-RP-8B, HY-MT1.5-1.8B,
            LFM2.5-1.2B-Instruct, mini-magnum-12b-v1.1,
            MN-12B-Mag-Mell-R1.Q5_K_M, pygmalion-2-7b.Q4_K_M.
            <br />
            Limites: Invité 15/j • Gratuit 100/j • mAI+ 500/j • Pro 1000/j •
            Max 2000/j.
          </p>
        </div>
      </div>
    </section>
  );
}
