"use client";

import { useEffect, useMemo, useState } from "react";
import { getQuizzlyInventory, getQuizzlyProfile } from "@/lib/quizzly/actions";
import { BarChart3, Clock3, Flame, Gem, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { t } from "@/lib/i18n";

type StatCard = { label: string; value: string };
type ErrorAnalyticsItem = {
  subject: string;
  subTheme: string;
  questionType: string;
  difficulty: string;
  isCorrect: boolean;
  createdAt: string;
};
type LocalQuiz = {
  createdAt: string;
  subject: string;
  score: number;
  questions: Array<unknown>;
};

const ERROR_ANALYTICS_KEY = "mai.quizzly.error-analytics.v1";
const LOCAL_QUIZ_KEY = "mai.quizzly.local-quizzes.v1";

type RangeKey = 7 | 30 | 90;

type DailyPoint = {
  dateKey: string;
  quizzes: number;
  totalCorrect: number;
  totalQuestions: number;
  bestScore: number;
  subjectCounts: Record<string, number>;
};

function rateColor(rate: number) {
  if (rate < 0.25) return "bg-emerald-500";
  if (rate < 0.45) return "bg-lime-500";
  if (rate < 0.65) return "bg-amber-500";
  return "bg-rose-500";
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getRangeKeys(days: number) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

function formatPct(value: number) {
  return `${Math.round(value)}%`;
}

function comparePeriods(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export default function QuizzlyStatsPage() {
  const [cards, setCards] = useState<StatCard[]>([]);
  const [advancedStats, setAdvancedStats] = useState({ bestScore: "—", fastestQuiz: "—", longestStreak: "—", diamondsNet: "—" });
  const [analytics, setAnalytics] = useState<ErrorAnalyticsItem[]>([]);
  const [localQuizzes, setLocalQuizzes] = useState<LocalQuiz[]>([]);
  const [activeRange, setActiveRange] = useState<RangeKey>(30);
  const [selectedHeatDate, setSelectedHeatDate] = useState<string | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    const load = async () => {
      const [profile, inventory] = await Promise.all([getQuizzlyProfile(), getQuizzlyInventory()]);
      const getQty = (key: string) => inventory.find((item) => item.itemKey === key)?.quantity ?? 0;
      setCards([
        { label: "Quiz joués", value: String(getQty("stats:quiz-played")) },
        { label: "Taux de réussite", value: getQty("stats:quiz-played") > 0 ? `${Math.min(100, Math.round((getQty("stats:total-correct") / (getQty("stats:quiz-played") * 5)) * 100))}%` : "0%" },
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
        fastestQuiz: fastestQuizSec > 0 ? `${Math.floor(fastestQuizSec / 60)}m ${String(fastestQuizSec % 60).padStart(2, "0")}s` : t("quizzly.stats.soon", language),
        longestStreak: bestStreak > 0 ? `${bestStreak}` : t("quizzly.stats.soon", language),
        diamondsNet: `${diamondsNet >= 0 ? "+" : ""}${diamondsNet}`,
      });

      try {
        setAnalytics(JSON.parse(localStorage.getItem(ERROR_ANALYTICS_KEY) ?? "[]"));
      } catch {
        setAnalytics([]);
      }
      try {
        setLocalQuizzes(JSON.parse(localStorage.getItem(LOCAL_QUIZ_KEY) ?? "[]"));
      } catch {
        setLocalQuizzes([]);
      }
    };
    load();
  }, [language]);

  const grouped = useMemo(() => {
    const buckets = new Map<string, { key: string; label: string; errors: number; total: number }>();
    analytics.forEach((item) => {
      const key = `${item.subject}__${item.subTheme}__${item.questionType}__${item.difficulty}`;
      const label = `${item.subject} · ${item.subTheme} · ${item.questionType} · ${item.difficulty}`;
      const entry = buckets.get(key) ?? { key, label, errors: 0, total: 0 };
      entry.total += 1;
      if (!item.isCorrect) entry.errors += 1;
      buckets.set(key, entry);
    });
    return Array.from(buckets.values()).map((entry) => ({ ...entry, errorRate: entry.total > 0 ? entry.errors / entry.total : 0 }));
  }, [analytics]);

  const topWeakSubthemes = useMemo(() => {
    const map = new Map<string, { subTheme: string; errors: number; total: number }>();
    analytics.forEach((item) => {
      const key = `${item.subject}__${item.subTheme}`;
      const prev = map.get(key) ?? { subTheme: `${item.subject} · ${item.subTheme}`, errors: 0, total: 0 };
      prev.total += 1;
      if (!item.isCorrect) prev.errors += 1;
      map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.errors - a.errors || b.total - a.total).slice(0, 10);
  }, [analytics]);

  const dailyMap = useMemo(() => {
    const map = new Map<string, DailyPoint>();
    localQuizzes.forEach((quiz) => {
      const dateKey = (quiz.createdAt || "").slice(0, 10);
      if (!dateKey) return;
      const totalQuestions = Math.max(1, quiz.questions.length);
      const point = map.get(dateKey) ?? { dateKey, quizzes: 0, totalCorrect: 0, totalQuestions: 0, bestScore: 0, subjectCounts: {} };
      point.quizzes += 1;
      point.totalCorrect += quiz.score;
      point.totalQuestions += totalQuestions;
      point.bestScore = Math.max(point.bestScore, quiz.score);
      point.subjectCounts[quiz.subject] = (point.subjectCounts[quiz.subject] ?? 0) + 1;
      map.set(dateKey, point);
    });
    return map;
  }, [localQuizzes]);

  const rangeData = useMemo(() => {
    const keys = getRangeKeys(activeRange);
    return keys.map((key) => dailyMap.get(key) ?? { dateKey: key, quizzes: 0, totalCorrect: 0, totalQuestions: 0, bestScore: 0, subjectCounts: {} });
  }, [dailyMap, activeRange]);

  const previousRangeData = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(now.getDate() - activeRange);
    const keys: string[] = [];
    for (let i = activeRange - 1; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      keys.push(toDateKey(d));
    }
    return keys.map((k) => dailyMap.get(k) ?? { dateKey: k, quizzes: 0, totalCorrect: 0, totalQuestions: 0, bestScore: 0, subjectCounts: {} });
  }, [dailyMap, activeRange]);

  const metrics = useMemo(() => {
    const currentSuccess = rangeData.reduce((acc, day) => acc + (day.totalQuestions > 0 ? (day.totalCorrect / day.totalQuestions) * 100 : 0), 0) / Math.max(1, rangeData.filter((d) => d.totalQuestions > 0).length);
    const previousSuccess = previousRangeData.reduce((acc, day) => acc + (day.totalQuestions > 0 ? (day.totalCorrect / day.totalQuestions) * 100 : 0), 0) / Math.max(1, previousRangeData.filter((d) => d.totalQuestions > 0).length);

    const currentXp = rangeData.reduce((acc, day) => acc + day.totalCorrect * 2, 0);
    const previousXp = previousRangeData.reduce((acc, day) => acc + day.totalCorrect * 2, 0);

    const currentAvgScore = rangeData.reduce((acc, day) => acc + (day.quizzes > 0 ? day.totalCorrect / day.quizzes : 0), 0) / Math.max(1, rangeData.filter((d) => d.quizzes > 0).length);
    const previousAvgScore = previousRangeData.reduce((acc, day) => acc + (day.quizzes > 0 ? day.totalCorrect / day.quizzes : 0), 0) / Math.max(1, previousRangeData.filter((d) => d.quizzes > 0).length);

    return {
      success: currentSuccess,
      xp: currentXp,
      avgScore: currentAvgScore,
      successDelta: comparePeriods(currentSuccess, previousSuccess),
      xpDelta: comparePeriods(currentXp, previousXp),
      avgScoreDelta: comparePeriods(currentAvgScore, previousAvgScore),
    };
  }, [rangeData, previousRangeData]);

  const heatmapData = useMemo(() => {
    return getRangeKeys(365).map((dateKey) => {
      const day = dailyMap.get(dateKey);
      return { dateKey, intensity: day?.quizzes ?? 0, point: day };
    });
  }, [dailyMap]);

  const activeDaysCount = heatmapData.filter((d) => d.intensity > 0).length;
  const longestActiveStreak = useMemo(() => {
    let best = 0;
    let current = 0;
    heatmapData.forEach((day) => {
      if (day.intensity > 0) {
        current += 1;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    });
    return best;
  }, [heatmapData]);

  const chartData = useMemo(() => cards.filter((card) => /Quiz|Diamants|XP/.test(card.label)), [cards]);

  const pathForSuccess = useMemo(() => {
    const points = rangeData.map((day, idx) => {
      const val = day.totalQuestions > 0 ? (day.totalCorrect / day.totalQuestions) * 100 : 0;
      const x = (idx / Math.max(1, rangeData.length - 1)) * 100;
      const y = 40 - (val / 100) * 40;
      return `${x},${y}`;
    }).join(" ");
    return points;
  }, [rangeData]);

  const trendLine = useMemo(() => {
    const values = rangeData.map((day) => (day.quizzes > 0 ? day.totalCorrect / day.quizzes : 0));
    const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
    const startY = 30 - avg * 1.2;
    const endY = 26 - avg * 1.2;
    return { startY, endY };
  }, [rangeData]);

  const selectedHeat = selectedHeatDate ? dailyMap.get(selectedHeatDate) : null;

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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800">Évolution temporelle</h2>
          <div className="rounded-xl bg-slate-100 p-1">
            {[7, 30, 90].map((range) => (
              <button key={`range-${range}`} className={`rounded-lg px-3 py-1 text-xs font-bold ${activeRange === range ? "bg-white text-violet-700" : "text-slate-500"}`} onClick={() => setActiveRange(range as RangeKey)} type="button">{range}j</button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 p-3">
            <p className="text-sm font-bold text-slate-700">Taux de réussite global</p>
            <p className="text-xs text-slate-500">{formatPct(metrics.success)} · {metrics.successDelta >= 0 ? <TrendingUp className="inline h-3 w-3 text-emerald-600" /> : <TrendingDown className="inline h-3 w-3 text-rose-600" />} {Math.abs(metrics.successDelta).toFixed(1)}%</p>
            <svg className="mt-2 h-28 w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <defs><linearGradient id="successFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" /></linearGradient></defs>
              <polyline fill="none" stroke="#8b5cf6" strokeWidth="2" points={pathForSuccess} />
              <polygon points={`0,40 ${pathForSuccess} 100,40`} fill="url(#successFill)" />
            </svg>
          </div>

          <div className="rounded-2xl border border-slate-100 p-3">
            <p className="text-sm font-bold text-slate-700">XP gagnée par jour (empilé matière)</p>
            <p className="text-xs text-slate-500">{Math.round(metrics.xp)} XP · {metrics.xpDelta >= 0 ? <TrendingUp className="inline h-3 w-3 text-emerald-600" /> : <TrendingDown className="inline h-3 w-3 text-rose-600" />} {Math.abs(metrics.xpDelta).toFixed(1)}%</p>
            <div className="mt-3 flex h-28 items-end gap-1">
              {rangeData.map((day) => {
                const totalXp = day.totalCorrect * 2;
                const maxXp = Math.max(1, ...rangeData.map((d) => d.totalCorrect * 2));
                const h = (totalXp / maxXp) * 100;
                const subjects = Object.entries(day.subjectCounts);
                const palette = ["#8b5cf6", "#06b6d4", "#f59e0b", "#22c55e", "#f43f5e"];
                let acc = 0;
                return (
                  <div key={`xpbar-${day.dateKey}`} className="relative h-full flex-1 rounded-sm bg-slate-50" title={`${day.dateKey} · ${day.quizzes} quiz · best ${day.bestScore}`}>
                    {subjects.length === 0 ? null : subjects.map(([subject, count], idx) => {
                      const seg = (count / Math.max(1, day.quizzes)) * h;
                      const style = { bottom: `${acc}%`, height: `${seg}%`, backgroundColor: palette[idx % palette.length] };
                      acc += seg;
                      return <span key={`${day.dateKey}-${subject}`} className="absolute left-0 right-0" style={style} />;
                    })}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              {["Mathématiques", "Français", "Histoire", "SVT", "Anglais"].map((subject, idx) => (
                <span key={`legend-${subject}`}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ["#8b5cf6", "#06b6d4", "#f59e0b", "#22c55e", "#f43f5e"][idx] }} />{subject}</span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 p-3">
            <p className="text-sm font-bold text-slate-700">Score moyen / quiz</p>
            <p className="text-xs text-slate-500">{metrics.avgScore.toFixed(1)} · {metrics.avgScoreDelta >= 0 ? <TrendingUp className="inline h-3 w-3 text-emerald-600" /> : <TrendingDown className="inline h-3 w-3 text-rose-600" />} {Math.abs(metrics.avgScoreDelta).toFixed(1)}%</p>
            <svg className="mt-2 h-28 w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <polyline fill="none" stroke="#7c3aed" strokeWidth="1.8" points={rangeData.map((d, i) => `${(i / Math.max(1, rangeData.length - 1)) * 100},${40 - Math.min(40, (d.quizzes > 0 ? (d.totalCorrect / d.quizzes) * 4 : 0))}`).join(" ")} />
              <line x1="0" y1={trendLine.startY} x2="100" y2={trendLine.endY} stroke="#ef4444" strokeDasharray="2 2" strokeWidth="1.2" />
            </svg>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">Survole les barres/points pour voir quiz joués, meilleur score et matière principale.</p>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-black text-slate-800">Heatmap activité (365 derniers jours)</h2>
        <div className="grid grid-cols-53 gap-1 overflow-x-auto pb-2">
          {heatmapData.map((day) => {
            const intensity = day.intensity;
            const bg = intensity === 0 ? "bg-white" : intensity <= 1 ? "bg-violet-100" : intensity <= 3 ? "bg-violet-300" : intensity <= 5 ? "bg-violet-500" : "bg-violet-800";
            return (
              <button key={`heat-${day.dateKey}`} className={`h-3 w-3 rounded-sm border border-slate-100 ${bg}`} onClick={() => setSelectedHeatDate(day.dateKey)} title={day.dateKey} type="button" />
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
          <p>Jours actifs: <span className="font-black text-slate-800">{activeDaysCount}</span></p>
          <p>Plus longue série active: <span className="font-black text-slate-800">{longestActiveStreak}</span></p>
        </div>
        {selectedHeatDate ? (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-bold">{selectedHeatDate}</p>
            <p>Quiz joués: {selectedHeat?.quizzes ?? 0} · Meilleur score: {selectedHeat?.bestScore ?? 0}</p>
            <p>Matière principale: {selectedHeat ? Object.entries(selectedHeat.subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—" : "—"}</p>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-slate-800"><BarChart3 className="h-5 w-5 text-violet-600" /> Matières & performances</h2>
        <div className="space-y-2">
          {chartData.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500"><span>{item.label}</span><span>{item.value}</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-500" style={{ width: `${Math.min(100, Number.parseInt(item.value, 10) || 0)}%` }} /></div>
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

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-black text-slate-800">Analyse des erreurs récurrentes</h2>
        <div className="space-y-2">
          {grouped.slice(0, 12).map((row) => (
            <div key={row.key} className="rounded-xl border border-slate-100 p-3">
              <div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold text-slate-600">{row.label}</span><span className="font-black text-slate-700">{Math.round(row.errorRate * 100)}% d'erreurs</span></div>
              <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${rateColor(row.errorRate)}`} style={{ width: `${Math.round(row.errorRate * 100)}%` }} /></div>
            </div>
          ))}
          {grouped.length === 0 ? <p className="text-sm text-slate-500">Aucune donnée d'erreur disponible pour l'instant.</p> : null}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-black text-slate-800">Top 10 sous-thèmes avec le plus d'erreurs</h2>
        <div className="space-y-2">
          {topWeakSubthemes.map((row) => {
            const ratio = row.errors / Math.max(1, row.total);
            return (
              <div key={row.subTheme}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600"><span>{row.subTheme}</span><span>{row.errors} erreurs / {row.total} questions</span></div>
                <div className="h-3 rounded-full bg-slate-100"><div className={`h-3 rounded-full ${rateColor(ratio)}`} style={{ width: `${Math.max(6, Math.round(ratio * 100))}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
