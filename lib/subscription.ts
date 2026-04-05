export type PlanKey = "free" | "plus" | "pro" | "max";

export type PlanLimits = {
  filesPerDay: number;
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

export const planDefinitions: Record<PlanKey, PlanDefinition> = {
  free: {
    key: "free",
    label: "mAI Free",
    limits: {
      filesPerDay: 3,
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

  if (
    value === "free" ||
    value === "plus" ||
    value === "pro" ||
    value === "max"
  ) {
    return value;
  }

  return "free";
}
