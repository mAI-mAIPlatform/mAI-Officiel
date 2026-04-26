"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock } from "lucide-react";

const CHAPTER_TREE: Record<string, Array<{ id: string; label: string; chapter: string }>> = {
  "Mathématiques": [
    { id: "m1", chapter: "Nombres", label: "Fractions et puissances" },
    { id: "m2", chapter: "Algèbre", label: "Équations du 1er degré" },
    { id: "m3", chapter: "Géométrie", label: "Théorème de Pythagore" },
    { id: "m4", chapter: "Fonctions", label: "Lecture de courbes" },
  ],
  "Français": [
    { id: "f1", chapter: "Grammaire", label: "Nature et fonction" },
    { id: "f2", chapter: "Conjugaison", label: "Temps composés" },
    { id: "f3", chapter: "Orthographe", label: "Accords complexes" },
    { id: "f4", chapter: "Argumentation", label: "Plan et connecteurs" },
  ],
  "Histoire": [
    { id: "h1", chapter: "Antiquité", label: "Cités grecques" },
    { id: "h2", chapter: "Moyen Âge", label: "Société féodale" },
    { id: "h3", chapter: "Révolutions", label: "1789 et conséquences" },
    { id: "h4", chapter: "XXe siècle", label: "Guerres mondiales" },
  ],
};

export default function QuizzlyLearningPathPage() {
  const [grade, setGrade] = useState("3ème");
  const [subject, setSubject] = useState<keyof typeof CHAPTER_TREE>("Mathématiques");
  const [quizzes, setQuizzes] = useState<Array<{ subject: string; score: number; questions: Array<unknown> }>>([]);

  useEffect(() => {
    try {
      setQuizzes(JSON.parse(localStorage.getItem("mai.quizzly.local-quizzes.v1") ?? "[]"));
    } catch {
      setQuizzes([]);
    }
  }, []);

  const masteryByNode = useMemo(() => {
    const base = CHAPTER_TREE[subject].reduce<Record<string, number>>((acc, node) => {
      const related = quizzes.filter((quiz) => quiz.subject === subject);
      const average = related.length > 0
        ? Math.round((related.reduce((total, quiz) => total + (quiz.score / Math.max(1, quiz.questions.length)) * 100, 0) / related.length))
        : 0;
      acc[node.id] = Math.max(0, Math.min(100, average - Math.floor(Math.random() * 18) + 8));
      return acc;
    }, {});
    return base;
  }, [subject]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Parcours d'apprentissage guidé</h1>
          <p className="text-sm text-slate-500">Arbre de compétences interactif par matière et classe.</p>
        </div>
        <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={grade} onChange={(event) => setGrade(event.target.value)}>
          {["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"].map((option) => <option key={option}>{option}</option>)}
        </select>
        <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" value={subject} onChange={(event) => setSubject(event.target.value as keyof typeof CHAPTER_TREE)}>
          {Object.keys(CHAPTER_TREE).map((option) => <option key={option}>{option}</option>)}
        </select>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <p className="mb-5 text-xs uppercase tracking-wider text-slate-400">Classe sélectionnée: {grade}</p>
        <div className="relative space-y-6">
          {CHAPTER_TREE[subject].map((node, index) => {
            const previousNode = index > 0 ? CHAPTER_TREE[subject][index - 1] : null;
            const previousMastery = previousNode ? masteryByNode[previousNode.id] ?? 0 : 100;
            const unlocked = index === 0 || previousMastery >= 70;
            const mastery = unlocked ? masteryByNode[node.id] ?? 0 : 0;
            return (
              <div key={node.id} className="relative pl-12">
                {index > 0 ? <div className="absolute left-5 top-[-22px] h-6 w-0.5 animate-pulse bg-violet-300" /> : null}
                <div className={`rounded-2xl border px-4 py-4 transition ${unlocked ? mastery >= 70 ? "border-amber-300 bg-amber-50 shadow-[0_0_22px_rgba(245,158,11,0.25)]" : "border-violet-200 bg-violet-50" : "border-slate-200 bg-slate-100"}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500">{node.chapter}</p>
                      <p className="font-black text-slate-800">{node.label}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {!unlocked ? <Lock className="h-4 w-4 text-slate-500" /> : null}
                      <span className={unlocked ? "text-violet-700" : "text-slate-500"}>{mastery}% maîtrise</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/80">
                    <div className={`h-2 rounded-full transition-all ${unlocked ? mastery >= 70 ? "bg-amber-400" : "bg-violet-500" : "bg-slate-300"}`} style={{ width: `${mastery}%` }} />
                  </div>
                  {!unlocked ? <p className="mt-2 text-xs text-slate-500">Débloque ce chapitre en atteignant 70% sur le précédent.</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
