import { Award, BarChart3, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  badgesCatalog,
  getBadgeRarityLabel,
  getBadgeRarityOrder,
  getLevelFromXp,
  getLevelRewards,
  getXpForNextLevel,
  type UserStatsSnapshot,
} from "@/lib/user-stats";

type StatsSectionProps = {
  className?: string;
  isAuthenticated: boolean;
  stats: UserStatsSnapshot;
  tokenUsage: { inputTokens: number; outputTokens: number };
};

export function StatsSection({
  className,
  isAuthenticated,
  stats,
  tokenUsage,
}: StatsSectionProps) {
  const levelData = getLevelFromXp(stats.xp);
  const rewards = getLevelRewards(levelData.level);
  const unlocked = new Set(stats.badgesUnlocked);

  const sortedBadges = [...badgesCatalog].sort((a, b) => {
    const unlockedDelta = Number(unlocked.has(b.id)) - Number(unlocked.has(a.id));
    if (unlockedDelta !== 0) {
      return unlockedDelta;
    }
    return getBadgeRarityOrder(a.rarity) - getBadgeRarityOrder(b.rarity);
  });

  const progress = Math.round((levelData.currentLevelXp / levelData.nextLevelXp) * 100);

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl",
        className
      )}
      id="statistiques"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <BarChart3 className="size-4 text-primary" />
        Statistiques
      </h2>
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
                XP: +5/message, +3/vote, +10/image, +20/musique, +500/badge, bonus de connexion quotidien progressif.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border/60 bg-background/60 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="size-4 text-primary" /> Badges ({stats.badgesUnlocked.length}/60)
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Répartition cible: 16 communs, 24 peu communs, 16 rares, 4 légendaires.
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {sortedBadges.map((badge, index) => {
                const isUnlocked = unlocked.has(badge.id);
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
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{badge.category}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{badge.condition}</p>
                    <p className="mt-1 text-[11px]">{getBadgeRarityLabel(badge.rarity)}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
