"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LEGACY_PLAN_STORAGE_KEYS,
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
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    const storageKeys = [PLAN_STORAGE_KEY, ...LEGACY_PLAN_STORAGE_KEYS];
    const savedPlan = storageKeys
      .map((storageKey) => window.localStorage.getItem(storageKey))
      .find((value) => value !== null);
    const parsedPlan = parsePlanKey(savedPlan);

    setPlan(parsedPlan);
    window.localStorage.setItem(PLAN_STORAGE_KEY, parsedPlan);
    setIsHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (
        !event.key ||
        !storageKeys.includes(event.key as (typeof storageKeys)[number])
      ) {
        return;
      }

      setPlan(parsePlanKey(event.newValue));
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updatePlan = useCallback((nextPlan: PlanKey) => {
    setPlan(nextPlan);
    window.localStorage.setItem(PLAN_STORAGE_KEY, nextPlan);
  }, []);

  const activateByCode = useCallback(
    async (code: string): Promise<PlanKey | null> => {
      setIsActivating(true);

      try {
        const response = await fetch("/api/subscription/activate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          return null;
        }

        const data = (await response.json()) as { plan?: PlanKey };
        const nextPlan = parsePlanKey(data.plan);

        updatePlan(nextPlan);
        return nextPlan;
      } catch {
        return null;
      } finally {
        setIsActivating(false);
      }
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
    isActivating,
    isHydrated,
    nextUpgradePlan,
    plan,
    setPlan: updatePlan,
  };
}
