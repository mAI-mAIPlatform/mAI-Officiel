import type { PlanKey } from "@/lib/subscription";
import { consumeUsage, getUsageCount } from "@/lib/usage-limits";

export type ModelTier = "tier1" | "tier2" | "tier3";
export type CreditScope = "guest" | "authenticated";

const modelIdsByTier: Record<ModelTier, string[]> = {
  tier1: [
    "openai/gpt-5.4",
    "openai/gpt-5.2",
    "azure/mistral-large-3",
  ],
  tier2: [
    "openai/gpt-5.1",
    "openai/gpt-5",
    "anthropic/claude-sonnet-4-6",
    "claude/claude-sonnet-4-20250514",
    "azure/deepseek-v3.2",
    "azure/kimi-k2.5",
  ],
  tier3: [
    "openai/gpt-5.4-mini",
    "openai/gpt-5.4-nano",
    "anthropic/claude-haiku-4-5",
  ],
};

const tierOrder: ModelTier[] = ["tier1", "tier2", "tier3"];

const quotaByTier: Record<ModelTier, Record<CreditScope | PlanKey, number>> = {
  tier1: {
    guest: 2,
    authenticated: 10,
    free: 10,
    plus: 25,
    pro: 50,
    max: 75,
  },
  tier2: {
    guest: 5,
    authenticated: 30,
    free: 30,
    plus: 100,
    pro: 250,
    max: 500,
  },
  tier3: {
    guest: 15,
    authenticated: 100,
    free: 100,
    plus: 500,
    pro: 1000,
    max: 2000,
  },
};

const usageFeatureByTier: Record<ModelTier, "tier1" | "tier2" | "tier3"> = {
  tier1: "tier1",
  tier2: "tier2",
  tier3: "tier3",
};

export function getTierForModelId(modelId: string): ModelTier {
  if (modelIdsByTier.tier1.includes(modelId)) return "tier1";
  if (modelIdsByTier.tier2.includes(modelId)) return "tier2";
  return "tier3";
}

export function getTierQuota(
  tier: ModelTier,
  plan: PlanKey,
  isAuthenticated: boolean
): number {
  if (isAuthenticated) {
    return quotaByTier[tier][plan] ?? quotaByTier[tier].authenticated;
  }

  return quotaByTier[tier].guest;
}

export function getTierUsage(tier: ModelTier): number {
  return getUsageCount(usageFeatureByTier[tier], "day");
}

export function getTierRemaining(
  tier: ModelTier,
  plan: PlanKey,
  isAuthenticated: boolean
): { limit: number; used: number; remaining: number } {
  const limit = getTierQuota(tier, plan, isAuthenticated);
  const used = getTierUsage(tier);
  return {
    limit,
    used,
    remaining: Math.max(limit - used, 0),
  };
}

export function consumeTierCredit(tier: ModelTier) {
  return consumeUsage(usageFeatureByTier[tier], "day");
}

export function getFallbackTier(
  tier: ModelTier,
  plan: PlanKey,
  isAuthenticated: boolean
): ModelTier | null {
  const startIndex = tierOrder.indexOf(tier);
  if (startIndex < 0) {
    return null;
  }

  for (let index = startIndex + 1; index < tierOrder.length; index += 1) {
    const candidate = tierOrder[index];
    if (!candidate) continue;
    if (getTierRemaining(candidate, plan, isAuthenticated).remaining > 0) {
      return candidate;
    }
  }

  return null;
}

export function getFirstModelForTier(
  tier: ModelTier,
  availableModelIds: string[]
): string | null {
  for (const modelId of modelIdsByTier[tier]) {
    if (availableModelIds.includes(modelId)) {
      return modelId;
    }
  }

  return null;
}

export function areAllTierCreditsExhausted(
  plan: PlanKey,
  isAuthenticated: boolean
): boolean {
  return tierOrder.every(
    (tier) => getTierRemaining(tier, plan, isAuthenticated).remaining <= 0
  );
}

export function getTierLabel(tier: ModelTier): string {
  if (tier === "tier1") return "Tier 1";
  if (tier === "tier2") return "Tier 2";
  return "Tier 3";
}
