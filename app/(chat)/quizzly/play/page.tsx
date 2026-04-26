"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { finishQuiz } from "@/lib/quizzly/actions";
import { toast } from "sonner";
import { CheckCircle, Clock3, Download, Share2, XCircle } from "lucide-react";
import { chatModels, DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};

type SavedFavorite = {
  id: string;
  emoji: string;
  name: string;
  grade: string;
  subject: string;
  difficulty: string;
  count: number;
  chapter: string;
  themePrompt: string;
};

type LocalQuiz = {
  id: string;
  createdAt: string;
  grade: string;
  subject: string;
  difficulty: string;
  questions: QuizQuestion[];
  score: number;
};

const FAVORITES_KEY = "mai.quizzly.favorites.v1";
const LOCAL_QUIZ_KEY = "mai.quizzly.local-quizzes.v1";
const CHRONO_OPTIONS = [15, 30, 60] as const;
const GRADE_OPTIONS = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale", "Supérieur"] as const;
const SUBJECT_OPTIONS = ["Mathématiques", "Français", "Histoire", "Géographie", "SVT", "Physique-Chimie", "Anglais", "Philosophie"] as const;
const DIFFICULTY_OPTIONS = ["Facile", "Moyen", "Difficile", "Expert"] as const;
const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;

export default function QuizzlyPlayPage() {
  const router = useRouter();
  const [step, setStep] = useState<"setup" | "playing" | "loading" | "result">("setup");
  const [grade, setGrade] = useState("3ème");
  const [subject, setSubject] = useState("Mathématiques");
  const [difficulty, setDifficulty] = useState("Moyen");
  const [count, setCount] = useState(5);
  const [modelId, setModelId] = useState(DEFAULT_CHAT_MODEL);
  const [chapter, setChapter] = useState("");
  const [themePrompt, setThemePrompt] = useState("");
  const [chronoEnabled, setChronoEnabled] = useState(false);
  const [chronoSeconds, setChronoSeconds] = useState<number>(30);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [favorites, setFavorites] = useState<SavedFavorite[]>([]);
  const [localQuizzes, setLocalQuizzes] = useState<LocalQuiz[]>([]);

  const current = questions[index];

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"));
      setLocalQuizzes(JSON.parse(localStorage.getItem(LOCAL_QUIZ_KEY) ?? "[]"));
    } catch {
      setFavorites([]);
      setLocalQuizzes([]);
    }
  }, []);

  useEffect(() => {
    if (step !== "playing" || !chronoEnabled || selected !== null) return;
    setRemainingSeconds(chronoSeconds);
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setSelected(-1);
          toast.error("Temps écoulé: réponse comptée fausse.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [chronoEnabled, chronoSeconds, index, selected, step]);

  const progressColor = useMemo(() => {
    const ratio = remainingSeconds / chronoSeconds;
    if (ratio > 0.6) return "bg-emerald-500";
    if (ratio > 0.3) return "bg-orange-500";
    return "bg-red-500 animate-pulse";
  }, [remainingSeconds, chronoSeconds]);

  const persistFavorites = (next: SavedFavorite[]) => {
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };

  const persistLocalQuizzes = (next: LocalQuiz[]) => {
    setLocalQuizzes(next);
    localStorage.setItem(LOCAL_QUIZ_KEY, JSON.stringify(next));
  };

  const startQuiz = async () => {
    setStep("loading");
    try {
      const res = await fetch("/api/quizzly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, difficulty, count, chapter, themePrompt, modelId }),
      });
      const data = (await res.json()) as { questions?: QuizQuestion[]; error?: string };
      if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(data.error ?? "Génération impossible");
      }
      setQuestions(data.questions);
      setIndex(0);
      setSelected(null);
      setCorrect(0);
      setStep("playing");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inattendue");
      setStep("setup");
    }
  };

  const saveFavorite = () => {
    if (favorites.length >= 20) {
      toast.error("Limite de 20 favoris atteinte.");
      return;
    }
    const name = prompt("Nom du favori ?")?.trim();
    if (!name) return;
    const emoji = prompt("Emoji du favori ?", "⭐")?.trim() || "⭐";
    const next: SavedFavorite[] = [
      {
        id: crypto.randomUUID(),
        emoji,
        name,
        grade,
        subject,
        difficulty,
        count,
        chapter,
        themePrompt,
      },
      ...favorites,
    ].slice(0, 20);
    persistFavorites(next);
    toast.success("Favori enregistré.");
  };

  const finish = async () => {
    setStep("loading");
    await finishQuiz(correct, null);
    const nextLocal: LocalQuiz[] = [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        grade,
        subject,
        difficulty,
        questions,
        score: correct,
      },
      ...localQuizzes,
    ].slice(0, 50);
    persistLocalQuizzes(nextLocal);
    setStep("result");
  };

  const nextQuestion = async () => {
    if (index >= questions.length - 1) {
      await finish();
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected(null);
  };

  const downloadQuiz = () => {
    const content = questions
      .map(
        (q, qIndex) =>
          `Q${qIndex + 1}. ${q.question}\n` +
          q.options.map((opt, i) => `  ${i + 1}) ${opt}`).join("\n") +
          `\nRéponse: ${q.options[q.correctAnswerIndex]}\nExplication: ${q.explanation}`
      )
      .join("\n\n");

    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quizzly-${subject}-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareResult = () => {
    const text = `🏆 Quizzly\n${subject} • ${difficulty}\nScore: ${correct}/${questions.length}\n#Quizzly`;
    navigator.clipboard.writeText(text);
    toast.success("Résultat copié (partage rapide)");
  };

  if (step === "loading") {
    return <div className="py-24 text-center font-bold text-slate-600">Chargement du quiz…</div>;
  }

  if (step === "result") {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-black text-slate-800">Quiz terminé !</h1>
        <p className="text-lg font-semibold text-violet-700">{correct} / {questions.length}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold" onClick={downloadQuiz} type="button"><Download className="mr-1 inline h-4 w-4" /> Télécharger PDF</button>
          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white" onClick={shareResult} type="button"><Share2 className="mr-1 inline h-4 w-4" /> Partager</button>
          <button className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white" onClick={() => setStep("setup")} type="button">Rejouer</button>
        </div>
      </div>
    );
  }

  if (step === "playing" && current) {
    const ratio = chronoEnabled ? (remainingSeconds / chronoSeconds) * 100 : 100;
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-700">Question {index + 1}/{questions.length}</p>
            {chronoEnabled && (
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <Clock3 className="h-4 w-4" /> {remainingSeconds}s
              </div>
            )}
          </div>
          {chronoEnabled && (
            <div className="mt-2 h-2 rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${Math.max(0, ratio)}%` }} />
            </div>
          )}
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-black text-slate-800">{current.question}</h2>
          <div className="space-y-2">
            {current.options.map((opt, i) => {
              const isCorrect = i === current.correctAnswerIndex;
              const isSelected = selected === i;
              const showState = selected !== null;
              return (
                <button
                  key={opt}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${showState ? isCorrect ? "border-green-500 bg-green-50" : isSelected ? "border-red-500 bg-red-50" : "opacity-60" : "border-slate-200 hover:border-violet-300"}`}
                  disabled={selected !== null}
                  onClick={() => {
                    setSelected(i);
                    if (isCorrect) {
                      const bonus = chronoEnabled ? Math.max(0, Math.floor(remainingSeconds / 5)) : 0;
                      setCorrect((prev) => prev + 1 + bonus);
                    }
                  }}
                  type="button"
                >
                  <span>{opt}</span>
                  {showState && isCorrect ? <CheckCircle className="h-4 w-4 text-green-600" /> : null}
                  {showState && !isCorrect && isSelected ? <XCircle className="h-4 w-4 text-red-600" /> : null}
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
              <strong>Explication:</strong> {current.explanation}
            </div>
          )}
          {selected !== null && (
            <div className="mt-4 flex justify-end">
              <button className="rounded-xl bg-violet-600 px-4 py-2 font-bold text-white" onClick={nextQuestion} type="button">
                {index < questions.length - 1 ? "Suivant" : "Terminer"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-800">Configurer un quiz</h1>
        <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold" onClick={saveFavorite} type="button">
          ⭐ Sauvegarder en favori
        </button>
      </div>

      {favorites.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Favoris</p>
          <div className="flex flex-wrap gap-2">
            {favorites.map((favorite) => (
              <button
                key={favorite.id}
                className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700"
                onClick={() => {
                  setGrade(favorite.grade);
                  setSubject(favorite.subject);
                  setDifficulty(favorite.difficulty);
                  setCount(favorite.count);
                  setChapter(favorite.chapter);
                  setThemePrompt(favorite.themePrompt);
                }}
                type="button"
              >
                {favorite.emoji} {favorite.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Classe
          <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" value={grade} onChange={(e) => setGrade(e.target.value)}>
            {GRADE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">Matière
          <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" value={subject} onChange={(e) => setSubject(e.target.value)}>
            {SUBJECT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">Difficulté
          <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {DIFFICULTY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">Nombre de questions
          <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" value={count} onChange={(e) => setCount(Number(e.target.value) || 5)}>
            {QUESTION_COUNT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">Modèle IA
          <select className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" value={modelId} onChange={(e) => setModelId(e.target.value)}>
            {chatModels.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
          </select>
        </label>
        <input className="rounded-xl border border-slate-200 bg-white px-3 py-2" placeholder="Chapitre" value={chapter} onChange={(e) => setChapter(e.target.value)} />
        <input className="rounded-xl border border-slate-200 bg-white px-3 py-2" placeholder="Thème" value={themePrompt} onChange={(e) => setThemePrompt(e.target.value)} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="mb-2 font-bold text-slate-700">⏱️ Mode chrono</p>
        <label className="mr-4 text-sm">
          <input checked={chronoEnabled} onChange={(e) => setChronoEnabled(e.target.checked)} type="checkbox" /> Activer
        </label>
        {chronoEnabled && (
          <select className="rounded-lg border border-slate-200 px-2 py-1 text-sm" value={chronoSeconds} onChange={(e) => setChronoSeconds(Number(e.target.value))}>
            {CHRONO_OPTIONS.map((seconds) => (
              <option key={seconds} value={seconds}>{seconds}s</option>
            ))}
          </select>
        )}
      </div>

      {localQuizzes.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Quiz locaux sauvegardés ({localQuizzes.length}/50)</p>
          <div className="space-y-2">
            {localQuizzes.slice(0, 5).map((quiz) => (
              <button
                key={quiz.id}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm"
                onClick={() => {
                  setQuestions(quiz.questions);
                  setIndex(0);
                  setSelected(null);
                  setCorrect(0);
                  setStep("playing");
                }}
                type="button"
              >
                {quiz.subject} • {quiz.difficulty} • score précédent: {quiz.score}/{quiz.questions.length}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white" onClick={startQuiz} type="button">Lancer</button>
        <button className="rounded-xl bg-slate-800 px-5 py-3 font-bold text-white" onClick={() => router.push("/quizzly")} type="button">Retour</button>
      </div>
    </div>
  );
}
