"use client";

import {
  Bell,
  Brain,
  CalendarClock,
  Camera,
  Database,
  FileText,
  Gauge,
  KeyRound,
  Mail,
  MessageCircle,
  PlusCircle,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import { planDefinitions } from "@/lib/subscription";
import { getNextResetDate, getUsageCount } from "@/lib/usage-limits";
import { cn } from "@/lib/utils";

const TASKS_STORAGE_KEY = "mai.settings.automated-tasks.v017";
const PROFILE_SETTINGS_STORAGE_KEY = "mai.profile.settings.v2";
const NOTIFICATIONS_SETTINGS_STORAGE_KEY = "mai.settings.notifications.v1";
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

type ProfileSettingsShape = {
  aiMemory: string;
  aiName: string;
  aiPersonality: string;
  avatarDataUrl?: string;
  avatarId: string;
  displayName: string;
  personalContext: string;
  profession: string;
  responseStyle: "concis" | "normal" | "allonge";
  projectDescription: string;
  projectIconColor: string;
  projectTitle: string;
  stylisticDirectives: string;
};

const defaultProfileSettings: ProfileSettingsShape = {
  aiMemory: "",
  aiName: "mAI",
  aiPersonality: "",
  avatarDataUrl: undefined,
  avatarId: "aurora",
  displayName: "",
  personalContext: "",
  profession: "",
  responseStyle: "normal",
  projectDescription: "",
  projectIconColor: "#60a5fa",
  projectTitle: "",
  stylisticDirectives: "",
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
  const [chatBarSize, setChatBarSize] = useState<
    "compact" | "standard" | "large"
  >("compact");
  const [profileName, setProfileName] = useState("");
  const [profileLogoDataUrl, setProfileLogoDataUrl] = useState<
    string | undefined
  >();
  const [profession, setProfession] = useState("");
  const [responseStyle, setResponseStyle] = useState<
    "concis" | "normal" | "allonge"
  >("normal");
  const [aiPersonality, setAiPersonality] = useState("");
  const [personalContext, setPersonalContext] = useState("");
  const [aiMemory, setAiMemory] = useState("");
  const [aiName, setAiName] = useState("mAI");
  const [notifications, setNotifications] = useState({
    projectUpdates: true,
    responseReady: true,
    scheduledTasks: true,
  });

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
    const savedProfile = window.localStorage.getItem(
      PROFILE_SETTINGS_STORAGE_KEY
    );
    if (!savedProfile) {
      setProfileName(defaultProfileSettings.displayName);
      setProfileLogoDataUrl(defaultProfileSettings.avatarDataUrl);
      setProfession(defaultProfileSettings.profession);
      setResponseStyle(defaultProfileSettings.responseStyle);
      setAiPersonality(defaultProfileSettings.aiPersonality);
      setPersonalContext(defaultProfileSettings.personalContext);
      setAiMemory(defaultProfileSettings.aiMemory);
      setAiName(defaultProfileSettings.aiName);
      return;
    }

    try {
      const parsed = JSON.parse(savedProfile) as Partial<ProfileSettingsShape>;
      setProfileName(parsed.displayName?.trim() ?? "");
      setProfileLogoDataUrl(parsed.avatarDataUrl);
      setProfession(parsed.profession ?? "");
      setResponseStyle(parsed.responseStyle ?? "normal");
      setAiPersonality(parsed.aiPersonality ?? "");
      setPersonalContext(parsed.personalContext ?? "");
      setAiMemory(parsed.aiMemory ?? "");
      setAiName(parsed.aiName ?? "mAI");
    } catch {
      // Ignore un éventuel JSON invalide pour ne pas bloquer l'écran.
      setProfileName(defaultProfileSettings.displayName);
      setProfileLogoDataUrl(defaultProfileSettings.avatarDataUrl);
      setProfession(defaultProfileSettings.profession);
      setResponseStyle(defaultProfileSettings.responseStyle);
      setAiPersonality(defaultProfileSettings.aiPersonality);
      setPersonalContext(defaultProfileSettings.personalContext);
      setAiMemory(defaultProfileSettings.aiMemory);
      setAiName(defaultProfileSettings.aiName);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    const savedProfile = window.localStorage.getItem(
      PROFILE_SETTINGS_STORAGE_KEY
    );
    try {
      const parsed = savedProfile
        ? (JSON.parse(savedProfile) as Record<string, unknown>)
        : {};
      const responseStyleDirective =
        responseStyle === "concis"
          ? "Répondre de façon concise."
          : responseStyle === "allonge"
            ? "Répondre de façon détaillée."
            : "Répondre de façon équilibrée.";
      const nextSettings: ProfileSettingsShape = {
        ...(defaultProfileSettings as unknown as Record<string, unknown>),
        ...(parsed as Record<string, unknown>),
        aiMemory,
        aiName: aiName.trim() || "mAI",
        aiPersonality,
        avatarDataUrl: profileLogoDataUrl,
        avatarId:
          typeof parsed.avatarId === "string" && parsed.avatarId.length > 0
            ? parsed.avatarId
            : defaultProfileSettings.avatarId,
        displayName: profileName.trim(),
        personalContext,
        profession,
        responseStyle,
        stylisticDirectives: responseStyleDirective,
        projectDescription:
          typeof parsed.projectDescription === "string"
            ? parsed.projectDescription
            : "",
        projectIconColor:
          typeof parsed.projectIconColor === "string"
            ? parsed.projectIconColor
            : "#60a5fa",
        projectTitle:
          typeof parsed.projectTitle === "string" ? parsed.projectTitle : "",
      };
      window.localStorage.setItem(
        PROFILE_SETTINGS_STORAGE_KEY,
        JSON.stringify(nextSettings)
      );
    } catch {
      // Si le stockage est corrompu, on le régénère proprement.
      window.localStorage.setItem(
        PROFILE_SETTINGS_STORAGE_KEY,
        JSON.stringify({
          ...defaultProfileSettings,
          aiMemory,
          aiName: aiName.trim() || "mAI",
          aiPersonality,
          avatarDataUrl: profileLogoDataUrl,
          displayName: profileName.trim(),
          personalContext,
          profession,
          responseStyle,
          stylisticDirectives:
            responseStyle === "concis"
              ? "Répondre de façon concise."
              : responseStyle === "allonge"
                ? "Répondre de façon détaillée."
                : "Répondre de façon équilibrée.",
        })
      );
    }
  }, [
    aiMemory,
    aiName,
    aiPersonality,
    isHydrated,
    personalContext,
    profession,
    profileLogoDataUrl,
    profileName,
    responseStyle,
  ]);

  useEffect(() => {
    const rawNotificationSettings = window.localStorage.getItem(
      NOTIFICATIONS_SETTINGS_STORAGE_KEY
    );
    if (!rawNotificationSettings) {
      return;
    }
    try {
      const parsed = JSON.parse(rawNotificationSettings) as Partial<
        typeof notifications
      >;
      setNotifications((prev) => ({ ...prev, ...parsed }));
    } catch {
      // Silence: on conserve les valeurs par défaut.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      NOTIFICATIONS_SETTINGS_STORAGE_KEY,
      JSON.stringify(notifications)
    );
  }, [notifications]);

  useEffect(() => {
    const storedChatBarSize = window.localStorage.getItem("mai.chatbar.size");
    if (
      storedChatBarSize === "compact" ||
      storedChatBarSize === "standard" ||
      storedChatBarSize === "large"
    ) {
      setChatBarSize(storedChatBarSize);
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

  const handleChatBarSizeChange = (size: "compact" | "standard" | "large") => {
    setChatBarSize(size);
    window.localStorage.setItem("mai.chatbar.size", size);
  };

  const handleProfileLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = () => {
      if (typeof fileReader.result === "string") {
        setProfileLogoDataUrl(fileReader.result);
      }
    };
    fileReader.readAsDataURL(selectedFile);
  };

  const handleNotificationToggle = (
    key: keyof typeof notifications,
    value: boolean
  ) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
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
          v0.2.0
        </span>
      </div>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-4 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Navigation rapide
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { href: "#modeles", label: "Modèles" },
            { href: "#compte", label: "Compte" },
            { href: "#notifications", label: "Notifications" },
            { href: "#personnalisation", label: "Personnalisation" },
            { href: "#donnees", label: "Données" },
          ].map((item) => (
            <a
              className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl"
        id="modeles"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Brain className="size-4 text-primary" />
          Modèles
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Les modèles sont optimisés selon vos usages : conversation, code,
          recherche, génération de documents et workflows outils.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            "GPT / Claude : polyvalence, raisonnement et qualité rédactionnelle.",
            "Modèles rapides : latence basse pour échanges courts.",
            "Modèles spécialisés : code, agents et automatisation.",
          ].map((modelHint) => (
            <div
              className="rounded-xl border border-border/50 bg-background/60 p-3 text-sm text-muted-foreground"
              key={modelHint}
            >
              {modelHint}
            </div>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl"
        id="compte"
      >
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

          {isHydrated && plan !== "max" && (
            <div className="mt-4 flex justify-center">
              <Button asChild className="rounded-full" variant="outline">
                <a href="/">Obtenir FORFAIT SUPÉRIEUR</a>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section
        className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl"
        id="notifications"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="size-4 text-primary" />
          Notifications
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choisissez les alertes que vous souhaitez recevoir dans l&apos;app.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {[
            {
              description: "Être alerté quand une réponse IA est prête.",
              key: "responseReady" as const,
              label: "Réponses",
            },
            {
              description: "Recevoir les rappels des tâches automatiques.",
              key: "scheduledTasks" as const,
              label: "Tâches",
            },
            {
              description: "Être notifié des mises à jour projets.",
              key: "projectUpdates" as const,
              label: "Projets",
            },
          ].map((notificationItem) => (
            <button
              className={cn(
                "rounded-xl border p-3 text-left text-sm transition-colors",
                notifications[notificationItem.key]
                  ? "border-primary/40 bg-primary/10"
                  : "border-border/50 bg-background/50"
              )}
              key={notificationItem.key}
              onClick={() =>
                handleNotificationToggle(
                  notificationItem.key,
                  !notifications[notificationItem.key]
                )
              }
              type="button"
            >
              <p className="font-medium">{notificationItem.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {notificationItem.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl"
        id="personnalisation"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <UserCircle2 className="size-4 text-primary" />
          Personnalisation
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Personnalisez l&apos;IA et vos informations pour adapter ses réponses.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-2">
            <div
              className="size-16 rounded-full border border-border/50 bg-cover bg-center shadow-sm"
              style={{
                backgroundImage: profileLogoDataUrl
                  ? `url(${profileLogoDataUrl})`
                  : "linear-gradient(135deg, oklch(0.72 0.19 248), oklch(0.66 0.15 168))",
              }}
            />
            <label
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-1 text-xs"
              htmlFor="profile-logo-input"
            >
              <Camera className="size-3.5" />
              Changer le logo
            </label>
            <input
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              id="profile-logo-input"
              onChange={handleProfileLogoUpload}
              type="file"
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="profile-name-input"
            >
              Nom de profil
            </label>
            <Input
              id="profile-name-input"
              maxLength={40}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Ex: Dr. Lemaire"
              value={profileName}
            />
            <p className="text-xs text-muted-foreground">
              Ce nom est utilisé dans les en-têtes et interactions
              personnalisées.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="ai-call-name"
            >
              Nom (comment l&apos;IA doit vous appeler)
            </label>
            <Input
              id="ai-call-name"
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Ex: Alex"
              value={profileName}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="profession"
            >
              Profession
            </label>
            <Input
              id="profession"
              onChange={(event) => setProfession(event.target.value)}
              placeholder="Ex: Product Designer"
              value={profession}
            />
          </div>
          <div className="space-y-2">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="response-style"
            >
              Style de réponse
            </label>
            <select
              className="h-10 w-full rounded-md border border-border/50 bg-background/80 px-3 text-sm"
              id="response-style"
              onChange={(event) =>
                setResponseStyle(event.target.value as typeof responseStyle)
              }
              value={responseStyle}
            >
              <option value="concis">Concis</option>
              <option value="normal">Normal</option>
              <option value="allonge">Allongé</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground" htmlFor="ai-name">
              Nom de l&apos;assistant IA
            </label>
            <Input
              id="ai-name"
              onChange={(event) => setAiName(event.target.value)}
              placeholder="Ex: mAI Copilot"
              value={aiName}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="personality"
            >
              Personnalité (champ libre)
            </label>
            <textarea
              className="min-h-24 w-full rounded-md border border-border/50 bg-background/80 p-3 text-sm outline-none"
              id="personality"
              onChange={(event) => setAiPersonality(event.target.value)}
              placeholder="Ex: Ton rassurant, structuré, orienté solution et pédagogie."
              value={aiPersonality}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="personal-context"
            >
              Informations personnelles (champ libre)
            </label>
            <textarea
              className="min-h-24 w-full rounded-md border border-border/50 bg-background/80 p-3 text-sm outline-none"
              id="personal-context"
              onChange={(event) => setPersonalContext(event.target.value)}
              placeholder="Ex: 34 ans, passionné de randonnée, préfère des plans d'action concrets."
              value={personalContext}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label
              className="text-xs text-muted-foreground"
              htmlFor="ai-memory"
            >
              Mémoire (ce que l&apos;IA doit retenir)
            </label>
            <textarea
              className="min-h-24 w-full rounded-md border border-border/50 bg-background/80 p-3 text-sm outline-none"
              id="ai-memory"
              onChange={(event) => setAiMemory(event.target.value)}
              placeholder="Ex: Je préfère des réponses avec checklist, deadlines et priorités."
              value={aiMemory}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <SlidersHorizontal className="size-4 text-primary" />
          Ergonomie de la barre de dialogue
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Définissez la hauteur par défaut de la barre de saisie. Le mode
          compact est désormais recommandé pour une interface plus dense.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {[
            { label: "Compacte", value: "compact" as const },
            { label: "Standard", value: "standard" as const },
            { label: "Confort", value: "large" as const },
          ].map((option) => (
            <Button
              className={cn(
                "justify-start rounded-xl border border-border/50 bg-background/40",
                chatBarSize === option.value &&
                  "border-primary/40 bg-primary/10 text-primary"
              )}
              key={option.value}
              onClick={() => handleChatBarSizeChange(option.value)}
              variant="ghost"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl"
        id="donnees"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Database className="size-4 text-primary" />
          Données
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Gérez vos données, vos identifiants de compte et vos accès premium.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <Button className="justify-start" type="button" variant="outline">
            <Mail className="mr-2 size-4" />
            Modifier l&apos;adresse mail
          </Button>
          <Button className="justify-start" type="button" variant="outline">
            <ShieldCheck className="mr-2 size-4" />
            Changer le mot de passe
          </Button>
          <Button asChild className="justify-start" variant="outline">
            <a download href="/api/export">
              <FileText className="mr-2 size-4" />
              Exporter mes données
            </a>
          </Button>
        </div>

        <h3 className="mt-6 text-base font-semibold">
          Activation Premium par code
        </h3>
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
              placeholder="Entrez votre code officiel"
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

      <section className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MessageCircle className="size-5" />
          Communauté & support
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Rejoignez le serveur Discord officiel pour poser vos questions,
          remonter des bugs et suivre les nouveautés.
        </p>
        <a
          className="mt-3 inline-flex rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
          href="https://discord.gg/fV7zwdGPpY"
          rel="noreferrer"
          target="_blank"
        >
          Ouvrir Discord mAI
        </a>
      </section>

      <footer className="rounded-2xl border border-border/50 bg-card/70 p-4 text-center text-xs text-muted-foreground backdrop-blur-xl">
        Version active : <strong>0.2.0</strong>
      </footer>
    </div>
  );
}
