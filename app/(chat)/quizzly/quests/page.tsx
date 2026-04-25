"use client";

import { Flame, Zap } from "lucide-react";
import { useMemo } from "react";
import { getDailyQuests, getWeeklyQuests } from "@/lib/quizzly/quests";

export default function QuizzlyQuestsPage() {
  const daily = useMemo(() => getDailyQuests(new Date(), 5), []);
  const weekly = useMemo(() => getWeeklyQuests(new Date(), 5), []);

  return (
    <section className="space-y-4">
      <div className="liquid-glass rounded-2xl p-5 text-center">
        <h1 className="text-4xl font-black text-violet-600">TES QUÊTES</h1>
        <p className="mt-2 text-muted-foreground">Relève les défis pour gagner un maximum d'XP.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-2xl font-bold"><Flame className="size-5 text-orange-500" /> Pression quotidienne</h2>
          {daily.map((quest) => (
            <article className="liquid-glass rounded-2xl border p-4" key={quest.id}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{quest.label}</p>
                <p className="font-bold text-violet-600">+{quest.xp} XP</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Progression 0/{quest.target}</p>
              <div className="mt-2 h-2 rounded-full bg-muted" />
              <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-center text-sm">En cours</div>
            </article>
          ))}
        </div>
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-2xl font-bold"><Zap className="size-5 text-amber-500" /> Objectifs hebdo</h2>
          {weekly.map((quest) => (
            <article className="liquid-glass rounded-2xl border p-4" key={quest.id}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{quest.label}</p>
                <p className="font-bold text-violet-600">+{quest.xp} XP</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Progression 0/{quest.target}</p>
              <div className="mt-2 h-2 rounded-full bg-muted" />
              <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-center text-sm">En cours</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
