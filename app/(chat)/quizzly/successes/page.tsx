"use client";

import { useEffect, useMemo, useState } from "react";
import { badgesCatalog, getUserStatsSnapshot } from "@/lib/user-stats";
import { playUiSound } from "@/lib/sound";
import { toast } from "sonner";

const SOCIAL_STORAGE_KEY = "mai.quizzly.social.v1";
const LOCAL_QUIZ_KEY = "mai.quizzly.local-quizzes.v1";
const DUEL_HISTORY_KEY = "mai.quizzly.duel-history.v1";
const PINNED_BADGES_KEY = "mai.quizzly.profile.pinned-badges.v1";
const DISCOVERED_CUSTOM_BADGES_KEY = "mai.quizzly.custom-badges.discovered.v1";

type RarityTier = "bronze" | "silver" | "gold";
type BadgeCard = {
  id: string;
  category: string;
  name: string;
  emoji: string;
  condition: string;
  tier: RarityTier;
  unlocked: boolean;
  seasonal?: boolean;
};

const mapTier = (rarity: string): RarityTier => {
  if (rarity === "common") return "bronze";
  if (rarity === "uncommon") return "silver";
  return "gold";
};

export default function QuizzlySuccessesPage() {
  const [cards, setCards] = useState<BadgeCard[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [confettiOn, setConfettiOn] = useState(false);

  useEffect(() => {
    const snapshot = getUserStatsSnapshot();
    const unlockedSet = new Set(snapshot.badgesUnlocked);
    const social = JSON.parse(localStorage.getItem(SOCIAL_STORAGE_KEY) ?? "{}") as { friends?: string[] };
    const friendsCount = social?.friends?.length ?? 0;
    const localQuizzes = JSON.parse(localStorage.getItem(LOCAL_QUIZ_KEY) ?? "[]") as Array<{ subject: string; difficulty: string; score: number; questions: Array<unknown> }>;
    const duels = JSON.parse(localStorage.getItem(DUEL_HISTORY_KEY) ?? "[]") as Array<{ playerA: string; playerB: string; winner: string }>;

    const custom: BadgeCard[] = [
      { id: "qb01", category: "🎯 Progression", name: "Premier pas", emoji: "👣", condition: "Terminer 1 quiz", tier: "bronze", unlocked: snapshot.quizzlyQuizzesPlayed >= 1 },
      { id: "qb02", category: "🎯 Progression", name: "Marathonien", emoji: "🏃", condition: "Terminer 100 quiz", tier: "silver", unlocked: snapshot.quizzlyQuizzesPlayed >= 100 },
      { id: "qb03", category: "🎯 Progression", name: "Légende", emoji: "👑", condition: "Terminer 1 000 quiz", tier: "gold", unlocked: snapshot.quizzlyQuizzesPlayed >= 1000 },
      { id: "qb04", category: "📐 Maîtrise", name: "Expert en Maths", emoji: "📐", condition: "90% sur 50 quiz de maths", tier: "gold", unlocked: localQuizzes.filter((q) => q.subject.includes("Math")).length >= 50 && localQuizzes.filter((q) => q.subject.includes("Math")).every((q) => q.score / Math.max(1, q.questions.length) >= 0.9) },
      { id: "qb05", category: "📚 Maîtrise", name: "Polyglotte", emoji: "🗣️", condition: "Bonnes performances en Anglais et Français", tier: "silver", unlocked: ["Anglais", "Français"].every((subject) => localQuizzes.some((q) => q.subject === subject && q.score / Math.max(1, q.questions.length) >= 0.8)) },
      { id: "qb06", category: "🧪 Maîtrise", name: "Scientifique", emoji: "🔬", condition: "SVT + Physique-Chimie solides", tier: "silver", unlocked: ["SVT", "Physique-Chimie"].every((subject) => localQuizzes.some((q) => q.subject === subject && q.score / Math.max(1, q.questions.length) >= 0.75)) },
      { id: "qb07", category: "🔥 Régularité", name: "Flamme naissante", emoji: "🔥", condition: "Streak 7 jours", tier: "bronze", unlocked: snapshot.streakDays >= 7 },
      { id: "qb08", category: "🔥 Régularité", name: "Infatigable", emoji: "☄️", condition: "Streak 30 jours", tier: "silver", unlocked: snapshot.streakDays >= 30 },
      { id: "qb09", category: "🔥 Régularité", name: "Immortel", emoji: "♾️", condition: "Streak 100 jours", tier: "gold", unlocked: snapshot.streakDays >= 100 },
      { id: "qb10", category: "🤝 Social", name: "Sociable", emoji: "🤝", condition: "Ajouter 5 amis", tier: "bronze", unlocked: friendsCount >= 5 },
      { id: "qb11", category: "⚔️ Social", name: "Challenger", emoji: "⚔️", condition: "Envoyer 10 défis", tier: "silver", unlocked: duels.length >= 10 },
      { id: "qb12", category: "🧑‍🏫 Social", name: "Mentor", emoji: "🧑‍🏫", condition: "Aider un joueur débutant", tier: "gold", unlocked: friendsCount >= 1 && snapshot.messagesSent >= 200 },
      { id: "qb13", category: "🌟 Rare", name: "Perfection absolue", emoji: "💯", condition: "20/20 en Expert sans erreur", tier: "gold", unlocked: localQuizzes.some((q) => q.difficulty === "Expert" && q.questions.length >= 20 && q.score >= 20) },
      { id: "qb14", category: "🎄 Saisonnier", name: "Festival d'hiver", emoji: "❄️", condition: "Badge événement limité", tier: "gold", unlocked: false, seasonal: true },
      { id: "qb15", category: "🌸 Saisonnier", name: "Printemps des quiz", emoji: "🌸", condition: "Badge événement limité", tier: "gold", unlocked: false, seasonal: true },
    ];

    const catalogCards: BadgeCard[] = badgesCatalog.map((badge) => ({
      id: badge.id,
      category: badge.category,
      name: badge.name,
      emoji: badge.emoji,
      condition: badge.condition,
      tier: mapTier(badge.rarity),
      unlocked: unlockedSet.has(badge.id),
    }));

    const merged = [...catalogCards, ...custom];
    setCards(merged);

    const discovered = new Set(JSON.parse(localStorage.getItem(DISCOVERED_CUSTOM_BADGES_KEY) ?? "[]") as string[]);
    const newUnlockedCustom = custom.filter((badge) => badge.unlocked && !discovered.has(badge.id));
    if (newUnlockedCustom.length > 0) {
      localStorage.setItem(DISCOVERED_CUSTOM_BADGES_KEY, JSON.stringify([...discovered, ...newUnlockedCustom.map((badge) => badge.id)]));
      setConfettiOn(true);
      playUiSound("success");
      toast.success(`🎉 Nouveau succès: ${newUnlockedCustom[0]?.name}`);
      setTimeout(() => setConfettiOn(false), 1800);
    }

    setPinned(JSON.parse(localStorage.getItem(PINNED_BADGES_KEY) ?? "[]"));
  }, []);

  const unlockedCount = useMemo(() => cards.filter((card) => card.unlocked).length, [cards]);
  const progress = cards.length > 0 ? Math.round((unlockedCount / cards.length) * 100) : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; unlocked: number }>();
    cards.forEach((card) => {
      const prev = map.get(card.category) ?? { total: 0, unlocked: 0 };
      prev.total += 1;
      if (card.unlocked) prev.unlocked += 1;
      map.set(card.category, prev);
    });
    return Array.from(map.entries());
  }, [cards]);

  return (
    <div className="space-y-6">
      {confettiOn ? (
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          {Array.from({ length: 40 }).map((_, index) => (
            <span key={`conf-${index}`} className="absolute h-2 w-2 animate-bounce rounded-full" style={{ left: `${(index * 13) % 100}%`, top: `${(index * 7) % 30}%`, background: ["#f59e0b", "#8b5cf6", "#22c55e", "#ec4899"][index % 4] }} />
          ))}
        </div>
      ) : null}
      <h1 className="text-3xl font-black text-slate-800">Mes Succès</h1>
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <p className="text-sm font-semibold text-slate-600">Collection complétée: {unlockedCount}/{cards.length} ({progress}%)</p>
        <div className="mt-2 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-violet-600" style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {byCategory.map(([category, stat]) => (
          <div key={category} className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-600">{category}: <span className="font-black">{stat.unlocked}/{stat.total}</span></div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const borderClass = card.tier === "bronze" ? "border-amber-600" : card.tier === "silver" ? "border-slate-400" : "border-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.3)]";
          return (
            <div key={card.id} className={`rounded-2xl border p-4 ${card.unlocked ? `bg-white ${borderClass}` : "bg-slate-100 border-slate-200"}`}>
              <p className={`text-3xl ${card.unlocked ? "" : "grayscale opacity-40"}`}>{card.emoji}</p>
              <p className={`mt-2 font-black ${card.unlocked ? "text-slate-800" : "text-slate-500"}`}>{card.name}</p>
              <p className="mt-1 text-xs text-slate-500">{card.condition}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">{card.tier}{card.seasonal ? " • saisonnier" : ""}</p>
              {card.unlocked ? (
                <button
                  className="mt-2 rounded-lg bg-violet-100 px-2 py-1 text-[11px] font-bold text-violet-700"
                  onClick={() => {
                    const next = pinned.includes(card.id)
                      ? pinned.filter((id) => id !== card.id)
                      : [...pinned, card.id].slice(0, 3);
                    setPinned(next);
                    localStorage.setItem(PINNED_BADGES_KEY, JSON.stringify(next));
                  }}
                  type="button"
                >
                  {pinned.includes(card.id) ? "Désépingler" : "Épingler au profil"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
