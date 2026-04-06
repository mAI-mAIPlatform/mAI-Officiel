"use client";

import { BookOpenCheck, FileText, GraduationCap, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

const grades = ["6e", "5e", "4e", "3e", "2nde", "1ère", "Terminale"] as const;
const difficulties = ["Facile", "Moyen", "Difficile"] as const;
const subjects = ["Mathématiques", "Français", "Histoire", "SVT", "Physique"] as const;

function clampQuestionCount(value: number) {
  // Bugfix proactif: on borne la valeur pour éviter 0, NaN ou des volumes trop élevés.
  if (Number.isNaN(value)) {
    return 5;
  }

  return Math.min(20, Math.max(1, Math.round(value)));
}

function buildQuiz(prompt: string, grade: string, difficulty: string, count: number) {
  const safePrompt = prompt.trim() || "Réviser les notions clés du chapitre";

  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    question: `Q${index + 1} (${grade} · ${difficulty}) — ${safePrompt}`,
    choices: ["Option A", "Option B", "Option C", "Option D"],
  }));
}

function buildExercises(
  prompt: string,
  grade: string,
  difficulty: string,
  subject: string,
  count: number
) {
  const safePrompt = prompt.trim() || "S'entraîner sur les points à consolider";

  return Array.from({ length: count }, (_, index) =>
    `${index + 1}. ${subject} (${grade} · ${difficulty}) — ${safePrompt}`
  );
}

function buildCourseSheet(prompt: string, subject: string, grade: string) {
  const safePrompt = prompt.trim() || "Synthèse du chapitre";

  return [
    `Objectif: maîtriser ${safePrompt} en ${subject} (${grade}).`,
    "Résumé structuré: concepts, méthode, erreurs fréquentes.",
    "Mini-fiche: définitions essentielles, formule/règle clé, checklist de révision.",
    "Plan d'action: 20 min cours + 20 min quiz + 20 min exercices.",
  ];
}

export default function LearnUpPage() {
  const [prompt, setPrompt] = useState("");
  const [grade, setGrade] = useState<(typeof grades)[number]>("3e");
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>("Moyen");
  const [subject, setSubject] = useState<(typeof subjects)[number]>("Mathématiques");
  const [questionCount, setQuestionCount] = useState(5);

  const safeQuestionCount = clampQuestionCount(questionCount);

  const quiz = useMemo(
    () => buildQuiz(prompt, grade, difficulty, safeQuestionCount),
    [difficulty, grade, prompt, safeQuestionCount]
  );

  const exercises = useMemo(
    () => buildExercises(prompt, grade, difficulty, subject, safeQuestionCount),
    [difficulty, grade, prompt, safeQuestionCount, subject]
  );

  const courseSheet = useMemo(
    () => buildCourseSheet(prompt, subject, grade),
    [grade, prompt, subject]
  );

  return (
    <div className="liquid-glass mx-auto flex h-full w-full max-w-6xl flex-col gap-5 overflow-y-auto p-6">
      <header className="liquid-glass rounded-2xl border border-border/50 p-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <GraduationCap className="size-6 text-primary" /> LearnUp
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Outil de révision intelligent: générateur de quiz, exercices ciblés et
          fiches/cours automatiques en interface Liquid Glass.
        </p>
      </header>

      <section className="liquid-glass grid gap-4 rounded-2xl border border-border/50 p-5 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          Prompt pédagogique
          <textarea
            className="mt-1 min-h-24 w-full rounded-xl border border-border/60 bg-background/60 p-3"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ex: Révision fractions et pourcentages avec cas concrets."
            value={prompt}
          />
        </label>

        <label className="text-sm">
          Classe
          <select
            className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2"
            onChange={(event) => setGrade(event.target.value as (typeof grades)[number])}
            value={grade}
          >
            {grades.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Difficulté
          <select
            className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2"
            onChange={(event) =>
              setDifficulty(event.target.value as (typeof difficulties)[number])
            }
            value={difficulty}
          >
            {difficulties.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Nombre de questions
          <input
            className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2"
            max={20}
            min={1}
            onChange={(event) => setQuestionCount(Number(event.target.value))}
            type="number"
            value={safeQuestionCount}
          />
        </label>

        <label className="text-sm">
          Matière
          <select
            className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2"
            onChange={(event) =>
              setSubject(event.target.value as (typeof subjects)[number])
            }
            value={subject}
          >
            {subjects.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="liquid-glass rounded-2xl border border-border/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <BookOpenCheck className="size-4 text-primary" /> Générateur de Quiz
          </h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {quiz.map((item) => (
              <li className="rounded-xl border border-border/40 bg-background/40 p-3" key={item.id}>
                <p className="font-medium text-foreground">{item.question}</p>
                <p className="mt-1 text-xs">{item.choices.join(" · ")}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="liquid-glass rounded-2xl border border-border/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-primary" /> Générateur d&apos;Exercices
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {exercises.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>

        <article className="liquid-glass rounded-2xl border border-border/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <FileText className="size-4 text-primary" /> Fiches & Cours
          </h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {courseSheet.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
