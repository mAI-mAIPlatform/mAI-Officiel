export type PlanKey = "free" | "plus" | "pro" | "max";

export type PlanLimits = {
  filesPerDay: number;
  maxFileSizeMb: number;
  quizPerDay: number | "illimites";
  memoryUnits: number;
  messagesPerHour: number;
  coderCredits: number;
  imagesPerWeek: number;
};

export type PlanDefinition = {
  key: PlanKey;
  label: string;
  recommended?: boolean;
  activationCode?: string;
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
    },
  },
  plus: {
    key: "plus",
    label: "mAI +",
    activationCode: "MAIPLUS26",
    limits: {
      filesPerDay: 10,
      maxFileSizeMb: 50,
      quizPerDay: 10,
      memoryUnits: 75,
      messagesPerHour: 30,
      coderCredits: 50,
      imagesPerWeek: 3,
    },
  },
  pro: {
    key: "pro",
    label: "mAI Pro",
    recommended: true,
    activationCode: "MAIPRO26",
    limits: {
      filesPerDay: 20,
      maxFileSizeMb: 100,
      quizPerDay: 20,
      memoryUnits: 100,
      messagesPerHour: 50,
      coderCredits: 75,
      imagesPerWeek: 4,
    },
  },
  max: {
    key: "max",
    label: "mAI Max",
    activationCode: "MAIMAX26",
    limits: {
      filesPerDay: 50,
      maxFileSizeMb: 200,
      quizPerDay: "illimites",
      memoryUnits: 200,
      messagesPerHour: 200,
      coderCredits: 150,
      imagesPerWeek: 5,
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

export function getPlanByActivationCode(code: string): PlanKey | null {
  const normalizedCode = code.trim().toUpperCase();

  if (normalizedCode === "MAIPLUS26") {
    return "plus";
  }

  if (normalizedCode === "MAIPRO26") {
    return "pro";
  }

  if (normalizedCode === "MAIMAX26") {
    return "max";
  }

  return null;
}
