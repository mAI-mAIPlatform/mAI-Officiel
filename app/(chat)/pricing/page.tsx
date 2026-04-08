"use client";

import {
  BadgeCheck,
  Brain,
  CheckCircle2,
  Image,
  MessageCircle,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
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
  plus: { amount: "23", subtitle: "EUR / mois" },
  pro: { amount: "49", subtitle: "EUR / mois" },
  max: { amount: "89", subtitle: "EUR / mois" },
};

const highlightsByPlan: Record<PlanKey, string[]> = {
  free: [
    "20 crédits unifiés / semaine sur tout l'écosystème",
    "Obtenez des explications simples",
    "Discutez brièvement pour des besoins courants",
    "Essayez la génération d'images",
    "Mémoire et contexte limités",
  ],
  plus: [
    "35 crédits unifiés / semaine",
    "Résolvez des problèmes complexes",
    "Discutez plus longtemps dans différentes sessions",
    "Créez plus d'images, plus vite",
    "Mémorisez objectifs et conversations",
    "Planifiez des tâches récurrentes",
  ],
  pro: [
    "50 crédits unifiés / semaine",
    "Analyses avancées multi-outils",
    "Capacités étendues pour Coder et Studio",
    "Volume de messages et fichiers élevé",
    "Exécution fluide pour équipes projet",
  ],
  max: [
    "75 crédits unifiés / semaine",
    "Capacité maximale sur tous les modules mAI",
    "Priorité sur les flux intensifs",
    "Crédits extensions unifiés majorés pour tous les modules",
    "Conçu pour usage professionnel continu",
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

  const [selectedTargetPlan, setSelectedTargetPlan] =
    useState<Exclude<PlanKey, "free">>("plus");
  const [activationCode, setActivationCode] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const activationSectionRef = useRef<HTMLElement | null>(null);

  const plans = useMemo(() => planOrder.map((key) => planDefinitions[key]), []);
  const comparativeRows = [
    {
      label: "Messages / heure",
      getValue: (key: PlanKey) =>
        `${planDefinitions[key].limits.messagesPerHour}`,
    },
    {
      label: "Crédits extensions / semaine",
      getValue: (key: PlanKey) =>
        `${planDefinitions[key].limits.unifiedCreditsPerWeek}`,
    },
    {
      label: "Images / semaine",
      getValue: (key: PlanKey) =>
        `${planDefinitions[key].limits.imagesPerWeek}`,
    },
    {
      label: "Mémoire IA (entrées)",
      getValue: (key: PlanKey) => `${planDefinitions[key].limits.memoryUnits}`,
    },
    {
      label: "Fichiers / jour",
      getValue: (key: PlanKey) => `${planDefinitions[key].limits.filesPerDay}`,
    },
    {
      label: "Tâches planifiées",
      getValue: (key: PlanKey) =>
        `${planDefinitions[key].limits.taskSchedules}`,
    },
  ] as const;

  const handleActivate = async () => {
    const nextPlan = await activateByCode(activationCode);

    if (!nextPlan) {
      setMessage({
        text: `Code invalide pour ${planDefinitions[selectedTargetPlan].label}. Vérifiez votre code officiel.`,
        type: "error",
      });
      return;
    }

    setMessage({
      text: `Activation réussie : votre forfait est maintenant ${planDefinitions[nextPlan].label}.`,
      type: "success",
    });
    setActivationCode("");
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <header className="rounded-2xl border border-border/50 bg-card/70 p-6 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <BadgeCheck className="size-7 text-primary" />
          <h1 className="text-3xl font-bold">Comparer les forfaits mAI</h1>
          <Badge className="rounded-full bg-primary/90 text-white hover:bg-primary/90">
            v0.7.3
          </Badge>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Comparez les forfaits, puis cliquez sur{" "}
          <strong>Passer à mAI Plus</strong>, <strong>Passer à mAI Pro</strong>{" "}
          ou <strong>Passer à mAI Max</strong> pour entrer votre code officiel.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Forfait actuel :{" "}
          <strong>
            {isHydrated ? currentPlanDefinition.label : "Chargement..."}
          </strong>
        </p>
      </header>

      <section className="liquid-glass rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <h2 className="text-base font-semibold">Vue comparative rapide</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tableau synthétique pour comparer les capacités clés en un coup
          d&apos;œil.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
          <table className="min-w-full text-sm">
            <thead className="bg-background/70 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Capacité</th>
                {planOrder.map((planKey) => (
                  <th
                    className="px-4 py-3 font-semibold"
                    key={`head-${planKey}`}
                  >
                    {planDefinitions[planKey].label.replace("mAI ", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparativeRows.map((row) => (
                <tr className="border-t border-border/50" key={row.label}>
                  <td className="px-4 py-3 text-foreground">{row.label}</td>
                  {planOrder.map((planKey) => (
                    <td
                      className="px-4 py-3 text-muted-foreground"
                      key={`${row.label}-${planKey}`}
                    >
                      {row.getValue(planKey)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {plans.map((planItem) => {
          const price = planPrices[planItem.key];
          const isCurrent = planItem.key === plan;
          // Empêche l'UI de proposer un downgrade comme "upgrade".
          const canUpgrade =
            planItem.key !== "free" && planRank[planItem.key] > planRank[plan];

          return (
            <article
              className={cn(
                "rounded-3xl border p-6 shadow-sm backdrop-blur-xl transition-all",
                isCurrent
                  ? "border-primary/45 bg-primary/10"
                  : "border-border/50 bg-card/70"
              )}
              key={planItem.key}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-3xl font-bold">
                  {planItem.label.replace("mAI ", "")}
                </h2>
                {planItem.recommended && (
                  <Badge className="rounded-full bg-violet-500/90 text-white hover:bg-violet-500/90">
                    Populaire
                  </Badge>
                )}
              </div>

              <div className="mt-5 flex items-end gap-3">
                <p className="text-6xl font-bold tracking-tight">
                  {price.amount}
                </p>
                <p className="pb-2 text-muted-foreground">{price.subtitle}</p>
              </div>

              <p className="mt-4 text-lg font-semibold">
                {planItem.key === "free"
                  ? "Découvrez ce que l’IA peut faire"
                  : "Bénéficiez d’une expérience complète"}
              </p>

              <div className="mt-5">
                {isCurrent ? (
                  <Button className="w-full" disabled variant="secondary">
                    Votre forfait actuel
                  </Button>
                ) : canUpgrade ? (
                  <Button
                    className="w-full"
                    onClick={() => {
                      // Le clic "Passer à..." sélectionne le forfait et amène
                      // directement l'utilisateur vers la zone d'activation.
                      setSelectedTargetPlan(
                        planItem.key as Exclude<PlanKey, "free">
                      );
                      activationSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    {planItem.key === "plus"
                      ? "Passer à mAI Plus"
                      : `Passer à ${planItem.label}`}
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline">
                    Revenir à mAI Free
                  </Button>
                )}
              </div>

              <ul className="mt-5 space-y-2 text-sm">
                {highlightsByPlan[planItem.key].map((item) => (
                  <li className="flex items-start gap-2" key={item}>
                    <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-background/60 p-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1">
                  <MessageCircle className="size-3.5" />{" "}
                  {planItem.limits.messagesPerHour}
                  /h
                </p>
                <p className="flex items-center gap-1">
                  <Wand2 className="size-3.5" />{" "}
                  {planItem.limits.unifiedCreditsPerWeek} crédits/sem
                </p>
                <p className="flex items-center gap-1">
                  <Image className="size-3.5" /> {planItem.limits.imagesPerWeek}
                  /sem
                </p>
                <p className="flex items-center gap-1">
                  <Brain className="size-3.5" /> {planItem.limits.memoryUnits}{" "}
                  mémoire
                </p>
                <p>Fichiers: {planItem.limits.filesPerDay}/jour</p>
                <p>Tâches: {planItem.limits.taskSchedules}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section
        className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl"
        ref={activationSectionRef}
      >
        <h3 className="text-lg font-semibold">Activation par code officiel</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Forfait ciblé:{" "}
          <strong>{planDefinitions[selectedTargetPlan].label}</strong>.
          Saisissez votre code officiel reçu via les canaux mAI.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input
            onChange={(event) => setActivationCode(event.target.value)}
            placeholder={`Entrez votre code ${planDefinitions[selectedTargetPlan].label}`}
            value={activationCode}
          />
          <Button
            disabled={
              !isHydrated || isActivating || activationCode.trim().length === 0
            }
            onClick={handleActivate}
          >
            {isActivating
              ? "Activation..."
              : `Activer ${planDefinitions[selectedTargetPlan].label}`}
          </Button>
        </div>

        {message && (
          <p
            className={cn(
              "mt-3 text-sm",
              message.type === "success" ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {message.text}
          </p>
        )}
      </section>

      <footer className="rounded-2xl border border-border/50 bg-card/70 p-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Sparkles className="size-3.5" /> Interface modernisée: cartes
          lisibles, transitions fluides et activation instantanée.
        </p>
      </footer>
    </div>
  );
}
