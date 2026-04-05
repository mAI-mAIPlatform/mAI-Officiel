"use client";

import {
  CalendarClock,
  CheckCircle2,
  Gauge,
  Info,
  KeyRound,
  PlusCircle,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { PlanUpgradeCTA } from "@/components/chat/plan-upgrade-cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { planDefinitions } from "@/lib/subscription";
import { getNextResetDate, getUsageCount } from "@/lib/usage-limits";
import { cn } from "@/lib/utils";

const planOrder = ["free", "plus", "pro", "max"] as const;
const TASKS_STORAGE_KEY = "mai.settings.automated-tasks.v017";
const schedulerModels = [
  "gpt-4.1",
  "gpt-4o-mini",
  "o4-mini",
  "claude-3.7",
] as const;
const schedulerFrequencies = [
  "quotidienne",
  "hebdomadaire",
  "mensuelle",
  "ponctuelle",
] as const;

type ScheduledTask = {
  createdAt: string;
  frequency: (typeof schedulerFrequencies)[number];
  id: string;
  model: (typeof schedulerModels)[number];
  nextRunAt: string;
  title: string;
};

type CreditMetric = {
  key: string;
  limit: number;
  period: "hour" | "day" | "week" | "month";
  title: string;
  used: number;
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getCreditBadgeColor(remainingRatio: number): string {
  if (remainingRatio > 0.4) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (remainingRatio > 0.3) {
    return "text-orange-500 dark:text-orange-300";
  }

  if (remainingRatio > 0.15) {
    return "text-rose-500 dark:text-rose-300";
  }

  return "text-rose-700 dark:text-rose-200";
}

function formatDateTimeLocalInput(now = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

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
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [tasksHydrated, setTasksHydrated] = useState(false);
  const [taskForm, setTaskForm] = useState<{
    frequency: ScheduledTask["frequency"];
    model: ScheduledTask["model"];
    nextRunAt: string;
    title: string;
  }>({
    frequency: "quotidienne",
    model: "gpt-4.1",
    nextRunAt: "",
    title: "",
  });

  const displayedPlans = useMemo(
    () => planOrder.map((planKey) => planDefinitions[planKey]),
    []
  );
  const maxScheduledTasks = currentPlanDefinition.limits.taskSchedules;

  useEffect(() => {
    try {
      const rawTasks = window.localStorage.getItem(TASKS_STORAGE_KEY);
      if (!rawTasks) {
        setTasksHydrated(true);
        return;
      }

      const parsed = JSON.parse(rawTasks) as ScheduledTask[];
      if (!Array.isArray(parsed)) {
        setTasksHydrated(true);
        return;
      }

      setTasks(parsed);
      setTasksHydrated(true);
    } catch {
      setTaskError(
        "Impossible de charger les tâches automatiques sauvegardées."
      );
      setTasksHydrated(true);
    }
  }, []);

  useEffect(() => {
    // Évite d'écraser le stockage avant la première lecture locale.
    if (!tasksHydrated) {
      return;
    }
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, tasksHydrated]);

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

  const handleCreateTask = () => {
    if (tasks.length >= maxScheduledTasks) {
      setTaskError(
        `Limite atteinte (${maxScheduledTasks} tâches) pour votre forfait ${currentPlanDefinition.label}.`
      );
      return;
    }

    if (!taskForm.title.trim()) {
      setTaskError("Ajoutez un titre avant de créer la tâche.");
      return;
    }

    if (!taskForm.nextRunAt) {
      setTaskError("Choisissez la date du prochain déclenchement.");
      return;
    }

    const taskDate = new Date(taskForm.nextRunAt);
    if (Number.isNaN(taskDate.getTime())) {
      setTaskError("Date invalide pour le programmateur.");
      return;
    }

    const nextTask: ScheduledTask = {
      createdAt: new Date().toISOString(),
      frequency: taskForm.frequency,
      id: crypto.randomUUID(),
      model: taskForm.model,
      nextRunAt: taskForm.nextRunAt,
      title: taskForm.title.trim(),
    };

    setTasks((prev) => [nextTask, ...prev]);
    setTaskForm((prev) => ({ ...prev, title: "" }));
    setTaskError(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const creditMetrics = useMemo<CreditMetric[]>(() => {
    if (!isHydrated) {
      return [];
    }

    // Le suivi existant est branché pour news/health/tâches; les autres limites
    // sont préparées pour une instrumentation progressive.
    return [
      {
        key: "messages",
        limit: currentPlanDefinition.limits.messagesPerHour,
        period: "hour",
        title: "Messages",
        used: 0,
      },
      {
        key: "coder",
        limit: currentPlanDefinition.limits.coderCredits,
        period: "month",
        title: "Crédits Coder",
        used: 0,
      },
      {
        key: "files",
        limit: currentPlanDefinition.limits.filesPerDay,
        period: "day",
        title: "Fichiers",
        used: 0,
      },
      {
        key: "quiz",
        limit:
          currentPlanDefinition.limits.quizPerDay === "illimites"
            ? 9999
            : currentPlanDefinition.limits.quizPerDay,
        period: "day",
        title: "Quiz",
        used: 0,
      },
      {
        key: "images",
        limit: currentPlanDefinition.limits.imagesPerWeek,
        period: "week",
        title: "Images",
        used: 0,
      },
      {
        key: "tasks",
        limit: currentPlanDefinition.limits.taskSchedules,
        period: "month",
        title: "Tâches planifiées",
        used: tasks.length,
      },
      {
        key: "news",
        limit: currentPlanDefinition.limits.newsSearchesPerDay,
        period: "day",
        title: "mAINews",
        used: getUsageCount("news", "day"),
      },
      {
        key: "health",
        limit: currentPlanDefinition.limits.healthRequestsPerMonth,
        period: "month",
        title: "mAIHealth",
        used: getUsageCount("health", "month"),
      },
    ];
  }, [currentPlanDefinition, isHydrated, tasks.length]);

  const totalCreditsOverview = useMemo(() => {
    if (creditMetrics.length === 0) {
      return { remaining: 0, total: 0 };
    }

    return creditMetrics.reduce(
      (acc, metric) => {
        const consumed = Math.min(metric.used, metric.limit);
        return {
          remaining: acc.remaining + (metric.limit - consumed),
          total: acc.total + metric.limit,
        };
      },
      { remaining: 0, total: 0 }
    );
  }, [creditMetrics]);

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <div className="flex items-center gap-3">
        <Settings2 className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">
          v0.1.8
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

      <section className="liquid-glass rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Gauge className="size-5" />
          Crédits & consommation globale
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Suivi de toutes les limites avec date de réinitialisation automatique
          selon la période de quota.
        </p>

        <div className="mt-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background/60 to-primary/5 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Crédits restants (toutes limites)
          </p>
          <p className="mt-2 text-2xl font-bold">
            {totalCreditsOverview.remaining}/{totalCreditsOverview.total}
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {creditMetrics.map((metric) => {
            const consumed = Math.min(metric.used, metric.limit);
            const remaining = Math.max(metric.limit - consumed, 0);
            const remainingRatio =
              metric.limit === 0 ? 0 : remaining / metric.limit;
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
                  {remaining}/{metric.limit}
                </p>
                <p className="text-xs text-muted-foreground">
                  Consommé: {consumed} • Réinitialisation: {resetDate}
                </p>
              </article>
            );
          })}
        </div>
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
              <li>• Tâches planifiées : {planItem.limits.taskSchedules}</li>
              <li>
                • mAINews : {planItem.limits.newsSearchesPerDay} recherches /
                jour
              </li>
              <li>
                • mAIHealth : {planItem.limits.healthRequestsPerMonth} requêtes
                / mois
              </li>
            </ul>
            <p className="mt-4 rounded-xl border border-dashed border-border/70 bg-background/65 p-3 text-xs text-muted-foreground">
              Code officiel requis (stocké côté serveur via variables
              d'environnement).
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarClock className="size-5" />
          Tâches — Programmateur de prompts automatiques
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Planifiez des prompts récurrents avec fréquence, date, titre et modèle
          IA. Quota : {tasks.length}/{maxScheduledTasks} tâche
          {maxScheduledTasks > 1 ? "s" : ""}.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input
            onChange={(event) =>
              setTaskForm((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Titre de la tâche (ex: Veille IA hebdomadaire)"
            value={taskForm.title}
          />
          <Input
            min={formatDateTimeLocalInput()}
            onChange={(event) =>
              setTaskForm((prev) => ({
                ...prev,
                nextRunAt: event.target.value,
              }))
            }
            type="datetime-local"
            value={taskForm.nextRunAt}
          />
          <select
            className="h-10 rounded-md border border-border/50 bg-background/80 px-3 text-sm"
            onChange={(event) =>
              setTaskForm((prev) => ({
                ...prev,
                frequency: event.target.value as ScheduledTask["frequency"],
              }))
            }
            value={taskForm.frequency}
          >
            {schedulerFrequencies.map((frequency) => (
              <option key={frequency} value={frequency}>
                {frequency}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-border/50 bg-background/80 px-3 text-sm"
            onChange={(event) =>
              setTaskForm((prev) => ({
                ...prev,
                model: event.target.value as ScheduledTask["model"],
              }))
            }
            value={taskForm.model}
          >
            {schedulerModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <Button className="mt-3" onClick={handleCreateTask} type="button">
          <PlusCircle className="mr-2 size-4" />
          Créer la tâche automatique
        </Button>

        {taskError && (
          <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
            {taskError}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {tasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">
              Aucune tâche planifiée. Créez votre premier programmateur
              automatique.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
                key={task.id}
              >
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-muted-foreground">
                    {task.frequency} • {task.model} • prochain lancement :{" "}
                    {new Date(task.nextRunAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => handleDeleteTask(task.id)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Trash2 className="mr-1 size-4" />
                  Supprimer
                </Button>
              </div>
            ))
          )}
        </div>
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
            Version 0.1.8 — Planification récurrente des tâches, quotas de
            tâches et régulation des flux mAINews/mAIHealth avec expérience
            Liquid Glass.
          </p>
        </div>
      </section>
    </div>
  );
}
