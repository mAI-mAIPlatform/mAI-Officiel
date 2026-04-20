import type { UserType } from "@/app/(auth)/auth";
import type { PlanKey } from "@/lib/subscription";
import { planDefinitions } from "@/lib/subscription";

type Entitlements = {
  maxMessagesPerHour: number;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  guest: {
    maxMessagesPerHour: 10,
  },
  regular: {
    maxMessagesPerHour: 20,
  },
};

export function getMaxMessagesPerHour(
  userType: UserType,
  plan: PlanKey
): number {
  const baseline = entitlementsByUserType[userType].maxMessagesPerHour;
  if (userType === "guest") {
    return baseline;
  }

  return Math.max(baseline, planDefinitions[plan].limits.messagesPerHour);
}
