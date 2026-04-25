"use client";

import { Sparkles, Trophy } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { chatModels } from "@/lib/ai/models";

const classes = ["CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e", "2nde", "1ère", "Terminale"];
const matieres = ["Mathématiques", "Français", "Histoire", "SVT", "Physique", "Anglais", "Philosophie"];

export default function QuizzlyPage() {
  const [matiere, setMatiere] = useState(matieres[0]);
  const [classe, setClasse] = useState(classes[0]);
  const [difficulty, setDifficulty] = useState<"facile" | "moyen" | "difficile">("moyen");
  const [modelId, setModelId] = useState(() =>
    typeof window === "undefined"
      ? "gpt-5.4-mini"
      : window.localStorage.getItem("mai.settings.default.quizzly-model.v1") ??
        "gpt-5.4-mini"
  );
  const [quizRaw, setQuizRaw] = useState("");
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [diamonds, setDiamonds] = useState(0);
  const [loading, setLoading] = useState(false);

  const parsedQuestions = useMemo(() => {
    try {
      const maybeJson = JSON.parse(quizRaw);
      return Array.isArray(maybeJson.questions) ? maybeJson.questions : [];
    } catch {
      return [];
    }
  }, [quizRaw]);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quizzly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matiere, classe, difficulty, modelId, questionCount: 10 }),
      });
      const payload = await response.json();
      if (!response.ok) return;
      setQuizRaw(payload.raw ?? "");
    } finally {
      setLoading(false);
    }
  };

  const finishQuiz = (goodAnswers: number) => {
    const gainedXp = goodAnswers * 2;
    const nextXp = xp + gainedXp;
    const nextLevel = 1 + Math.floor(nextXp / 100);
    setXp(nextXp);
    setLevel(nextLevel);
    setDiamonds((current) => current + Math.max(1, Math.floor(goodAnswers / 2)));
  };

  return (
    <div className="space-y-4">
      <section className="liquid-glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image alt="Quizzly" className="size-8 rounded" height={32} src="/images/logo.png" width={32} />
            <h1 className="text-3xl font-bold">Quiz illimités</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Niveau {level}</p>
            <p>{xp} XP · 💎 {diamonds}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <label className="text-xs">Matière<select className="mt-1 h-10 w-full rounded-lg border px-2" value={matiere} onChange={(e) => setMatiere(e.target.value)}>{matieres.map((x)=><option key={x}>{x}</option>)}</select></label>
          <label className="text-xs">Classe<select className="mt-1 h-10 w-full rounded-lg border px-2" value={classe} onChange={(e) => setClasse(e.target.value)}>{classes.map((x)=><option key={x}>{x}</option>)}</select></label>
          <label className="text-xs">Difficulté<select className="mt-1 h-10 w-full rounded-lg border px-2" value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}><option value="facile">Facile</option><option value="moyen">Moyen</option><option value="difficile">Difficile</option></select></label>
          <label className="text-xs">Modèle<select className="mt-1 h-10 w-full rounded-lg border px-2" value={modelId} onChange={(e) => setModelId(e.target.value)}>{chatModels.map((m)=><option value={m.id} key={m.id}>{m.name}</option>)}</select></label>
        </div>
        <Button className="mt-4" onClick={generateQuiz} type="button"><Sparkles className="mr-2 size-4" /> {loading ? "Génération..." : "Lancer la génération"}</Button>
      </section>

      <section className="liquid-glass rounded-2xl p-5">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold"><Trophy className="size-4" /> Quiz généré</h2>
        {parsedQuestions.length > 0 ? (
          <div className="space-y-3">
            {parsedQuestions.slice(0, 10).map((q: any, index: number) => (
              <article className="rounded-xl border p-3" key={`q-${index}`}>
                <p className="font-medium">{index + 1}. {q.question}</p>
                <ul className="mt-2 list-disc pl-5 text-sm">{(q.choices ?? []).map((choice: string, cIndex: number) => <li key={`${index}-${cIndex}`}>{choice}</li>)}</ul>
              </article>
            ))}
            <Button onClick={() => finishQuiz(7)} type="button" variant="outline">Terminer le quiz (simulation 7 bonnes réponses)</Button>
          </div>
        ) : (
          <pre className="rounded-xl bg-background/70 p-3 text-xs text-muted-foreground">{quizRaw || "Aucun quiz généré."}</pre>
        )}
      </section>
    </div>
  );
}
