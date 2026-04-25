"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { StatsSection } from "@/app/(chat)/settings/sections/stats-section";
import {
  getUserStatsSnapshot,
  syncDailyLoginBonus,
  USER_STATS_STORAGE_KEY,
} from "@/lib/user-stats";

const TOKEN_USAGE_STORAGE_KEY = "mai.token-usage.v1";

export default function StatsPage() {
  const { data, status } = useSession();
  const [tokenUsage, setTokenUsage] = useState({ inputTokens: 0, outputTokens: 0 });
  const [userStats, setUserStats] = useState(() => getUserStatsSnapshot());
  const isAuthenticated = status === "authenticated" && Boolean(data?.user?.id);

  useEffect(() => {
    const syncStats = () => {
      setUserStats(getUserStatsSnapshot());
    };

    if (isAuthenticated) {
      const nextSnapshot = syncDailyLoginBonus(getUserStatsSnapshot());
      window.localStorage.setItem(USER_STATS_STORAGE_KEY, JSON.stringify(nextSnapshot));
      syncStats();
    }

    window.addEventListener("storage", syncStats);
    window.addEventListener("mai:stats-updated", syncStats);
    window.addEventListener("mai:usage-updated", syncStats);
    return () => {
      window.removeEventListener("storage", syncStats);
      window.removeEventListener("mai:stats-updated", syncStats);
      window.removeEventListener("mai:usage-updated", syncStats);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const refreshTokenUsage = () => {
      const raw = window.localStorage.getItem(TOKEN_USAGE_STORAGE_KEY);
      if (!raw) {
        setTokenUsage({ inputTokens: 0, outputTokens: 0 });
        return;
      }
      try {
        const parsed = JSON.parse(raw) as {
          inputTokens?: number;
          outputTokens?: number;
        };
        setTokenUsage({
          inputTokens: Math.max(0, Math.floor(parsed.inputTokens ?? 0)),
          outputTokens: Math.max(0, Math.floor(parsed.outputTokens ?? 0)),
        });
      } catch {
        setTokenUsage({ inputTokens: 0, outputTokens: 0 });
      }
    };

    refreshTokenUsage();
    window.addEventListener("storage", refreshTokenUsage);
    window.addEventListener("mai:token-usage-updated", refreshTokenUsage);

    return () => {
      window.removeEventListener("storage", refreshTokenUsage);
      window.removeEventListener("mai:token-usage-updated", refreshTokenUsage);
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <StatsSection
        isAuthenticated={isAuthenticated}
        stats={userStats}
        tokenUsage={tokenUsage}
      />
    </main>
  );
}
