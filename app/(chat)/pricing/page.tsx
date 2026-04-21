"use client";

import {
  BadgeCheck,
  Brain,
  CheckCircle2,
  MessageCircle,
  Music2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    "Quiz illimités",
    "Jusqu'à 5 fichiers / jour",
    "7 images Studio / jour",
    "2 générations Wave / semaine",
    "10 recherches web / jour",
  ],
  plus: [
    "Crédits tiers étendus (quotas / jour)",
    "IA plus confortable au quotidien",
    "Réflexion: Aucun ou Léger",
    "10 fichiers / jour",
    "15 images Studio / jour",
    "5 générations Wave / semaine",
    "Tâches planifiées avancées",
    "20 recherches web / jour",
  ],
  pro: [
    "Crédits tiers pro (quotas / jour)",
    "Pour usage intensif et projets multi-modules",
    "Réflexion: Aucun, Léger, Moyen",
    "20 fichiers / jour",
    "30 images Studio / jour",
    "10 générations Wave / semaine",
    "Mémoire IA renforcée",
    "35 recherches web / jour",
  ],
  max: [
    "Crédits tiers max (quotas / jour)",
    "Pour équipes et usages professionnels continus",
    "Réflexion: Aucun, Léger, Moyen, Approfondi",
    "50 fichiers / jour",
    "75 images Studio / jour",
    "20 générations Wave / semaine",
    "Capacité maximale mAI",
    "50 recherches web / jour",
  ],
};

export default function PricingPage() {
  const {
    activateByCode,
    currentPlanDefinition,
    isActivating,
    isHydrated,
    plan,
  } = useSubscriptionPlan();

  const [activationCode, setActivationCode] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [activatePlan, setActivatePlan] = useState<Exclude<
    PlanKey,
    "free"
  > | null>(null);
  const [recentlyUnlockedPlan, setRecentlyUnlockedPlan] =
    useState<PlanKey | null>(null);

  const plans = useMemo(() => planOrder.map((key) => planDefinitions[key]), []);

  const handleActivate = async () => {
    if (!activatePlan) {
      return;
    }

    const nextPlan = await activateByCode(activationCode);

    if (!nextPlan) {
      setMessage({
        text: `Code invalide pour ${planDefinitions[activatePlan].label}. Vérifiez votre code officiel.`,
        type: "error",
      });
      return;
    }

    setMessage({
      text: `Activation réussie : votre forfait est maintenant ${planDefinitions[nextPlan].label}.`,
      type: "success",
    });
    setRecentlyUnlockedPlan(nextPlan);
    window.setTimeout(() => setRecentlyUnlockedPlan(null), 2400);
    setActivationCode("");
    setActivatePlan(null);
  };

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
                <p>Tâches planifiées: {planItem.limits.taskSchedules}</p>
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
                      setActivatePlan(planItem.key as Exclude<PlanKey, "free">);
                      setMessage(null);
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

      {activatePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-white p-5 text-black shadow-2xl">
            <h3 className="text-lg font-semibold">
              Activer {planDefinitions[activatePlan].label}
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Entrez votre code officiel pour débloquer le forfait.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input
                onChange={(event) => setActivationCode(event.target.value)}
                placeholder={`Code ${planDefinitions[activatePlan].label}`}
                value={activationCode}
              />
              <Button
                disabled={
                  !isHydrated ||
                  isActivating ||
                  activationCode.trim().length === 0
                }
                onClick={handleActivate}
                type="button"
              >
                {isActivating ? "Activation..." : "Activer"}
              </Button>
            </div>
            {message && (
              <p
                className={cn(
                  "mt-3 text-sm",
                  message.type === "success"
                    ? "text-emerald-600"
                    : "text-rose-600"
                )}
              >
                {message.text}
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setActivatePlan(null)}
                type="button"
                variant="outline"
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
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
