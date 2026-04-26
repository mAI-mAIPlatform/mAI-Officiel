"use client";

import { useEffect, useMemo, useState } from "react";
import {
  claimQuizzlyPassReward,
  getClaimedPassRewards,
  getQuizzlyProfile,
} from "@/lib/quizzly/actions";
import { toast } from "sonner";
import { Gift, Lock, CheckCircle2 } from "lucide-react";
import { addQuizzlyStatsEvent } from "@/lib/user-stats";

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

export default function QuizzlyPassPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [claimed, setClaimed] = useState<number[]>([]);

  const monthKey = useMemo(() => {
    const date = new Date();
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    getQuizzlyProfile().then((p) => setProfile(p as Profile));
    getClaimedPassRewards(monthKey)
      .then((tiers) => setClaimed(tiers))
      .catch(() => setClaimed([]));
  }, [monthKey]);

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
      <div className="bg-white p-5 rounded-2xl border border-slate-100">XP actuelle: <span className="font-black">{profile.xp}</span></div>
      <div className="grid md:grid-cols-2 gap-4">
        {PASS_REWARDS.map((reward) => {
          const unlocked = profile.xp >= reward.requirementXp;
          const isClaimed = claimed.includes(reward.id);
          return (
            <div key={reward.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
              <div>
                <p className="font-black text-slate-800">Palier {reward.id} · {reward.label}</p>
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
    </div>
  );
}
