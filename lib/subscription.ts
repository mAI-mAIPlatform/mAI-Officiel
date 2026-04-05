export type PlanKey = "free" | "plus" | "pro" | "max";

export type PlanLimits = {
  filesPerDay: number;
  libraryMaxFiles: number;
  maxFileSizeMb: number;
  quizPerDay: number | "illimites";
  memoryUnits: number;
  messagesPerHour: number;
  coderCredits: number;
  imagesPerWeek: number;
  taskSchedules: number;
  newsSearchesPerDay: number;
  healthRequestsPerMonth: number;
};

export type PlanDefinition = {
  key: PlanKey;
  label: string;
  recommended?: boolean;
  limits: PlanLimits;
};

export const PLAN_STORAGE_KEY = "mai.subscription.plan.v013";
export const LEGACY_PLAN_STORAGE_KEYS = [
  "mai.subscription.plan.v012",
  "mai.subscription.plan",
  "mai.plan",
] as const;

export const planDefinitions: Record<PlanKey, PlanDefinition> = {
  free: {
    key: "free",
    label: "mAI Free",
    limits: {
      filesPerDay: 3,
      libraryMaxFiles: 20,
      maxFileSizeMb: 10,
      quizPerDay: 2,
      memoryUnits: 50,
      messagesPerHour: 10,
      coderCredits: 30,
      imagesPerWeek: 2,
      taskSchedules: 2,
      newsSearchesPerDay: 3,
      healthRequestsPerMonth: 5,
    },
  },
  plus: {
    key: "plus",
    label: "mAI +",
    limits: {
      filesPerDay: 10,
      libraryMaxFiles: 30,
      maxFileSizeMb: 50,
      quizPerDay: 10,
      memoryUnits: 75,
      messagesPerHour: 30,
      coderCredits: 50,
      imagesPerWeek: 3,
      taskSchedules: 5,
      newsSearchesPerDay: 5,
      healthRequestsPerMonth: 10,
    },
  },
  pro: {
    key: "pro",
    label: "mAI Pro",
    recommended: true,
    limits: {
      filesPerDay: 20,
      libraryMaxFiles: 50,
      maxFileSizeMb: 100,
      quizPerDay: 20,
      memoryUnits: 100,
      messagesPerHour: 50,
      coderCredits: 75,
      imagesPerWeek: 4,
      taskSchedules: 10,
      newsSearchesPerDay: 10,
      healthRequestsPerMonth: 15,
    },
  },
  max: {
    key: "max",
    label: "mAI Max",
    limits: {
      filesPerDay: 50,
      libraryMaxFiles: 100,
      maxFileSizeMb: 200,
      quizPerDay: "illimites",
      memoryUnits: 200,
      messagesPerHour: 200,
      coderCredits: 150,
      imagesPerWeek: 5,
      taskSchedules: 20,
      newsSearchesPerDay: 20,
      healthRequestsPerMonth: 25,
    },
  },
};

export const planUpgradeTargetByCurrentPlan: Record<PlanKey, PlanKey | null> = {
  free: "plus",
  plus: "pro",
  pro: "max",
  max: null,
};

export function parsePlanKey(value: string | null | undefined): PlanKey {
  if (!value) {
    return "free";
  }

  const normalizedValue = value.trim().toLowerCase();
  const aliases: Record<string, PlanKey> = {
    free: "free",
    "mai free": "free",
    plus: "plus",
    "mai +": "plus",
    "mai+": "plus",
    "mai plus": "plus",
    pro: "pro",
    "mai pro": "pro",
    max: "max",
    "mai max": "max",
  };

  if (aliases[normalizedValue]) {
    return aliases[normalizedValue];
  }

  return "free";
}

export function formatQuotaReachedMessage(
  scope: string,
  limitLabel: string
): string {
  return `Quota ${scope} atteint (${limitLabel}). Passez au forfait supérieur pour continuer.`;
}
