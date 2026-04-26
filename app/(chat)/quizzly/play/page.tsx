"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { finishQuiz } from "@/lib/quizzly/actions";
import { toast } from "sonner";
import { Play, CheckCircle, XCircle, Shuffle } from "lucide-react";
import { chatModels } from "@/lib/ai/models";

const GRADES = [
  "CE1",
  "CE2",
  "CM1",
  "CM2",
  "6ème",
  "5ème",
  "4ème",
  "3ème",
  "Seconde",
  "Première",
  "Terminale",
];
const SUBJECTS = [
  "Mathématiques",
  "Français",
  "Histoire",
  "Géographie",
  "Sciences",
  "Anglais",
  "Culture Générale",
  "Technologie",
];
const DIFFICULTIES = ["Facile", "Moyen", "Difficile"];
const RANDOM_MODEL_ID = "__random__";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};

type QuizResult = {
  xpGain: number;
  newLevel: number;
};

function normalizeQuizCount(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return 5;
  }
  return Math.min(20, Math.max(1, parsed));
}

export default function QuizzlyPlayPage() {
  const router = useRouter();

  const [step, setStep] = useState<"setup" | "loading" | "playing" | "result">("setup");

  // Setup State
  const [grade, setGrade] = useState("3ème");
  const [subject, setSubject] = useState("Mathématiques");
  const [difficulty, setDifficulty] = useState("Moyen");
  const [count, setCount] = useState(5);
  const [modelId, setModelId] = useState(RANDOM_MODEL_ID);

  const textModels = useMemo(() => {
    const unique = new Map<string, { id: string; name: string; provider: string }>();
    for (const model of chatModels) {
      if (!unique.has(model.id)) {
        unique.set(model.id, {
          id: model.id,
          name: model.name,
          provider: model.provider,
        });
      }
    }
    return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
    );
  }, []);

  // Play State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Result State
  const [resultData, setResultData] = useState<QuizResult | null>(null);

  const startQuiz = async () => {
    setStep("loading");
    try {
      const chosenModelId =
        modelId === RANDOM_MODEL_ID
          ? textModels[Math.floor(Math.random() * textModels.length)]?.id
          : modelId;

      if (!chosenModelId) {
        throw new Error("Aucun modèle de génération disponible pour Quizzly.");
      }

      const res = await fetch("/api/quizzly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade,
          subject,
          difficulty,
          count,
          modelId: chosenModelId,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Erreur de génération du quiz");
      }

      const data = (await res.json()) as { questions: QuizQuestion[] };
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Le quiz généré est vide. Réessaie avec un autre modèle.");
      }

      setQuestions(data.questions);
      setStep("playing");
      setCurrentIndex(0);
      setCorrectAnswers(0);
      setIsAnswered(false);
      setSelectedOption(null);
      toast.success(`Quiz généré avec ${chosenModelId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(message);
      setStep("setup");
    }
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === questions[currentIndex].correctAnswerIndex;
    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      try {
        setStep("loading");
        const result = (await finishQuiz(correctAnswers, null)) as QuizResult;
        setResultData(result);
        setStep("result");
      } catch {
        toast.error("Erreur d'enregistrement des résultats");
        setStep("setup");
      }
    }
  };

  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
        <h2 className="text-2xl font-bold text-slate-700 animate-pulse">Génération de ton Quiz par l'IA...</h2>
      </div>
    );
  }

  if (step === "result" && resultData) {
    return (
      <div className="max-w-xl mx-auto mt-10 bg-white p-10 rounded-3xl border border-slate-100 shadow-xl text-center space-y-8">
        <h1 className="text-4xl font-black text-slate-800">Quiz Terminé !</h1>
        <div className="text-6xl font-black text-violet-600">
          {correctAnswers} / {questions.length}
        </div>
        <div className="bg-orange-50 text-orange-600 font-bold p-4 rounded-xl text-lg">
          +{resultData.xpGain} XP Gagnée !
        </div>
        <p className="text-slate-500">Niveau actuel : {resultData.newLevel}</p>

        <div className="pt-6">
          <button onClick={() => router.push("/quizzly")} className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-900 transition">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (step === "playing") {
    const q = questions[currentIndex];
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <span className="font-bold text-slate-500">Question {currentIndex + 1} sur {questions.length}</span>
          <span className="font-bold text-violet-600">{subject} • {difficulty}</span>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-8">{q.question}</h2>

          <div className="space-y-3">
            {q.options.map((opt: string, i: number) => {
              let btnClass = "border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-700";
              let icon = null;

              if (isAnswered) {
                if (i === q.correctAnswerIndex) {
                  btnClass = "border-green-500 bg-green-50 text-green-800";
                  icon = <CheckCircle className="text-green-500 w-6 h-6" />;
                } else if (i === selectedOption) {
                  btnClass = "border-red-500 bg-red-50 text-red-800";
                  icon = <XCircle className="text-red-500 w-6 h-6" />;
                } else {
                  btnClass = "border-slate-200 opacity-50";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-xl border-2 font-medium text-lg transition flex justify-between items-center ${btnClass}`}
                >
                  {opt}
                  {icon}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
              <span className="font-bold block mb-1">Explication :</span>
              {q.explanation}
            </div>
          )}

          {isAnswered && (
            <div className="mt-8 flex justify-end">
              <button onClick={handleNext} className="bg-violet-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-violet-700 transition">
                {currentIndex < questions.length - 1 ? "Question Suivante" : "Terminer"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Configurer un Quiz</h1>
        <p className="text-slate-500 mt-1">Personnalise ta partie générée par l'IA.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Classe</label>
            <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-violet-500">
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Matière</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-violet-500">
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Difficulté</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-violet-500">
              {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de questions</label>
            <input type="number" min={1} max={20} value={count} onChange={e => setCount(normalizeQuizCount(e.target.value))} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-violet-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Modèle d'IA</label>
          <select value={modelId} onChange={e => setModelId(e.target.value)} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-violet-500">
            <option value={RANDOM_MODEL_ID}>🎲 Aléatoire (tous les modèles texte)</option>
            {textModels.map(m => (
              <option key={m.id} value={m.id}>{m.name} · {m.provider}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Shuffle className="w-3 h-3" />
            Inclut OpenAI, Azure, AI Horde, Ollama, OpenRouter et autres modèles texte disponibles.
          </p>
        </div>

        <div className="pt-4">
          <button onClick={startQuiz} className="w-full bg-violet-600 text-white font-bold py-4 rounded-xl hover:bg-violet-700 transition flex items-center justify-center gap-2 text-lg shadow-lg">
            <Play className="w-5 h-5 fill-current" /> Lancer la génération
          </button>
        </div>
      </div>
    </div>
  );
}
