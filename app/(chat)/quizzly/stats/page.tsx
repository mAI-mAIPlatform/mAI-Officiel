"use client";

import { useEffect, useMemo, useState } from "react";
import { getQuizzlyInventory, getQuizzlyProfile } from "@/lib/quizzly/actions";
import { BarChart3, Clock3, Flame, Gem, Target } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";

type StatCard = { label: string; value: string };

export default function QuizzlyStatsPage() {
  const [cards, setCards] = useState<StatCard[]>([]);
  const [advancedStats, setAdvancedStats] = useState({
    bestScore: "—",
    fastestQuiz: "—",
    longestStreak: "—",
    diamondsNet: "—",
  });
  const { language } = useLanguage();

  useEffect(() => {
    const load = async () => {
      const [profile, inventory] = await Promise.all([
        getQuizzlyProfile(),
        getQuizzlyInventory(),
      ]);

      const getQty = (key: string) =>
        inventory.find((item) => item.itemKey === key)?.quantity ?? 0;

      setCards([
        { label: "Quiz joués", value: String(getQty("stats:quiz-played")) },
        {
          label: "Taux de réussite",
          value:
            getQty("stats:quiz-played") > 0
              ? `${Math.min(100, Math.round((getQty("stats:total-correct") / (getQty("stats:quiz-played") * 5)) * 100))}%`
              : "0%",
        },
        { label: "Meilleur streak", value: String(profile.streak) },
        { label: "Diamants gagnés", value: String(getQty("stats:diamonds-earned")) },
        { label: "Diamants dépensés", value: String(getQty("stats:diamonds-spent")) },
        { label: "XP actuelle", value: String(profile.xp) },
      ]);

      const bestScore = getQty("stats:best-score");
      const fastestQuizSec = getQty("stats:fastest-quiz-sec");
      const bestStreak = Math.max(profile.streak, getQty("stats:best-streak"));
      const diamondsNet = getQty("stats:diamonds-earned") - getQty("stats:diamonds-spent");

      setAdvancedStats({
        bestScore: bestScore > 0 ? `${bestScore} pts` : t("quizzly.stats.soon", language),
        fastestQuiz:
          fastestQuizSec > 0
            ? `${Math.floor(fastestQuizSec / 60)}m ${String(fastestQuizSec % 60).padStart(2, "0")}s`
            : t("quizzly.stats.soon", language),
        longestStreak: bestStreak > 0 ? `${bestStreak}` : t("quizzly.stats.soon", language),
        diamondsNet: `${diamondsNet >= 0 ? "+" : ""}${diamondsNet}`,
      });
    };

    load();
  }, [language]);

  const chartData = useMemo(
    () => cards.filter((card) => /Quiz|Diamants|XP/.test(card.label)),
    [cards]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-slate-800">Statistiques</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-800">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-800">
          <BarChart3 className="h-5 w-5 text-violet-600" /> Matières & performances
        </h2>
        <div className="space-y-2">
          {chartData.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-violet-500" style={{ width: `${Math.min(100, Number.parseInt(item.value, 10) || 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600"><Target className="mb-2 h-4 w-4" />{t("quizzly.stats.bestScore", language)}: {advancedStats.bestScore}</div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600"><Clock3 className="mb-2 h-4 w-4" />{t("quizzly.stats.fastestQuiz", language)}: {advancedStats.fastestQuiz}</div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600"><Flame className="mb-2 h-4 w-4" />{t("quizzly.stats.longestStreak", language)}: {advancedStats.longestStreak}</div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600"><Gem className="mb-2 h-4 w-4" />{t("quizzly.stats.netDiamonds", language)}: {advancedStats.diamondsNet}</div>
      </div>
    </div>
  );
}
