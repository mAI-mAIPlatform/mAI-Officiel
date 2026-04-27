"use client";

import { useEffect, useState } from "react";
import { getOrAssignQuests, claimQuestReward } from "@/lib/quizzly/actions";
import { Target, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import dailyQuestsRaw from "@/lib/quizzly/quests/daily-quests.json";
import weeklyQuestsRaw from "@/lib/quizzly/quests/weekly-quests.json";

type Quest = {
  id: string;
  isCompleted: boolean;
  progress: number;
  questId: string;
  type: "daily" | "weekly";
};

type QuestMeta = {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardDiamonds: number;
};

export default function QuizzlyQuestsPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);

  const refresh = async () => {
    const qs = (await getOrAssignQuests()) as Quest[];
    setQuests(qs);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const onClaim = async (quest: Quest) => {
    setClaimingQuestId(quest.id);
    try {
      const result = await claimQuestReward(quest.id);
      toast.success(`Quête validée: +${result.diamonds}💎 et +${result.xp} XP`);
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(message);
    } finally {
      setClaimingQuestId(null);
    }
  };

  if (loading)
    return <div className="p-10 text-center animate-pulse">Chargement des quêtes...</div>;

  const daily = quests.filter((q) => q.type === "daily");
  const weekly = quests.filter((q) => q.type === "weekly");

  const renderQuest = (q: Quest) => {
    const pool = (q.type === "daily" ? dailyQuestsRaw : weeklyQuestsRaw) as QuestMeta[];
    const meta = pool.find((p) => p.id === q.questId);

    if (!meta) return null;

    const progressPercent = Math.min((q.progress / meta.target) * 100, 100);
    const canClaim = q.progress >= meta.target && !q.isCompleted;
    const questXp = Math.max(10, Math.floor(meta.rewardDiamonds * 2));

    return (
      <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
        <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center shrink-0">
          <Target className="w-8 h-8 text-orange-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">{meta.title}</h3>
          <p className="text-slate-500 text-sm mb-3">{meta.description}</p>

          <div className="flex items-center gap-4">
            <div className="h-3 flex-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-sm font-bold text-slate-600 w-12 text-right">{q.progress}/{meta.target}</span>
          </div>
        </div>
        <div className="shrink-0 text-center space-y-2">
          <span className="block text-sm text-slate-400 font-bold">Récompense</span>
          <span className="font-black text-violet-700 flex items-center gap-1 justify-center">{meta.rewardDiamonds} 💎</span>
          <span className="font-bold text-cyan-700 flex items-center gap-1 justify-center text-sm"><Sparkles className="w-3.5 h-3.5" />+{questXp} XP</span>
          <button
            onClick={() => onClaim(q)}
            disabled={!canClaim || claimingQuestId === q.id}
            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold disabled:opacity-40"
          >
            {canClaim ? "Réclamer" : q.isCompleted ? "Récupérée" : "En cours"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Quêtes</h1>
        <p className="text-slate-500 mt-1">Complète des défis pour gagner diamants + XP.</p>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">Quêtes Journalières <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-lg">24H</span></h2>
        <div className="space-y-4">
          {daily.map(renderQuest)}
          {daily.length === 0 && <p className="text-slate-500">Toutes les quêtes journalières sont terminées !</p>}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">Quêtes Hebdomadaires <span className="bg-violet-100 text-violet-600 text-xs px-2 py-1 rounded-lg">7J</span></h2>
        <div className="space-y-4">
          {weekly.map(renderQuest)}
          {weekly.length === 0 && <p className="text-slate-500">Toutes les quêtes hebdomadaires sont terminées !</p>}
        </div>
      </div>
    </div>
  );
}
