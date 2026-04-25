"use client";

import { CheckCircle2, Clock3, RotateCcw, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

function generateQuestions(topic: string, difficulty: string, count: number): QuizQuestion[] {
  const safeTopic = topic.trim() || "culture générale";
  return Array.from({ length: count }).map((_, index) => {
    const base = index + 1;
    const correct = base % 4;
    return {
      id: `q-${base}`,
      question: `[${difficulty}] ${safeTopic} — question ${base}`,
      options: [
        `Option A sur ${safeTopic}`,
        `Option B sur ${safeTopic}`,
        `Option C sur ${safeTopic}`,
        `Option D sur ${safeTopic}`,
      ],
      correctIndex: correct,
      explanation:
        "La bonne réponse est calculée pour ce quiz interactif. Vous pouvez rejouer et comparer vos scores.",
    };
  });
}

export default function QuizPage() {
  const params = useSearchParams();
  const topic = params.get("topic") ?? "culture générale";
  const difficulty = params.get("difficulty") ?? "moyen";
  const questionCount = Math.min(30, Math.max(2, Number(params.get("count") ?? 5)));
  const timerMinutes = Math.min(120, Math.max(1, Number(params.get("timer") ?? 10)));

  const questions = useMemo(
    () => generateQuestions(topic, difficulty, questionCount),
    [difficulty, questionCount, topic]
  );

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(
    () =>
      questions.reduce(
        (acc, question) =>
          acc + (answers[question.id] === question.correctIndex ? 1 : 0),
        0
      ),
    [answers, questions]
  );

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <section className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold">Quiz interactif QCM</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sujet: <strong>{topic}</strong> • Difficulté: <strong>{difficulty}</strong>
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" /> Minuteur conseillé: {timerMinutes} min
        </p>
      </section>

      <section className="space-y-3">
        {questions.map((question, index) => (
          <article className="rounded-2xl border border-border/60 bg-card/70 p-4" key={question.id}>
            <p className="font-medium">{index + 1}. {question.question}</p>
            <div className="mt-3 grid gap-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === optionIndex;
                const isCorrect = submitted && optionIndex === question.correctIndex;
                const isWrongSelected = submitted && selected && !isCorrect;
                return (
                  <button
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isCorrect
                        ? "border-emerald-400/70 bg-emerald-500/10"
                        : isWrongSelected
                          ? "border-rose-400/70 bg-rose-500/10"
                          : selected
                            ? "border-primary/50 bg-primary/10"
                            : "border-border/60 bg-background/50"
                    }`}
                    key={`${question.id}-${option}`}
                    onClick={() =>
                      setAnswers((current) => ({ ...current, [question.id]: optionIndex }))
                    }
                    type="button"
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {submitted ? (
              <p className="mt-2 text-xs text-muted-foreground">{question.explanation}</p>
            ) : null}
          </article>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setSubmitted(true)} type="button">
          <CheckCircle2 className="mr-2 size-4" /> Corriger le QCM
        </Button>
        <Button
          onClick={() => {
            setSubmitted(false);
            setAnswers({});
          }}
          type="button"
          variant="outline"
        >
          <RotateCcw className="mr-2 size-4" /> Recommencer
        </Button>
        {submitted ? (
          <span className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
            <Trophy className="size-4 text-primary" /> Score: {score}/{questions.length}
          </span>
        ) : null}
      </section>
    </main>
  );
}
