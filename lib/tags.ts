import type { PlanKey } from "@/lib/subscription";

export const tagLimitByPlan: Record<PlanKey, number> = {
  free: 5,
  max: 50,
  plus: 10,
  pro: 20,
};

export const maxTagsPerChat = 3;

export function normalizeTagName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function isValidHexColor(value: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}
