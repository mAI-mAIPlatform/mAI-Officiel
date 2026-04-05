"use client";

import {
  CheckCircle2,
  Info,
  KeyRound,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { PlanUpgradeCTA } from "@/components/chat/plan-upgrade-cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { planDefinitions } from "@/lib/subscription";
import { cn } from "@/lib/utils";

const planOrder = ["free", "plus", "pro", "max"] as const;

export default function SettingsPage() {
  const { data } = useSession();
  const {
    activateByCode,
    currentPlanDefinition,
    isActivating,
    isHydrated,
    plan,
  } = useSubscriptionPlan();

  const [activationCode, setActivationCode] = useState("");
  const [activationMessage, setActivationMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const displayedPlans = useMemo(
    () => planOrder.map((planKey) => planDefinitions[planKey]),
    []
  );

  const handleActivation = async () => {
    const nextPlan = await activateByCode(activationCode);

    if (!nextPlan) {
      setActivationMessage({
        type: "error",
        text: "Code invalide. Utilisez un code officiel mAI (MAIPLUS26, MAIPRO26 ou MAIMAX26).",
      });
      return;
    }

    setActivationMessage({
      type: "success",
      text: `Activation réussie : vous êtes maintenant sur le forfait ${planDefinitions[nextPlan].label}.`,
    });
    setActivationCode("");
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <div className="flex items-center gap-3">
        <Settings2 className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">
          v0.1.4
        </span>
      </div>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <h2 className="text-lg font-semibold">Compte</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connecté en tant que : {data?.user?.email ?? "Invité"}
        </p>

        <div className="mt-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background/60 to-primary/5 p-4 shadow-sm backdrop-blur-xl">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Forfait actuel
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-primary/90 px-3 py-1 text-white hover:bg-primary/90">
              {isHydrated ? currentPlanDefinition.label : "Chargement..."}
            </Badge>
            {currentPlanDefinition.recommended && (
              <Badge className="rounded-full bg-violet-500/90 px-3 py-1 text-white hover:bg-violet-500/90">
                Recommandé
              </Badge>
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {isHydrated
              ? `${currentPlanDefinition.limits.messagesPerHour} messages/h • ${currentPlanDefinition.limits.coderCredits} crédits Coder • ${currentPlanDefinition.limits.imagesPerWeek} images/semaine`
              : "Chargement du forfait..."}
          </p>

          {isHydrated && (
            <div className="mt-4 flex justify-center">
              <PlanUpgradeCTA compact currentPlan={plan} />
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline">
            <a download href="/api/export">
              Exporter mes données
            </a>
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <h2 className="text-lg font-semibold">Activation Premium par code</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Aucune transaction financière directe n&apos;est traitée. Les forfaits
          premium sont débloqués uniquement via un code officiel.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full">
            <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              onChange={(event) => setActivationCode(event.target.value)}
              placeholder="Entrez votre code officiel (ex: MAIPRO26)"
              value={activationCode}
            />
          </div>
          <Button
            className="sm:w-fit"
            disabled={isActivating || activationCode.trim().length === 0}
            onClick={handleActivation}
            type="button"
          >
            {isActivating ? "Activation..." : "Activer le forfait"}
          </Button>
        </div>

        {activationMessage && (
          <p
            className={cn(
              "mt-3 text-sm",
              activationMessage.type === "success"
                ? "text-emerald-600"
                : "text-rose-600"
            )}
          >
            {activationMessage.text}
          </p>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {displayedPlans.map((planItem) => (
          <article
            className={cn(
              "rounded-3xl border p-5 shadow-sm backdrop-blur-xl transition-all",
              planItem.key === plan
                ? "border-primary/45 bg-primary/10"
                : "border-border/50 bg-card/70"
            )}
            key={planItem.key}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xl font-bold tracking-tight">
                {planItem.label}
              </h3>
              <div className="flex items-center gap-2">
                {planItem.recommended && (
                  <Badge className="rounded-full bg-violet-500/90 text-white hover:bg-violet-500/90">
                    Populaire
                  </Badge>
                )}
                {planItem.key === plan && (
                  <Badge className="rounded-full bg-emerald-500/90 text-white hover:bg-emerald-500/90">
                    <CheckCircle2 className="mr-1 size-3.5" /> Actuel
                  </Badge>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {planItem.key === "free"
                ? "Découvrez ce que l'IA peut faire"
                : "Bénéficiez d'une expérience complète"}
            </p>

            <ul className="mt-4 space-y-2 text-sm">
              <li>• {planItem.limits.filesPerDay} fichiers / jour</li>
              <li>
                • Taille max par fichier : {planItem.limits.maxFileSizeMb} Mo
              </li>
              <li>
                • Quiz :{" "}
                {planItem.limits.quizPerDay === "illimites"
                  ? "illimités"
                  : `${planItem.limits.quizPerDay} / jour`}
              </li>
              <li>• Mémoire : {planItem.limits.memoryUnits} unités</li>
              <li>• Messages : {planItem.limits.messagesPerHour} / heure</li>
              <li>• Crédits Coder : {planItem.limits.coderCredits}</li>
              <li>• Images : {planItem.limits.imagesPerWeek} / semaine</li>
            </ul>
            <p className="mt-4 rounded-xl border border-dashed border-border/70 bg-background/65 p-3 text-xs text-muted-foreground">
              Code officiel requis (stocké côté serveur via variables
              d'environnement).
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-4">
        <h2 className="mb-2 flex items-center gap-2 text-base font-semibold">
          <Info className="size-4" /> À propos
        </h2>
        <div className="rounded-xl border border-border/40 bg-background/60 p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="size-3.5" /> mAI Plateforme
          </p>
          <p className="mt-1">
            Version 0.1.4 — Module mAIHealth, sécurité renforcée, signalement
            violence/abus et expérience Liquid Glass.
          </p>
        </div>
      </section>
    </div>
  );
}
