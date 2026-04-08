"use client";

import {
  Bell,
  CalendarClock,
  Camera,
  Clock3,
  Database,
  FileText,
  Gauge,
  KeyRound,
  ListPlus,
  Lock,
  Mail,
  MessageCircle,
  PencilLine,
  PlusCircle,
  Puzzle,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  TimerReset,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
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
const PARENTAL_SETTINGS_STORAGE_KEY = "mai.settings.parental.v1";
const APP_VERSION = "0.7.3";
const MAX_MEMORY_ENTRY_LENGTH = 500;
const ABSOLUTE_MAX_MEMORY_ENTRIES = 200;
const schedulerModels = [
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4o-mini",
  "o4-mini",
  "gpt-5.4-mini",
  "gpt-5.4-nano",
  "gemini-2.5-pro",
  "gemini-3-pro-preview",
  "gemini-3.1-pro-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "claude-3.7-sonnet",
  "mistral-small-latest",
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
  aiMemoryEntries?: string[];
  aiBehavior?: {
    concision: number;
    register: number;
    tone: number;
  };
  aiName: string;
  aiPersonality: string;
  avatarDataUrl?: string;
  avatarId: string;
  displayName: string;
  personalContext: string;
  profession: string;
  projectDescription: string;
  projectIconColor: string;
  projectTitle: string;
  stylisticDirectives: string;
};

type MemorySortMode = "manual" | "alpha";

type ExtensionKey = "coder" | "manalyse" | "news" | "studio";

type ParentalSettings = {
  advancedSettingsLocked: boolean;
  dailyLimitMinutes: number;
  enabled: boolean;
  extensions: Record<ExtensionKey, boolean>;
  lockCodeHash: string;
  sessionUnlockedUntil: number;
  usageMinutes: number;
};

const defaultParentalSettings: ParentalSettings = {
  advancedSettingsLocked: true,
  dailyLimitMinutes: 90,
  enabled: false,
  extensions: {
    coder: true,
    manalyse: true,
    news: true,
    studio: true,
  },
  lockCodeHash: "",
  sessionUnlockedUntil: 0,
  usageMinutes: 0,
};

const extensionLabels: Record<ExtensionKey, string> = {
  coder: "mAICoder",
  manalyse: "mAnalyse",
  news: "mAINews",
  studio: "Studio",
};

function hashLockCode(code: string): string {
  let hash = 5381;
  for (let index = 0; index < code.length; index += 1) {
    hash = (hash * 33) ^ code.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
}

const defaultProfileSettings: ProfileSettingsShape = {
  aiMemory: "",
  aiName: "mAI",
  aiPersonality: "",
  avatarDataUrl: undefined,
  avatarId: "aurora",
  displayName: "",
  personalContext: "",
  profession: "",
  projectDescription: "",
  projectIconColor: "#60a5fa",
  projectTitle: "",
  stylisticDirectives: "",
};

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

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

function getMemoryEntriesLimitForPlan(planKey: string): number {
  if (planKey === "free") {
    return 50;
  }
  if (planKey === "plus") {
    return 75;
  }
  if (planKey === "pro") {
    return 100;
  }
  return 200;
}

function sanitizeMemoryEntries(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((value): value is string => typeof value === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => entry.slice(0, MAX_MEMORY_ENTRY_LENGTH))
    .slice(0, ABSOLUTE_MAX_MEMORY_ENTRIES);
}

function sanitizeScheduledTasks(input: unknown): ScheduledTask[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((task): task is Partial<ScheduledTask> => {
      if (!task || typeof task !== "object") {
        return false;
      }

      return true;
    })
    .filter(
      (task): task is ScheduledTask =>
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.createdAt === "string" &&
        typeof task.nextRunAt === "string" &&
        schedulerFrequencies.includes(
          task.frequency as ScheduledTask["frequency"]
        ) &&
        schedulerModels.includes(task.model as ScheduledTask["model"])
    )
    .map((task) => ({
      ...task,
      title: task.title.trim(),
    }))
    .filter((task) => task.title.length > 0);
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
  const [aiBehavior, setAiBehavior] = useState({
    concision: 50,
    register: 50,
    tone: 50,
  });
  const [aiPersonality, setAiPersonality] = useState("");
  const [personalContext, setPersonalContext] = useState("");
  const [aiMemoryEntries, setAiMemoryEntries] = useState<string[]>([]);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [memoryEditingIndex, setMemoryEditingIndex] = useState<number | null>(
    null
  );
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [memorySortMode, setMemorySortMode] =
    useState<MemorySortMode>("manual");
  const manualMemoryOrderRef = useRef<string[]>([]);
  const [aiName, setAiName] = useState("mAI");
  const [activeSettingsSection, setActiveSettingsSection] = useState("compte");
  const [notifications, setNotifications] = useState({
    projectUpdates: true,
    responseReady: true,
    scheduledTasks: true,
  });
  const [parentalSettings, setParentalSettings] = useState<ParentalSettings>(
    defaultParentalSettings
  );
  const [newLockCode, setNewLockCode] = useState("");
  const [confirmLockCode, setConfirmLockCode] = useState("");
  const [unlockCode, setUnlockCode] = useState("");
  const [parentalFeedback, setParentalFeedback] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  const maxScheduledTasks = currentPlanDefinition.limits.taskSchedules;
  const maxMemoryEntries = getMemoryEntriesLimitForPlan(plan);

  useEffect(() => {
    try {
      const rawTasks = window.localStorage.getItem(TASKS_STORAGE_KEY);
      if (!rawTasks) {
        setTasksHydrated(true);
        return;
      }

      const parsed = JSON.parse(rawTasks) as unknown;
      const sanitizedTasks = sanitizeScheduledTasks(parsed);
      if (sanitizedTasks.length === 0) {
        setTasksHydrated(true);
        return;
      }

      setTasks(sanitizedTasks);
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
      setAiBehavior({ concision: 50, register: 50, tone: 50 });
      setAiPersonality(defaultProfileSettings.aiPersonality);
      setPersonalContext(defaultProfileSettings.personalContext);
      setAiMemoryEntries([]);
      setAiName(defaultProfileSettings.aiName);
      return;
    }

    try {
      const parsed = JSON.parse(savedProfile) as Partial<ProfileSettingsShape>;
      const legacyResponseStyle = (parsed as Record<string, unknown>)
        .responseStyle;
      const parsedMemoryEntries = sanitizeMemoryEntries(parsed.aiMemoryEntries);
      const fallbackEntries = parsed.aiMemory
        ? sanitizeMemoryEntries(
            parsed.aiMemory
              .split("\n")
              .map((entry) => entry.replace(/^[-*]\s*/, ""))
          )
        : [];
      const nextMemoryEntries =
        parsedMemoryEntries.length > 0 ? parsedMemoryEntries : fallbackEntries;
      setProfileName(parsed.displayName?.trim() ?? "");
      setProfileLogoDataUrl(parsed.avatarDataUrl);
      setProfession(parsed.profession ?? "");
      setAiBehavior({
        concision: clampPercentage(
          typeof parsed.aiBehavior?.concision === "number"
            ? parsed.aiBehavior.concision
            : 50
        ),
        register: clampPercentage(
          typeof parsed.aiBehavior?.register === "number"
            ? parsed.aiBehavior.register
            : 50
        ),
        tone: clampPercentage(
          typeof parsed.aiBehavior?.tone === "number"
            ? parsed.aiBehavior.tone
            : legacyResponseStyle === "allonge"
              ? 80
              : legacyResponseStyle === "concis"
                ? 20
                : 50
        ),
      });
      setAiPersonality(parsed.aiPersonality ?? "");
      setPersonalContext(parsed.personalContext ?? "");
      setAiMemoryEntries(nextMemoryEntries);
      setAiName(parsed.aiName ?? "mAI");
    } catch {
      // Ignore un éventuel JSON invalide pour ne pas bloquer l'écran.
      setProfileName(defaultProfileSettings.displayName);
      setProfileLogoDataUrl(defaultProfileSettings.avatarDataUrl);
      setProfession(defaultProfileSettings.profession);
      setAiBehavior({ concision: 50, register: 50, tone: 50 });
      setAiPersonality(defaultProfileSettings.aiPersonality);
      setPersonalContext(defaultProfileSettings.personalContext);
      setAiMemoryEntries([]);
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
      const toneDirective =
        aiBehavior.tone < 35
          ? "Ton créatif et libre."
          : aiBehavior.tone > 65
            ? "Ton strict et professionnel."
            : "Ton équilibré.";
      const concisionDirective =
        aiBehavior.concision < 35
          ? "Réponses très détaillées."
          : aiBehavior.concision > 65
            ? "Réponses ultra concises."
            : "Réponses de longueur équilibrée.";
      const registerDirective =
        aiBehavior.register < 35
          ? "Registre familier."
          : aiBehavior.register > 65
            ? "Registre soutenu."
            : "Registre linguistique neutre.";
      const behaviorDirective = [
        toneDirective,
        concisionDirective,
        registerDirective,
      ].join(" ");
      const nextSettings: ProfileSettingsShape = {
        ...(defaultProfileSettings as unknown as Record<string, unknown>),
        ...(parsed as Record<string, unknown>),
        aiMemory: aiMemoryEntries.join("\n"),
        aiMemoryEntries,
        aiBehavior,
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
        stylisticDirectives: [aiPersonality.trim(), behaviorDirective]
          .filter(Boolean)
          .join(" "),
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
          aiMemory: aiMemoryEntries.join("\n"),
          aiMemoryEntries,
          aiBehavior,
          aiName: aiName.trim() || "mAI",
          aiPersonality,
          avatarDataUrl: profileLogoDataUrl,
          displayName: profileName.trim(),
          personalContext,
          profession,
          stylisticDirectives: aiPersonality.trim(),
        })
      );
    }
  }, [
    aiMemoryEntries,
    aiBehavior,
    aiName,
    aiPersonality,
    isHydrated,
    personalContext,
    profession,
    profileLogoDataUrl,
    profileName,
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
    const rawParentalSettings = window.localStorage.getItem(
      PARENTAL_SETTINGS_STORAGE_KEY
    );
    if (!rawParentalSettings) {
      return;
    }

    try {
      const parsed = JSON.parse(
        rawParentalSettings
      ) as Partial<ParentalSettings>;
      const parsedExtensions =
        (parsed.extensions as Partial<Record<ExtensionKey, boolean>>) ?? {};
      setParentalSettings({
        advancedSettingsLocked:
          typeof parsed.advancedSettingsLocked === "boolean"
            ? parsed.advancedSettingsLocked
            : defaultParentalSettings.advancedSettingsLocked,
        dailyLimitMinutes:
          typeof parsed.dailyLimitMinutes === "number" &&
          Number.isFinite(parsed.dailyLimitMinutes)
            ? Math.max(15, Math.min(720, Math.round(parsed.dailyLimitMinutes)))
            : defaultParentalSettings.dailyLimitMinutes,
        enabled:
          typeof parsed.enabled === "boolean"
            ? parsed.enabled
            : defaultParentalSettings.enabled,
        extensions: {
          coder:
            typeof parsedExtensions.coder === "boolean"
              ? parsedExtensions.coder
              : defaultParentalSettings.extensions.coder,
          manalyse:
            typeof parsedExtensions.manalyse === "boolean"
              ? parsedExtensions.manalyse
              : defaultParentalSettings.extensions.manalyse,
          news:
            typeof parsedExtensions.news === "boolean"
              ? parsedExtensions.news
              : defaultParentalSettings.extensions.news,
          studio:
            typeof parsedExtensions.studio === "boolean"
              ? parsedExtensions.studio
              : defaultParentalSettings.extensions.studio,
        },
        lockCodeHash:
          typeof parsed.lockCodeHash === "string" ? parsed.lockCodeHash : "",
        sessionUnlockedUntil:
          typeof parsed.sessionUnlockedUntil === "number"
            ? parsed.sessionUnlockedUntil
            : 0,
        usageMinutes:
          typeof parsed.usageMinutes === "number"
            ? Math.max(0, Math.round(parsed.usageMinutes))
            : 0,
      });
    } catch {
      // Fallback: on garde les paramètres parentaux par défaut en cas de JSON corrompu.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      PARENTAL_SETTINGS_STORAGE_KEY,
      JSON.stringify(parentalSettings)
    );
  }, [parentalSettings]);

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

  useEffect(() => {
    if (!parentalSettings.enabled) {
      return;
    }

    // Incrément local du temps d'usage pour le contrôle parental (1 minute = 60_000 ms).
    const timerId = window.setInterval(() => {
      setParentalSettings((prev) => ({
        ...prev,
        usageMinutes: prev.usageMinutes + 1,
      }));
    }, 60_000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [parentalSettings.enabled]);

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

  const resetMemoryEditor = () => {
    setMemoryDraft("");
    setMemoryEditingIndex(null);
  };

  const handleSaveMemoryEntry = () => {
    const sanitizedDraft = memoryDraft.trim().slice(0, MAX_MEMORY_ENTRY_LENGTH);
    if (!sanitizedDraft) {
      return;
    }

    if (memoryEditingIndex !== null) {
      setAiMemoryEntries((prev) =>
        prev.map((entry, index) =>
          index === memoryEditingIndex ? sanitizedDraft : entry
        )
      );
      resetMemoryEditor();
      return;
    }

    if (aiMemoryEntries.length >= maxMemoryEntries) {
      return;
    }

    setAiMemoryEntries((prev) => [...prev, sanitizedDraft]);
    resetMemoryEditor();
  };

  const handleEditMemoryEntry = (index: number) => {
    setMemoryEditingIndex(index);
    setMemoryDraft(aiMemoryEntries[index] ?? "");
  };

  const handleDeleteMemoryEntry = (index: number) => {
    setAiMemoryEntries((prev) =>
      prev.filter((_, current) => current !== index)
    );
    if (memoryEditingIndex === index) {
      resetMemoryEditor();
    }
  };

  const handleSortSettings = () => {
    setMemorySortMode((prevMode) => {
      if (prevMode === "manual") {
        manualMemoryOrderRef.current = [...aiMemoryEntries];
        setAiMemoryEntries((prevEntries) =>
          [...prevEntries].sort((left, right) =>
            left.localeCompare(right, "fr")
          )
        );
        return "alpha";
      }

      setAiMemoryEntries(
        manualMemoryOrderRef.current.length > 0
          ? manualMemoryOrderRef.current
          : aiMemoryEntries
      );

      return "manual";
    });
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
        key: "credits",
        limit: currentPlanDefinition.limits.unifiedCreditsPerWeek,
        period: "week",
        title: "Crédits extensions unifiés",
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

  const settingsSections = [
    { href: "#compte", key: "compte", label: "Compte" },
    { href: "#notifications", key: "notifications", label: "Notifications" },
    {
      href: "#personnalisation",
      key: "personnalisation",
      label: "Personnalisation IA",
    },
    { href: "#parental", key: "parental", label: "Contrôle parental" },
    { href: "#donnees", key: "donnees", label: "Données" },
  ] as const;
  const isParentalSessionUnlocked =
    parentalSettings.sessionUnlockedUntil > Date.now();
  const isAdvancedAccessRestricted =
    parentalSettings.enabled &&
    parentalSettings.advancedSettingsLocked &&
    !isParentalSessionUnlocked;
  const isUsageLimitReached =
    parentalSettings.enabled &&
    parentalSettings.dailyLimitMinutes > 0 &&
    parentalSettings.usageMinutes >= parentalSettings.dailyLimitMinutes;
  const isDataAccessRestricted =
    isAdvancedAccessRestricted || isUsageLimitReached;

  const handleSetLockCode = () => {
    const normalizedNewCode = newLockCode.trim();
    const normalizedConfirmCode = confirmLockCode.trim();

    if (normalizedNewCode.length < 4 || normalizedNewCode.length > 8) {
      setParentalFeedback({
        text: "Le code doit contenir entre 4 et 8 caractères.",
        type: "error",
      });
      return;
    }

    if (normalizedNewCode !== normalizedConfirmCode) {
      setParentalFeedback({
        text: "Les deux codes ne correspondent pas.",
        type: "error",
      });
      return;
    }

    setParentalSettings((prev) => ({
      ...prev,
      enabled: true,
      lockCodeHash: hashLockCode(normalizedNewCode),
      sessionUnlockedUntil: 0,
    }));
    setNewLockCode("");
    setConfirmLockCode("");
    setParentalFeedback({
      text: "Code parental enregistré. La protection est active.",
      type: "success",
    });
  };

  const handleUnlockParentalSection = () => {
    if (!parentalSettings.lockCodeHash) {
      setParentalFeedback({
        text: "Aucun code défini. Configurez un code parental d'abord.",
        type: "error",
      });
      return;
    }

    if (hashLockCode(unlockCode.trim()) !== parentalSettings.lockCodeHash) {
      setParentalFeedback({
        text: "Code invalide. Déverrouillage refusé.",
        type: "error",
      });
      return;
    }

    setParentalSettings((prev) => ({
      ...prev,
      sessionUnlockedUntil: Date.now() + 15 * 60_000,
    }));
    setUnlockCode("");
    setParentalFeedback({
      text: "Section avancée déverrouillée pour 15 minutes.",
      type: "success",
    });
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <div className="flex items-center gap-3">
        <Settings2 className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <span className="rounded-full border border-border/60 bg-background/70 px-2 py-0.5 text-xs text-muted-foreground">
          v{APP_VERSION}
        </span>
      </div>

      <section className="rounded-2xl border border-border/50 bg-card/70 p-4 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Navigation des paramètres
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {settingsSections.map((item) => (
            <a
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                activeSettingsSection === item.key
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
              href={item.href}
              key={item.href}
              onClick={() => setActiveSettingsSection(item.key)}
            >
              {item.label}
            </a>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Mode contextuel : la section active adapte les droits d&apos;accès.
          Pendant la consultation des notifications, les actions sensibles sur
          les données sont limitées.
        </p>
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
              ? `${currentPlanDefinition.limits.messagesPerHour} messages/h • ${currentPlanDefinition.limits.unifiedCreditsPerWeek} crédits d'extensions/semaine • ${currentPlanDefinition.limits.imagesPerWeek} images/semaine`
              : "Chargement du forfait..."}
          </p>

          {isHydrated && plan !== "max" && (
            <div className="mt-4 flex justify-center">
              <Button asChild className="rounded-full" variant="outline">
                <a href="/pricing">
                  {plan === "free"
                    ? "Obtenir Plus"
                    : plan === "plus"
                      ? "Obtenir Pro"
                      : "Obtenir Max"}
                </a>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <UserCircle2 className="size-4 text-primary" />
            Personnalisation
          </h2>
          <Button
            className="rounded-full"
            onClick={handleSortSettings}
            size="sm"
            type="button"
            variant="outline"
          >
            <ListPlus className="mr-1 size-4" />
            Trier les paramètres
          </Button>
        </div>
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
          <div className="liquid-glass space-y-4 rounded-2xl border border-border/60 bg-background/70 p-4 md:col-span-2">
            <h3 className="text-base font-semibold">
              Personnalisation du comportement
            </h3>
            {[
              {
                id: "tone",
                label: "Ton",
                left: "Créatif / Libre",
                right: "Strict / Pro",
                value: aiBehavior.tone,
              },
              {
                id: "concision",
                label: "Concision",
                left: "Très détaillé",
                right: "Ultra concis",
                value: aiBehavior.concision,
              },
              {
                id: "register",
                label: "Registre Linguistique",
                left: "Familier",
                right: "Soutenu",
                value: aiBehavior.register,
              },
            ].map((behaviorItem) => (
              <div className="space-y-2" key={behaviorItem.id}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm text-muted-foreground">
                  <span>{behaviorItem.left}</span>
                  <span className="text-center">
                    {behaviorItem.label} ({behaviorItem.value}%)
                  </span>
                  <span className="text-right">{behaviorItem.right}</span>
                </div>
                <input
                  className="w-full accent-foreground"
                  max={100}
                  min={0}
                  onChange={(event) =>
                    setAiBehavior((prev) => ({
                      ...prev,
                      [behaviorItem.id]: clampPercentage(
                        Number(event.target.value)
                      ),
                    }))
                  }
                  step={1}
                  type="range"
                  value={behaviorItem.value}
                />
              </div>
            ))}
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
            <p className="text-xs text-muted-foreground">Mémoire IA</p>
            <div className="rounded-xl border border-border/60 bg-background/50 p-3">
              <p className="text-xs text-muted-foreground">
                {aiMemoryEntries.length}/{maxMemoryEntries} entrée
                {maxMemoryEntries > 1 ? "s" : ""} utilisée
                {maxMemoryEntries > 1 ? "s" : ""}. 500 caractères max par
                entrée.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  onClick={() => setIsMemoryModalOpen(true)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ListPlus className="mr-1 size-4" />
                  Ouvrir la mémoire
                </Button>
                <Badge variant="secondary">
                  Tri : {memorySortMode === "alpha" ? "A-Z" : "Manuel"}
                </Badge>
              </div>
            </div>
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
        className="liquid-glass rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl"
        id="parental"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ShieldAlert className="size-4 text-primary" />
          Contrôle parental
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Définissez un code de verrouillage, contrôlez le temps
          d&apos;utilisation et limitez les options avancées.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Sécurisation
            </p>
            <div className="mt-2 space-y-2">
              <Input
                maxLength={8}
                onChange={(event) => setNewLockCode(event.target.value)}
                placeholder="Nouveau code (4 à 8 caractères)"
                type="password"
                value={newLockCode}
              />
              <Input
                maxLength={8}
                onChange={(event) => setConfirmLockCode(event.target.value)}
                placeholder="Confirmer le code"
                type="password"
                value={confirmLockCode}
              />
              <Button
                onClick={handleSetLockCode}
                type="button"
                variant="outline"
              >
                <Lock className="mr-2 size-4" />
                Enregistrer le code
              </Button>
              <p className="text-xs text-muted-foreground">
                Protection active : {parentalSettings.enabled ? "Oui" : "Non"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Déverrouillage temporaire
            </p>
            <div className="mt-2 space-y-2">
              <Input
                maxLength={8}
                onChange={(event) => setUnlockCode(event.target.value)}
                placeholder="Entrer le code"
                type="password"
                value={unlockCode}
              />
              <Button
                onClick={handleUnlockParentalSection}
                type="button"
                variant="outline"
              >
                <ShieldCheck className="mr-2 size-4" />
                Déverrouiller 15 min
              </Button>
              <p className="text-xs text-muted-foreground">
                Session avancée :{" "}
                {isParentalSessionUnlocked
                  ? `active jusqu'à ${formatDateTime(
                      new Date(parentalSettings.sessionUnlockedUntil)
                    )}`
                  : "verrouillée"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Clock3 className="size-4" />
              Temps d&apos;utilisation
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Input
                min={15}
                onChange={(event) =>
                  setParentalSettings((prev) => ({
                    ...prev,
                    dailyLimitMinutes: Math.max(
                      15,
                      Math.min(720, Number(event.target.value) || 15)
                    ),
                  }))
                }
                type="number"
                value={parentalSettings.dailyLimitMinutes}
              />
              <span className="text-xs text-muted-foreground">min/jour</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Utilisé aujourd&apos;hui : {parentalSettings.usageMinutes} min
            </p>
            <Button
              className="mt-2"
              onClick={() =>
                setParentalSettings((prev) => ({ ...prev, usageMinutes: 0 }))
              }
              size="sm"
              type="button"
              variant="outline"
            >
              <TimerReset className="mr-2 size-4" />
              Réinitialiser le compteur
            </Button>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Puzzle className="size-4" />
              Extensions actives
            </p>
            <div className="mt-2 grid gap-2">
              {(Object.keys(extensionLabels) as ExtensionKey[]).map(
                (extensionKey) => (
                  <button
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                      parentalSettings.extensions[extensionKey]
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/50 bg-background/60"
                    )}
                    disabled={isAdvancedAccessRestricted}
                    key={extensionKey}
                    onClick={() =>
                      setParentalSettings((prev) => ({
                        ...prev,
                        extensions: {
                          ...prev.extensions,
                          [extensionKey]: !prev.extensions[extensionKey],
                        },
                      }))
                    }
                    type="button"
                  >
                    <span>{extensionLabels[extensionKey]}</span>
                    <span className="text-xs text-muted-foreground">
                      {parentalSettings.extensions[extensionKey]
                        ? "Activée"
                        : "Bloquée"}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-3">
          <button
            className="flex w-full items-center justify-between gap-2 text-left"
            onClick={() =>
              setParentalSettings((prev) => ({
                ...prev,
                advancedSettingsLocked: !prev.advancedSettingsLocked,
              }))
            }
            type="button"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Settings2 className="size-4" />
              Limiter les paramètres avancés
            </span>
            <Badge variant="secondary">
              {parentalSettings.advancedSettingsLocked ? "Actif" : "Inactif"}
            </Badge>
          </button>
          <p className="mt-2 text-xs text-muted-foreground">
            Quand cette option est active, les actions sensibles sont bloquées
            tant qu&apos;un déverrouillage parental n&apos;est pas validé.
          </p>
        </div>

        {parentalFeedback && (
          <p
            className={cn(
              "mt-3 text-sm",
              parentalFeedback.type === "success"
                ? "text-emerald-600"
                : "text-rose-600"
            )}
          >
            {parentalFeedback.text}
          </p>
        )}
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
        {isUsageLimitReached && (
          <p className="mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Limite quotidienne atteinte ({parentalSettings.usageMinutes}/
            {parentalSettings.dailyLimitMinutes} min). Les actions sensibles
            restent désactivées jusqu&apos;à réinitialisation.
          </p>
        )}
        {isAdvancedAccessRestricted && (
          <p className="mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            Accès restreint : entrez le code parental dans la section "Contrôle
            parental" pour autoriser temporairement ces actions.
          </p>
        )}
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <Button
            className="justify-start"
            disabled={isDataAccessRestricted}
            type="button"
            variant="outline"
          >
            <Mail className="mr-2 size-4" />
            Modifier l&apos;adresse mail
          </Button>
          <Button
            className="justify-start"
            disabled={isDataAccessRestricted}
            type="button"
            variant="outline"
          >
            <ShieldCheck className="mr-2 size-4" />
            Changer le mot de passe
          </Button>
          {isDataAccessRestricted ? (
            <Button
              className="justify-start"
              disabled
              type="button"
              variant="outline"
            >
              <FileText className="mr-2 size-4" />
              Exporter mes données
            </Button>
          ) : (
            <Button asChild className="justify-start" variant="outline">
              <a download href="/api/export">
                <FileText className="mr-2 size-4" />
                Exporter mes données
              </a>
            </Button>
          )}
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

      {isMemoryModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="liquid-glass w-full max-w-2xl rounded-2xl border border-border/60 bg-card/85 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Mémoire de l&apos;IA</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ajoutez, modifiez et supprimez des mémoires (max{" "}
                  {maxMemoryEntries} selon votre forfait, plafond technique:{" "}
                  {ABSOLUTE_MAX_MEMORY_ENTRIES}).
                </p>
              </div>
              <button
                className="rounded-full border border-border/50 p-1 text-muted-foreground transition hover:bg-background/70 hover:text-foreground"
                onClick={() => {
                  setIsMemoryModalOpen(false);
                  resetMemoryEditor();
                }}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <label
                className="text-xs text-muted-foreground"
                htmlFor="memory-draft"
              >
                {memoryEditingIndex === null
                  ? "Nouvelle entrée"
                  : "Modifier l'entrée"}
              </label>
              <textarea
                className="min-h-28 w-full rounded-md border border-border/60 bg-background/70 p-3 text-sm outline-none"
                id="memory-draft"
                maxLength={MAX_MEMORY_ENTRY_LENGTH}
                onChange={(event) => setMemoryDraft(event.target.value)}
                placeholder="Ex: Prioriser les plans d'action avec checklists et deadlines."
                value={memoryDraft}
              />
              <p className="text-right text-xs text-muted-foreground">
                {memoryDraft.length}/{MAX_MEMORY_ENTRY_LENGTH}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={
                    memoryDraft.trim().length === 0 ||
                    (memoryEditingIndex === null &&
                      aiMemoryEntries.length >= maxMemoryEntries)
                  }
                  onClick={handleSaveMemoryEntry}
                  size="sm"
                  type="button"
                >
                  {memoryEditingIndex === null ? "Ajouter" : "Enregistrer"}
                </Button>
                {memoryEditingIndex !== null && (
                  <Button
                    onClick={resetMemoryEditor}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {aiMemoryEntries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">
                  Aucune mémoire enregistrée.
                </p>
              ) : (
                aiMemoryEntries.map((entry, index) => (
                  <div
                    className="rounded-xl border border-border/50 bg-background/60 p-3"
                    key={`${index}-${entry.slice(0, 24)}`}
                  >
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm">
                      {entry}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        onClick={() => handleEditMemoryEntry(index)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <PencilLine className="mr-1 size-4" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => handleDeleteMemoryEntry(index)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Trash2 className="mr-1 size-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="liquid-glass rounded-2xl border border-border/50 bg-card/70 p-4 text-center text-xs text-muted-foreground backdrop-blur-xl">
        <div className="flex flex-col items-center gap-3">
          <p>
            Version active : <strong>{APP_VERSION}</strong>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/privacy-policy">Politique de confidentialité</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/terms-of-use">Conditions d&apos;utilisation</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
