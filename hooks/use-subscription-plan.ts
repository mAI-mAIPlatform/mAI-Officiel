"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPlanByActivationCode,
  PLAN_STORAGE_KEY,
  type PlanDefinition,
  type PlanKey,
  parsePlanKey,
  planDefinitions,
  planUpgradeTargetByCurrentPlan,
} from "@/lib/subscription";

export function useSubscriptionPlan() {
  const [plan, setPlan] = useState<PlanKey>("free");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedPlan = window.localStorage.getItem(PLAN_STORAGE_KEY);
    setPlan(parsePlanKey(savedPlan));
    setIsHydrated(true);
  }, []);

  const updatePlan = useCallback((nextPlan: PlanKey) => {
    setPlan(nextPlan);
    window.localStorage.setItem(PLAN_STORAGE_KEY, nextPlan);
  }, []);

  const activateByCode = useCallback(
    (code: string): PlanKey | null => {
      const nextPlan = getPlanByActivationCode(code);

      if (!nextPlan) {
        return null;
      }

      updatePlan(nextPlan);
      return nextPlan;
    },
    [updatePlan]
  );

  const currentPlanDefinition: PlanDefinition = useMemo(
    () => planDefinitions[plan],
    [plan]
  );

  const nextUpgradePlan = useMemo(() => {
    const targetPlan = planUpgradeTargetByCurrentPlan[plan];
    return targetPlan ? planDefinitions[targetPlan] : null;
  }, [plan]);

  return {
    activateByCode,
    currentPlanDefinition,
    isHydrated,
    nextUpgradePlan,
    plan,
    setPlan: updatePlan,
  };
}
