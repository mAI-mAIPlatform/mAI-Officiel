"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getQuizzlyProfile,
  claimDailyReward,
  claimComebackReward,
  getWeeklyLeaderboard,
  getQuizzlyInventory,
} from "@/lib/quizzly/actions";
import { toast } from "sonner";
import { Flame, Star, Diamond, Trophy, Sparkles, Shield, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/use-language";

type Profile = {
  bio: string;
  diamonds: number;
  emoji: string;
  level: number;
  pseudo: string;
  stars: number;
  streak: number;
  xp: number;
};

const WELCOME_OPENERS = {
  fr: ["Salut", "Bienvenue", "Prêt(e) à tout casser", "Hello champion", "C'est parti", "On relance la flamme"],
  en: ["Hi", "Welcome", "Ready to crush it", "Hey champion", "Let's go", "Keep the streak alive"],
} as const;
const LEAGUES = ["Bronze", "Argent", "Or", "Diamant", "Champion"] as const;
const SUBJECTS = ["Maths", "Histoire", "Français", "SVT"] as const;

export default function QuizzlyDashboardPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardView, setLeaderboardView] = useState<"global" | "friends">("global");
  const [leaderboard, setLeaderboard] = useState<Array<{ userId: string; pseudo: string; emoji: string; weeklyXp: number }>>([]);
  const [weekKey, setWeekKey] = useState("");
  const [highlights, setHighlights] = useState({ bestScore: 0, fastestQuiz: 0, longestStreak: 0 });

  useEffect(() => {
    Promise.all([getQuizzlyProfile(), getWeeklyLeaderboard("global"), getQuizzlyInventory()]).then(([p, lb, inventory]) => {
      setProfile(p as Profile);
      setLeaderboard(lb.entries);
      setWeekKey(lb.weekKey);
      const getQty = (key: string) => (inventory as Array<{ itemKey: string; quantity: number }>).find((item) => item.itemKey === key)?.quantity ?? 0;
      setHighlights({
        bestScore: getQty("stats:best-score"),
        fastestQuiz: getQty("stats:fastest-quiz-sec"),
        longestStreak: Math.max((p as Profile).streak, getQty("stats:best-streak")),
      });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    getWeeklyLeaderboard(leaderboardView).then((lb) => {
      setLeaderboard(lb.entries);
      setWeekKey(lb.weekKey);
    });
  }, [leaderboardView]);

  const welcomeTitle = useMemo(() => {
    if (!profile) return "Bienvenue sur Quizzly";
    const openers = language === "en" ? WELCOME_OPENERS.en : WELCOME_OPENERS.fr;
    const index = (new Date().getDate() + profile.pseudo.length) % openers.length;
    return `${openers[index]}, ${profile.pseudo} ${profile.emoji}`;
  }, [language, profile]);
  const myRank = useMemo(
    () => leaderboard.findIndex((entry) => entry.pseudo === (profile?.pseudo ?? "")) + 1,
    [leaderboard, profile?.pseudo]
  );
  const leagueIndex = Math.min(LEAGUES.length - 1, Math.max(0, Math.floor((profile?.level ?? 1) / 5)));
  const currentLeague = LEAGUES[leagueIndex];
  const leagueStatus = myRank > 0 && myRank <= 3 ? "Promotion en vue" : myRank > 0 && myRank >= 8 ? "Relégation à éviter" : "Maintien";
  const subjectLeaderboard = SUBJECTS.map((subject, index) => ({
    subject,
    score: (leaderboard[index]?.weeklyXp ?? 0) + (index + 1) * 8,
    pseudo: leaderboard[index]?.pseudo ?? "Ami",
  }));

  const handleClaim = async () => {
    try {
      const res = await claimDailyReward();
      if (res.success) {
        toast.success(`Récompense réclamée : +${res.reward} diamants !`);
        router.push(res.redirectTo);
      } else {
        toast.error(res.message);
        router.push(res.redirectTo);
      }
      const p = await getQuizzlyProfile();
      setProfile(p as Profile);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(message);
    }
  };

  useEffect(() => {
    if (!profile) return;
    claimComebackReward().then(async (res) => {
      if (res.success) {
        toast.success(`Bon retour ${profile.pseudo} ! +${res.reward} 💎`);
        const p = await getQuizzlyProfile();
        setProfile(p as Profile);
      }
    });
  }, [profile]);

  if (loading || !profile)
    return (
      <div className="p-10 text-center animate-pulse text-slate-500">
        Chargement de Quizzly...
      </div>
    );

  const xpForNextLevel = profile.level * 100;
  const progress = (profile.xp / xpForNextLevel) * 100;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800">{welcomeTitle}</h1>
          <p className="text-slate-500 mt-1">{profile.bio}</p>
        </div>
        <button
          onClick={handleClaim}
          className="bg-gradient-to-r from-orange-400 to-rose-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
        >
          Récompense Quotidienne (+10 💎)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
          <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Niveau</span>
          <span className="text-3xl font-black text-slate-800">{profile.level}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Flame className="w-8 h-8 text-orange-500 mb-2" />
          <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Streak</span>
          <span className="text-3xl font-black text-slate-800">{profile.streak} <span className="text-lg">J</span></span>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Diamond className="w-8 h-8 text-cyan-500 mb-2" />
          <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Diamants</span>
          <span className="text-3xl font-black text-slate-800">{profile.diamonds}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <Star className="w-8 h-8 text-yellow-400 mb-2" />
          <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Étoiles</span>
          <span className="text-3xl font-black text-slate-800">{profile.stars}</span>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600"><Trophy className="mb-2 h-4 w-4 text-yellow-500" />Meilleur score: <span className="font-black text-slate-800">{highlights.bestScore > 0 ? `${highlights.bestScore} pts` : "—"}</span></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600"><Sparkles className="mb-2 h-4 w-4 text-violet-500" />Quiz le plus rapide: <span className="font-black text-slate-800">{highlights.fastestQuiz > 0 ? `${Math.floor(highlights.fastestQuiz / 60)}m ${String(highlights.fastestQuiz % 60).padStart(2, "0")}s` : "—"}</span></div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600"><Flame className="mb-2 h-4 w-4 text-orange-500" />Plus longue streak: <span className="font-black text-slate-800">{highlights.longestStreak > 0 ? `${highlights.longestStreak} jours` : "—"}</span></div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Progression vers le niveau {profile.level + 1}</h3>
            <p className="text-slate-500 text-sm">{profile.xp} / {xpForNextLevel} XP</p>
          </div>
          <div className="text-xs px-3 py-2 rounded-xl bg-violet-50 text-violet-700 font-semibold flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Niveau up = +5💎 (+1💎/niveau après 20)
          </div>
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-violet-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link href="/quizzly/boutique?focus=shield" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <p className="font-black text-slate-800 flex items-center gap-2"><Shield className="w-5 h-5 text-sky-600" /> Boucliers de protection</p>
          <p className="text-slate-500 text-sm mt-1">Protège ta flamme si tu rates un jour de quiz.</p>
        </Link>
        <Link href="/quizzly/pass" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
          <p className="font-black text-slate-800">Quizzly Pass mensuel</p>
          <p className="text-slate-500 text-sm mt-1">20 récompenses à débloquer avec ton XP.</p>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-800">🏆 Ligue hebdomadaire — {currentLeague} ({weekKey})</h3>
          <div className="rounded-xl bg-slate-100 p-1">
            <button
              className={`rounded-lg px-3 py-1 text-xs font-bold ${leaderboardView === "global" ? "bg-white text-violet-700" : "text-slate-500"}`}
              onClick={() => setLeaderboardView("global")}
              type="button"
            >
              Global
            </button>
            <button
              className={`rounded-lg px-3 py-1 text-xs font-bold ${leaderboardView === "friends" ? "bg-white text-violet-700" : "text-slate-500"}`}
              onClick={() => setLeaderboardView("friends")}
              type="button"
            >
              Amis
            </button>
          </div>
        </div>
        <div className="mb-4 rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-800">
          Position: {myRank > 0 ? `#${myRank}` : "Non classé"} · Statut: <span className="font-bold">{leagueStatus}</span>
        </div>
        <div className="space-y-2">
          {leaderboard.slice(0, 10).map((entry, index) => (
            <div key={entry.userId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <div className="font-bold text-slate-700">
                #{index + 1} {entry.emoji} {entry.pseudo}
              </div>
              <div className="flex items-center gap-2 font-semibold text-violet-700">
                {index < 3 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4 text-slate-400" />}
                {entry.weeklyXp} XP
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <h4 className="font-black text-slate-700">Classement par matière</h4>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {subjectLeaderboard.map((item) => (
              <div key={item.subject} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                <p className="font-bold">{item.subject}</p>
                <p className="text-slate-600">{item.pseudo} · {item.score} XP</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-violet-600 rounded-3xl p-8 text-white text-center shadow-xl shadow-violet-200">
        <h2 className="text-2xl font-black mb-4">Prêt à faire un Quiz ?</h2>
        <p className="text-violet-200 mb-8 max-w-lg mx-auto">Gagne de l'XP en répondant correctement aux questions et grimpe les niveaux !</p>
        <Link href="/quizzly/play" className="inline-block bg-white text-violet-700 px-8 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-lg">
          Lancer une partie
        </Link>
      </div>
    </div>
  );
}
