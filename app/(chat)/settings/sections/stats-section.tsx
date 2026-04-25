"use client";

import { Award, BarChart3, Info, Pin, PinOff, Search, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  badgesCatalog,
  getBadgeRarityLabel,
  getBadgeRarityOrder,
  getBadgeXpByRarity,
  getLevelFromXp,
  getLevelRewards,
  getXpForNextLevel,
  getXpHistory,
  type UserStatsSnapshot,
} from "@/lib/user-stats";

type StatsSectionProps = {
  className?: string;
  isAuthenticated: boolean;
  stats: UserStatsSnapshot;
  tokenUsage: { inputTokens: number; outputTokens: number };
};

const PINNED_BADGES_STORAGE_KEY = "mai.stats.badges.pinned.v1";

export function StatsSection({
  className,
  isAuthenticated,
  stats,
  tokenUsage,
}: StatsSectionProps) {
  const [badgeSearch, setBadgeSearch] = useState("");
  const [badgeFilter, setBadgeFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pinnedBadges, setPinnedBadges] = useState<string[]>([]);
  const [xpHistory, setXpHistory] = useState(() => getXpHistory());

  useEffect(() => {
    const syncPinned = () => {
      try {
        const raw = window.localStorage.getItem(PINNED_BADGES_STORAGE_KEY);
        if (!raw) {
          setPinnedBadges([]);
          return;
        }
        const parsed = JSON.parse(raw) as string[];
        setPinnedBadges(Array.isArray(parsed) ? parsed : []);
      } catch {
        setPinnedBadges([]);
      }
    };

    const syncHistory = () => setXpHistory(getXpHistory());

    syncPinned();
    syncHistory();
    window.addEventListener("storage", syncPinned);
    window.addEventListener("mai:stats-updated", syncHistory);
    return () => {
      window.removeEventListener("storage", syncPinned);
      window.removeEventListener("mai:stats-updated", syncHistory);
    };
  }, []);

  const levelData = getLevelFromXp(stats.xp);
  const rewards = getLevelRewards(levelData.level);
  const unlocked = new Set(stats.badgesUnlocked);
  const pinned = new Set(pinnedBadges);

  const sortedBadges = useMemo(() => {
    const search = badgeSearch.trim().toLowerCase();
    return [...badgesCatalog]
      .filter((badge) => {
        if (badgeFilter === "unlocked" && !unlocked.has(badge.id)) {
          return false;
        }
        if (badgeFilter === "locked" && unlocked.has(badge.id)) {
          return false;
        }
        if (!search) {
          return true;
        }
        const haystack = `${badge.name} ${badge.category} ${badge.condition}`.toLowerCase();
        return haystack.includes(search);
      })
      .sort((a, b) => {
        const pinnedDelta = Number(pinned.has(b.id)) - Number(pinned.has(a.id));
        if (pinnedDelta !== 0) {
          return pinnedDelta;
        }
        const unlockedDelta = Number(unlocked.has(b.id)) - Number(unlocked.has(a.id));
        if (unlockedDelta !== 0) {
          return unlockedDelta;
        }
        return getBadgeRarityOrder(a.rarity) - getBadgeRarityOrder(b.rarity);
      });
  }, [badgeFilter, badgeSearch, pinned, unlocked]);

  const progress = Math.round((levelData.currentLevelXp / levelData.nextLevelXp) * 100);

  const persistPinnedBadges = (next: string[]) => {
    setPinnedBadges(next);
    window.localStorage.setItem(PINNED_BADGES_STORAGE_KEY, JSON.stringify(next));
  };

  const togglePinnedBadge = (badgeId: string) => {
    if (pinned.has(badgeId)) {
      persistPinnedBadges(pinnedBadges.filter((id) => id !== badgeId));
      return;
    }
    persistPinnedBadges([badgeId, ...pinnedBadges].slice(0, 24));
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl",
        className
      )}
      id="statistiques"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="size-4 text-primary" />
          Statistiques
        </h2>
        <Button onClick={() => setIsHistoryOpen(true)} size="sm" type="button" variant="outline">
          Historique XP
        </Button>
      </div>
      {!isAuthenticated ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Connectez-vous pour débloquer niveaux, badges et bonus de progression.
        </p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4 text-primary" /> Niveau
              </p>
              <p className="mt-2 text-2xl font-bold">Niveau {levelData.level}</p>
              <p className="text-xs text-muted-foreground">
                {levelData.currentLevelXp} / {levelData.nextLevelXp} XP (prochain palier {getXpForNextLevel(levelData.level)})
              </p>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <p>+{rewards.tier3Bonus} Tier 3 (niveau)</p>
                <p>+{rewards.tier2Bonus} Tier 2 (tous les 5 niveaux)</p>
                <p>+{rewards.tier3MilestoneBonus} Tier 3 bonus (tous les 10)</p>
                <p>+{rewards.webSearchBonus} recherches web (tous les 20)</p>
                <p>+{rewards.imageBonus} images (tous les 30)</p>
                <p>+{rewards.musicBonus} musiques (tous les 50)</p>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/60 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Award className="size-4 text-primary" /> Tokens
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-border/50 bg-card/70 p-3">
                  <p className="text-xs text-muted-foreground">Entrée</p>
                  <p className="text-lg font-semibold tabular-nums">{tokenUsage.inputTokens.toLocaleString("fr-FR")}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card/70 p-3">
                  <p className="text-xs text-muted-foreground">Sortie</p>
                  <p className="text-lg font-semibold tabular-nums">{tokenUsage.outputTokens.toLocaleString("fr-FR")}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card/70 p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold tabular-nums">{(tokenUsage.inputTokens + tokenUsage.outputTokens).toLocaleString("fr-FR")}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                XP: +5/message, +3/vote, +10/image, +20/musique et bonus de connexion quotidien.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border/60 bg-background/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="size-4 text-primary" /> Badges ({stats.badgesUnlocked.length}/60)
              </p>
              <div className="group relative">
                <button className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 text-xs text-muted-foreground" type="button">
                  <Info className="size-3.5" /> XP par rareté
                </button>
                <div className="pointer-events-none absolute right-0 z-10 mt-2 hidden w-60 rounded-xl border border-border/60 bg-card p-3 text-xs shadow-xl group-hover:block">
                  <p>⬜ Commun: +100 XP</p>
                  <p>🟦 Peu commun: +200 XP</p>
                  <p>🟪 Rare: +300 XP</p>
                  <p>🟨 Légendaire: +500 XP</p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  onChange={(event) => setBadgeSearch(event.target.value)}
                  placeholder="Rechercher un badge"
                  value={badgeSearch}
                />
              </div>
              <Button onClick={() => setBadgeFilter("all")} size="sm" type="button" variant={badgeFilter === "all" ? "default" : "outline"}>
                Tous
              </Button>
              <Button onClick={() => setBadgeFilter("unlocked")} size="sm" type="button" variant={badgeFilter === "unlocked" ? "default" : "outline"}>
                Débloqués
              </Button>
              <Button onClick={() => setBadgeFilter("locked")} size="sm" type="button" variant={badgeFilter === "locked" ? "default" : "outline"}>
                Verrouillés
              </Button>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {sortedBadges.map((badge, index) => {
                const isUnlocked = unlocked.has(badge.id);
                const isPinned = pinned.has(badge.id);
                return (
                  <article
                    className={cn(
                      "group relative rounded-xl border p-3 transition-all duration-300",
                      isUnlocked
                        ? "border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]"
                        : "border-border/50 bg-card/60 opacity-80"
                    )}
                    key={badge.id}
                    style={{ animationDelay: `${index * 16}ms` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        <span className="mr-1">{badge.emoji}</span>
                        {badge.name}
                      </p>
                      <div className="flex items-center gap-1">
                        <Badge
                          className={cn(
                            "rounded-full",
                            isUnlocked
                              ? "bg-emerald-500/90 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isUnlocked ? "Débloqué" : "Verrouillé"}
                        </Badge>
                        <Button
                          onClick={() => togglePinnedBadge(badge.id)}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                        </Button>
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{badge.category}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{badge.condition}</p>
                    <p className="mt-1 text-[11px]">
                      {getBadgeRarityLabel(badge.rarity)} · +{getBadgeXpByRarity(badge.rarity)} XP
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Dialog onOpenChange={setIsHistoryOpen} open={isHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historique des XP gagnés</DialogTitle>
            <DialogDescription>
              Exemples: Message +5 XP, Vote +3 XP, Image +10 XP, Musique +20 XP, badges selon la rareté.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
            {xpHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun événement XP pour le moment.</p>
            ) : (
              xpHistory.map((entry) => (
                <article
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2"
                  key={entry.id}
                >
                  <div>
                    <p className="text-sm font-medium">{entry.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700">
                    +{entry.xp} XP
                  </span>
                </article>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
