"use client";

import {
  BadgeCheck,
  Brain,
  CheckCircle2,
  MessageCircle,
  Music2Icon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { getTierQuota } from "@/lib/ai/credits";
import { type PlanKey, planDefinitions } from "@/lib/subscription";
import { cn } from "@/lib/utils";

const planOrder: PlanKey[] = ["free", "plus", "pro", "max"];
const planRank: Record<PlanKey, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  max: 3,
};

const planPrices: Record<PlanKey, { amount: string; subtitle: string }> = {
  free: { amount: "0", subtitle: "EUR / mois" },
  plus: { amount: "7", subtitle: "EUR / mois" },
  pro: { amount: "15", subtitle: "EUR / mois" },
  max: { amount: "25", subtitle: "EUR / mois" },
};

const highlightsByPlan: Record<PlanKey, string[]> = {
  free: [
    "Crédits tiers inclus (quotas / jour)",
    "Idéal pour découvrir mAI",
    "Réflexion: Aucun ou Léger",
    "Jusqu'à 5 fichiers / jour",
    "7 images / jour",
    "2 musiques / semaine",
    "10 recherches web / jour",
  ],
  plus: [
    "Crédits tiers étendus (quotas / jour)",
    "IA plus confortable au quotidien",
    "Réflexion: Aucun ou Léger",
    "10 fichiers / jour",
    "15 images / jour",
    "5 musiques / semaine",
    "20 recherches web / jour",
  ],
  pro: [
    "Crédits tiers pro (quotas / jour)",
    "Pour usage intensif et projets multi-modules",
    "Réflexion: Aucun, Léger, Moyen",
    "20 fichiers / jour",
    "30 images / jour",
    "10 musiques / semaine",
    "Mémoire IA renforcée",
    "35 recherches web / jour",
  ],
  max: [
    "Crédits tiers max (quotas / jour)",
    "Pour équipes et usages professionnels continus",
    "Réflexion: Aucun, Léger, Moyen, Approfondi",
    "50 fichiers / jour",
    "75 images / jour",
    "20 musiques / semaine",
    "Capacité maximale mAI",
    "50 recherches web / jour",
  ],
};

export default function PricingPage() {
  const router = useRouter();
  const {
    currentPlanDefinition,
    isHydrated,
    plan,
  } = useSubscriptionPlan();
  const [recentlyUnlockedPlan, setRecentlyUnlockedPlan] =
    useState<PlanKey | null>(null);

  const plans = useMemo(() => planOrder.map((key) => planDefinitions[key]), []);

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-4 overflow-y-auto p-4 sm:gap-6 sm:p-6 md:p-10">
      <header className="rounded-2xl border border-border/50 bg-card/70 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <BadgeCheck className="size-7 text-primary" />
          <h1 className="text-3xl font-bold">Comparer les forfaits mAI</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Forfait actuel :{" "}
          <strong>
            {isHydrated ? currentPlanDefinition.label : "Chargement..."}
          </strong>
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((planItem) => {
          const price = planPrices[planItem.key];
          const isCurrent = planItem.key === plan;
          const canUpgrade =
            planItem.key !== "free" && planRank[planItem.key] > planRank[plan];

          return (
            <article
              className={cn(
                "liquid-glass rounded-3xl border p-4 shadow-sm backdrop-blur-xl sm:p-5",
                isCurrent
                  ? "border-primary/45 bg-primary/10"
                  : "border-border/50 bg-card/70",
                recentlyUnlockedPlan === planItem.key &&
                  "animate-pulse border-emerald-400/70 bg-emerald-500/10 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"
              )}
              key={planItem.key}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-bold sm:text-2xl">
                  {planItem.label.replace("mAI ", "")}
                </h2>
                {planItem.recommended && (
                  <Badge className="rounded-full bg-violet-500/90 text-white hover:bg-violet-500/90">
                    Populaire
                  </Badge>
                )}
              </div>

              <div className="mt-4 flex items-end gap-2">
                <p className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {price.amount}
                </p>
                <p className="pb-2 text-xs text-muted-foreground">
                  {price.subtitle}
                </p>
              </div>

              <ul className="mt-4 space-y-2 text-sm">
                {highlightsByPlan[planItem.key].map((item) => (
                  <li className="flex items-start gap-2" key={item}>
                    <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid grid-cols-1 gap-1 rounded-xl border border-border/50 bg-background/60 p-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <MessageCircle className="size-3.5" /> Tier 1:{" "}
                  {getTierQuota("tier1", planItem.key, true)}/jour
                </p>
                <p>Tier 2: {getTierQuota("tier2", planItem.key, true)}/jour</p>
                <p>Tier 3: {getTierQuota("tier3", planItem.key, true)}/jour</p>
                <p className="flex items-center gap-1">
                  <Brain className="size-3.5" /> Mémoire:{" "}
                  {planItem.limits.memoryUnits}
                </p>
                <p>Fichiers: {planItem.limits.filesPerDay}/jour</p>
                <p>Images Studio: {planItem.limits.studioImagesPerDay}/jour</p>
                <p className="flex items-center gap-1">
                  <Music2Icon className="size-3.5" /> Wave:{" "}
                  {planItem.limits.musicGenerationsPerWeek}/semaine
                </p>
                <p>Recherche web: {planItem.limits.webSearchesPerDay}/jour</p>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {isCurrent ? (
                  <Button className="w-full" disabled variant="secondary">
                    Votre forfait actuel
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    className="w-full"
                    onClick={() => {
                      router.push(`/pricing/chreckout?plan=${planItem.key}`);
                      setRecentlyUnlockedPlan(planItem.key);
                      window.setTimeout(() => setRecentlyUnlockedPlan(null), 2400);
                    }}
                  >
                    {planItem.key === "plus"
                      ? "Passer à Plus"
                      : planItem.key === "pro"
                        ? "Passer à Pro"
                      : `Passer à ${planItem.label}`}
                  </Button>
                ) : (
                  <Button className="w-full" disabled variant="outline">
                    Forfait inférieur
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {recentlyUnlockedPlan && (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          {Array.from({ length: 18 }).map((_, index) => (
            <span
              className="absolute rounded-full bg-primary/40 blur-[1px] animate-pulse"
              key={`unlock-fx-${index}`}
              style={{
                animationDelay: `${index * 70}ms`,
                height: `${6 + (index % 4) * 3}px`,
                left: `${(index * 17) % 100}%`,
                top: `${(index * 29) % 100}%`,
                width: `${6 + (index % 4) * 3}px`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
