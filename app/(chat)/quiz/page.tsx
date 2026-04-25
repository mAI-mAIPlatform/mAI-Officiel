"use client";

import { CheckCircle2, Clock3, RotateCcw, Send, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { addStatsEvent } from "@/lib/user-stats";

type QuizQuestion = {
  answerGuide: string;
  id: string;
  question: string;
};

export default function QuizPage() {
  const params = useSearchParams();
  const topic = params.get("topic") ?? "culture générale";
  const difficulty = params.get("difficulty") ?? "moyen";
  const questionCount = Math.min(30, Math.max(2, Number(params.get("count") ?? 5)));
  const timerMinutes = Math.min(120, Math.max(1, Number(params.get("timer") ?? 10)));
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<
    Record<string, { feedback: string; isCorrect: boolean; score: number }>
  >({});
  const [globalCorrectionFeedback, setGlobalCorrectionFeedback] = useState("");

  useEffect(() => {
    const abortController = new AbortController();

    const generateQuiz = async () => {
      setIsGenerating(true);
      setGenerationError(null);
      setSubmitted(false);
      setAnswers({});
      setCorrections({});
      setCorrectionError(null);
      setGlobalCorrectionFeedback("");

      try {
        const response = await fetch("/api/quiz/generate", {
          body: JSON.stringify({
            count: questionCount,
            difficulty,
            timer: timerMinutes,
            topic,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("La génération IA du quiz a échoué.");
        }
        addStatsEvent("api_call", 1);

        const payload = (await response.json()) as {
          questions?: Array<{
            answerGuide: string;
            id: string;
            question: string;
          }>;
        };

        const normalizedQuestions =
          payload.questions?.slice(0, questionCount).map((question, index) => ({
            answerGuide: question.answerGuide,
            id: question.id || `q-${index + 1}`,
            question: question.question,
          })) ?? [];

        if (normalizedQuestions.length < 2) {
          throw new Error("Le quiz IA est incomplet.");
        }

        setQuestions(normalizedQuestions);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        setGenerationError(
          error instanceof Error
            ? error.message
            : "Erreur inconnue pendant la génération."
        );
        setQuestions([]);
      } finally {
        if (!abortController.signal.aborted) {
          setIsGenerating(false);
        }
      }
    };

    generateQuiz();

    return () => {
      abortController.abort();
    };
  }, [difficulty, questionCount, timerMinutes, topic]);

  const score = useMemo(
    () =>
      questions.reduce(
        (acc, question) =>
          acc + (corrections[question.id]?.score ?? 0),
        0
      ),
    [corrections, questions]
  );

  const canSubmitQuiz = useMemo(
    () =>
      questions.length > 0 &&
      questions.every((question) => (answers[question.id] ?? "").trim().length > 0),
    [answers, questions]
  );

  const handleCorrection = async () => {
    setSubmitted(false);
    setIsCorrecting(true);
    setCorrectionError(null);

    try {
      const response = await fetch("/api/quiz/correct", {
        body: JSON.stringify({
          difficulty,
          questions,
          topic,
          userAnswers: answers,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("La correction IA a échoué.");
      }

      const payload = (await response.json()) as {
        corrections?: Array<{
          feedback: string;
          id: string;
          isCorrect: boolean;
          score: number;
        }>;
        globalFeedback?: string;
      };

      const nextCorrections = Object.fromEntries(
        (payload.corrections ?? []).map((item) => [
          item.id,
          {
            feedback: item.feedback,
            isCorrect: item.isCorrect,
            score: item.score,
          },
        ])
      );

      if (Object.keys(nextCorrections).length === 0) {
        throw new Error("Aucune correction exploitable n'a été renvoyée.");
      }

      setCorrections(nextCorrections);
      setGlobalCorrectionFeedback(payload.globalFeedback ?? "");
      setSubmitted(true);
      addStatsEvent("api_call", 1);
    } catch (error) {
      setCorrectionError(
        error instanceof Error
          ? error.message
          : "Erreur inconnue pendant la correction."
      );
    } finally {
      setIsCorrecting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-8">
      <section className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
        <h1 className="text-2xl font-semibold">Quiz interactif (réponses libres)</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sujet: <strong>{topic}</strong> • Difficulté: <strong>{difficulty}</strong>
        </p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="size-3.5" /> Minuteur conseillé: {timerMinutes} min
        </p>
      </section>

      {isGenerating ? (
        <section className="rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur-xl">
          <p className="text-sm font-medium">Réflexion, Préparation...</p>
          <p className="mt-2 text-xs text-muted-foreground">
            L&apos;IA prépare un quiz personnalisé en fonction de votre sujet et
            du niveau demandé.
          </p>
        </section>
      ) : null}

      {generationError ? (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">
          {generationError}
        </section>
      ) : null}

      <section className="space-y-3">
        {questions.map((question, index) => (
          <article className="rounded-2xl border border-border/60 bg-card/70 p-4" key={question.id}>
            <p className="font-medium">{index + 1}. {question.question}</p>
            <textarea
              className="mt-3 min-h-24 w-full rounded-xl border border-border/60 bg-background/60 p-3 text-sm outline-none ring-0 focus:border-primary/50"
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }))
              }
              placeholder="Écrivez votre réponse manuellement ici…"
              value={answers[question.id] ?? ""}
            />
            {submitted ? (
              <div
                className={`mt-3 rounded-xl border p-3 text-sm ${
                  corrections[question.id]?.isCorrect
                    ? "border-emerald-400/70 bg-emerald-500/10"
                    : "border-amber-400/70 bg-amber-500/10"
                }`}
              >
                <p className="font-medium">
                  {corrections[question.id]?.isCorrect ? "Réponse validée" : "À améliorer"}
                </p>
                <p className="mt-1 text-xs">{corrections[question.id]?.feedback}</p>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      {correctionError ? (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">
          {correctionError}
        </section>
      ) : null}

      {!isGenerating && questions.length > 0 ? (
        <section className="flex flex-wrap items-center gap-2">
        <Button disabled={!canSubmitQuiz || isCorrecting} onClick={handleCorrection} type="button">
          <Send className="mr-2 size-4" /> {isCorrecting ? "Correction..." : "Envoyer mes réponses à l'IA"}
        </Button>
        <Button
          onClick={() => {
            setSubmitted(false);
            setAnswers({});
            setCorrections({});
            setCorrectionError(null);
            setGlobalCorrectionFeedback("");
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
      ) : null}

      {submitted && globalCorrectionFeedback ? (
        <section className="rounded-2xl border border-border/60 bg-card/70 p-4 text-sm">
          <p className="inline-flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-4 text-primary" />
            Retour global de l&apos;IA
          </p>
          <p className="mt-2 text-muted-foreground">{globalCorrectionFeedback}</p>
        </section>
      ) : null}
    </main>
  );
}
