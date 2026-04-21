export type PlanKey = "free" | "plus" | "pro" | "max";

export type PlanLimits = {
  filesPerDay: number;
  maxFileSizeMb: number;
  quizPerDay: "illimites";
  memoryUnits: number;
  messagesPerHour: number;
  taskSchedules: number;
  webSearchesPerDay: number;
  newsSearchesPerDay: number;
  mealsSearchesPerDay: number;
  healthRequestsPerMonth: number;
  studioImagesPerDay: number;
  musicGenerationsPerWeek: number;
};

export type PlanDefinition = {
  key: PlanKey;
  label: string;
  recommended?: boolean;
  limits: PlanLimits;
};

export const PLAN_STORAGE_KEY = "mai.subscription.plan.v014";
export const LEGACY_PLAN_STORAGE_KEYS = [
  "mai.subscription.plan.v013",
  "mai.subscription.plan.v012",
] as const;

export const planDefinitions: Record<PlanKey, PlanDefinition> = {
  free: {
    key: "free",
    label: "mAI Free",
    limits: {
      filesPerDay: 5,
      maxFileSizeMb: 10,
      quizPerDay: "illimites",
      memoryUnits: 50,
      messagesPerHour: 20,
      taskSchedules: 2,
      webSearchesPerDay: 10,
      newsSearchesPerDay: 3,
      mealsSearchesPerDay: 3,
      healthRequestsPerMonth: 5,
      studioImagesPerDay: 7,
      musicGenerationsPerWeek: 2,
    },
  },
  plus: {
    key: "plus",
    label: "mAI Plus",
    recommended: true,
    limits: {
      filesPerDay: 10,
      maxFileSizeMb: 50,
      quizPerDay: "illimites",
      memoryUnits: 75,
      messagesPerHour: 50,
      taskSchedules: 5,
      webSearchesPerDay: 20,
      newsSearchesPerDay: 5,
      mealsSearchesPerDay: 5,
      healthRequestsPerMonth: 10,
      studioImagesPerDay: 15,
      musicGenerationsPerWeek: 5,
    },
  },
  pro: {
    key: "pro",
    label: "mAI Pro",
    limits: {
      filesPerDay: 20,
      maxFileSizeMb: 100,
      quizPerDay: "illimites",
      memoryUnits: 100,
      messagesPerHour: 75,
      taskSchedules: 10,
      webSearchesPerDay: 35,
      newsSearchesPerDay: 10,
      mealsSearchesPerDay: 10,
      healthRequestsPerMonth: 15,
      studioImagesPerDay: 30,
      musicGenerationsPerWeek: 10,
    },
  },
  max: {
    key: "max",
    label: "Max",
    limits: {
      filesPerDay: 50,
      maxFileSizeMb: 200,
      quizPerDay: "illimites",
      memoryUnits: 200,
      messagesPerHour: 100,
      taskSchedules: 20,
      webSearchesPerDay: 50,
      newsSearchesPerDay: 20,
      mealsSearchesPerDay: 20,
      healthRequestsPerMonth: 25,
      studioImagesPerDay: 75,
      musicGenerationsPerWeek: 20,
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

  if (
    normalizedValue === "free" ||
    normalizedValue === "plus" ||
    normalizedValue === "pro" ||
    normalizedValue === "max"
  ) {
    return normalizedValue;
  }

  if (normalizedValue.includes("maimax") || normalizedValue.includes("max")) {
    return "max";
  }

  if (normalizedValue.includes("mai pro") || normalizedValue === "pro") {
    return "pro";
  }

  if (normalizedValue.includes("mai plus") || normalizedValue === "plus") {
    return "plus";
  }

  return "free";
}
