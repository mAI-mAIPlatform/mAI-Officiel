"use client";

import { useEffect, useMemo, useState } from "react";
import {
  claimQuizzlyPassReward,
  getClaimedPassRewards,
  getQuizzlyProfile,
  hasQuizzlyPassProAccess,
  unlockQuizzlyPassProWithDiamonds,
} from "@/lib/quizzly/actions";
import { toast } from "sonner";
import { Gift, Lock, CheckCircle2, Crown, Sparkles } from "lucide-react";
import { addQuizzlyStatsEvent } from "@/lib/user-stats";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";

type PassReward = {
  id: number;
  requirementXp: number;
  label: string;
  type:
    | "diamonds"
    | "theme"
    | "effect"
    | "stars"
    | "booster_x1.5"
    | "booster_x2"
    | "shield_1d"
    | "shield_3d";
  value: number;
};

const PASS_REWARDS: PassReward[] = Array.from({ length: 20 }, (_, index) => {
  const id = index + 1;
  if (id % 10 === 0) return { id, requirementXp: id * 120, label: "Effet premium", type: "effect", value: 1 };
  if (id % 5 === 0) return { id, requirementXp: id * 120, label: "Thème exclusif", type: "theme", value: 1 };
  if (id % 4 === 0) return { id, requirementXp: id * 120, label: "Bouclier 1j", type: "shield_1d", value: 1 };
  if (id % 7 === 0) return { id, requirementXp: id * 120, label: "Bouclier 3j", type: "shield_3d", value: 1 };
  if (id % 3 === 0) return { id, requirementXp: id * 120, label: "Booster x2", type: "booster_x2", value: 1 };
  if (id % 2 === 0) return { id, requirementXp: id * 120, label: "Étoiles", type: "stars", value: 2 };
  return { id, requirementXp: id * 120, label: "Diamants", type: "diamonds", value: 8 };
});

type Profile = { xp: number; diamonds: number; stars: number };
const rewardTypeIcon: Record<PassReward["type"], string> = {
  diamonds: "💎",
  theme: "🎨",
  effect: "✨",
  stars: "⭐",
  "booster_x1.5": "⚡",
  booster_x2: "🚀",
  shield_1d: "🛡️",
  shield_3d: "🛡️",
};
const PRO_PASS_REWARDS: PassReward[] = Array.from({ length: 10 }, (_, index) => {
  const id = index + 1;
  if (id % 5 === 0) return { id: 100 + id, requirementXp: id * 180, label: "Avatar légendaire", type: "theme", value: 1 };
  if (id % 2 === 0) return { id: 100 + id, requirementXp: id * 180, label: "Booster x2", type: "booster_x2", value: 1 };
  return { id: 100 + id, requirementXp: id * 180, label: "Diamants Pro", type: "diamonds", value: 15 };
});

export default function QuizzlyPassPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [claimed, setClaimed] = useState<number[]>([]);
  const [hasProAccess, setHasProAccess] = useState(false);
  const { plan } = useSubscriptionPlan();

  const monthKey = useMemo(() => {
    const date = new Date();
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    getQuizzlyProfile().then((p) => setProfile(p as Profile));
    getClaimedPassRewards(monthKey)
      .then((tiers) => setClaimed(tiers))
      .catch(() => setClaimed([]));
    hasQuizzlyPassProAccess().then((value) => setHasProAccess(value)).catch(() => setHasProAccess(false));
  }, [monthKey]);

  const unlockProWithDiamonds = async () => {
    await unlockQuizzlyPassProWithDiamonds();
    const refreshed = (await getQuizzlyProfile()) as Profile;
    setProfile(refreshed);
    setHasProAccess(true);
    toast.success("Quizzly Pass Pro débloqué !");
  };

  const claimReward = async (reward: PassReward) => {
    if (!profile) return;
    if (claimed.includes(reward.id)) return;
    if (profile.xp < reward.requirementXp) return;

    await claimQuizzlyPassReward({
      monthKey,
      rewardType: reward.type,
      tier: reward.id,
      value: reward.value,
    });
    const refreshed = (await getQuizzlyProfile()) as Profile;
    setProfile(refreshed);
    addQuizzlyStatsEvent("pass_claim", 1);

    const nextClaimed = [...claimed, reward.id];
    setClaimed(nextClaimed);
    toast.success(`Récompense Quizzly Pass débloquée: ${reward.label}`);
  };

  if (!profile) return <div className="p-10 animate-pulse text-center">Chargement du Pass...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Quizzly Pass</h1>
        <p className="text-slate-500">Saison {monthKey} — 20 récompenses mensuelles débloquées via l'XP.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <div className="space-y-3">
          <h2 className="text-xl font-black text-slate-800">Pass Gratuit</h2>
          {PASS_REWARDS.map((reward) => {
            const unlocked = profile.xp >= reward.requirementXp;
            const isClaimed = claimed.includes(reward.id);
            return (
              <div key={reward.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <p className="font-black text-slate-800 flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-base">{rewardTypeIcon[reward.type]}</span>
                    Palier {reward.id}
                  </p>
                  <p className="text-sm text-slate-700">{reward.label}</p>
                  <p className="text-sm text-slate-500">Requis: {reward.requirementXp} XP</p>
                </div>
                <button
                  onClick={() => claimReward(reward)}
                  disabled={!unlocked || isClaimed}
                  className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  {isClaimed ? <CheckCircle2 className="w-4 h-4" /> : unlocked ? <Gift className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {isClaimed ? "Réclamé" : unlocked ? "Réclamer" : "Verrouillé"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-black text-amber-900 flex items-center gap-2"><Crown className="w-5 h-5" /> Quizzly Pass Pro</h2>
        {!(plan === "max" || hasProAccess) && (
          <button
            onClick={() => void unlockProWithDiamonds()}
            disabled={profile.diamonds < 500}
            className="mb-4 px-4 py-2 rounded-xl bg-amber-500 text-white font-bold disabled:opacity-50"
          >
            Débloquer avec 500 💎
          </button>
        )}
          {PRO_PASS_REWARDS.map((reward) => {
            const unlockedByPlan = plan === "max" || hasProAccess;
            const unlockedByXp = profile.xp >= reward.requirementXp;
            const unlocked = unlockedByPlan && unlockedByXp;
            const isClaimed = claimed.includes(reward.id);
            return (
              <div key={reward.id} className="bg-gradient-to-b from-yellow-50 to-amber-100 p-4 rounded-2xl border border-yellow-300 shadow-[0_0_24px_rgba(234,179,8,0.25)] flex items-center justify-between gap-4">
                <div>
                  <p className="font-black text-amber-900 flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-base">{rewardTypeIcon[reward.type]}</span>
                    <Sparkles className="w-3.5 h-3.5" /> Pro {reward.id - 100}
                  </p>
                  <p className="text-sm text-amber-900">{reward.label}</p>
                  <p className="text-sm text-amber-800">Requis: {reward.requirementXp} XP</p>
                </div>
                <button
                  onClick={() => claimReward(reward)}
                  disabled={!unlocked || isClaimed}
                  className="px-3 py-2 rounded-lg bg-violet-700 text-white text-sm font-bold disabled:opacity-40 flex items-center gap-1"
                >
                  {isClaimed ? <CheckCircle2 className="w-4 h-4" /> : unlocked ? <Gift className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {isClaimed ? "Réclamé" : unlocked ? "Réclamer" : unlockedByPlan ? "XP insuffisante" : "Plan requis"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
