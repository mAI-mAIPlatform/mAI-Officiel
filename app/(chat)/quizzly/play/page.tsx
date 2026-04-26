"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { finishQuiz, getQuizzlyInventory, getQuizzlyProfile, spendHintDiamonds } from "@/lib/quizzly/actions";
import { toast } from "sonner";
import { CheckCircle, Clock3, Download, Heart, Lightbulb, Shield, Share2, Snowflake, Sword, Trophy, XCircle } from "lucide-react";
import { chatModels, DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
};
type CustomDraftQuestion = {
  id: string;
  question: string;
  options: [string, string, string, string];
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
type DuelOpponent = {
  pseudo: string;
  emoji: string;
  elo: number;
  level: number;
  streak: number;
};
type HintType = "fifty" | "first_letter" | "contextual";

const FAVORITES_KEY = "mai.quizzly.favorites.v1";
const LOCAL_QUIZ_KEY = "mai.quizzly.local-quizzes.v1";
const CHRONO_OPTIONS = [15, 30, 60] as const;
const GRADE_OPTIONS = ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale", "Supérieur"] as const;
const SUBJECT_OPTIONS = ["Mathématiques", "Français", "Histoire", "Géographie", "SVT", "Physique-Chimie", "Anglais", "Philosophie"] as const;
const DIFFICULTY_OPTIONS = ["Facile", "Moyen", "Difficile", "Expert"] as const;
const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;
const QUESTION_TYPE_OPTIONS = ["qcm", "vrai_faux", "association", "completer", "inverse"] as const;
const REVIEW_QUEUE_KEY = "mai.quizzly.review.v1";
const REVIEW_INTERVALS_DAYS = [1, 3, 7, 30] as const;
type ReviewCard = { question: QuizQuestion; stage: number; dueAt: string };
const SUBJECT_COEFFICIENTS: Record<string, number> = {
  "Mathématiques": 2,
  Français: 2,
  Histoire: 1,
  Géographie: 1,
  SVT: 1,
  "Physique-Chimie": 1,
  Anglais: 1,
  Philosophie: 1,
};

export default function QuizzlyPlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"setup" | "playing" | "loading" | "result" | "matchmaking" | "duel" | "duelResult" | "survival" | "survivalResult">("setup");
  const [gameMode, setGameMode] = useState<"classic" | "duel" | "survival">("classic");
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
  const [quizStartedAt, setQuizStartedAt] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [favorites, setFavorites] = useState<SavedFavorite[]>([]);
  const [localQuizzes, setLocalQuizzes] = useState<LocalQuiz[]>([]);
  const [examMode, setExamMode] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<string[]>(["qcm"]);
  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [strictScore, setStrictScore] = useState(0);
  const [customQuestions, setCustomQuestions] = useState<CustomDraftQuestion[]>([]);
  const [profile, setProfile] = useState<{ pseudo: string; emoji: string; level: number; streak: number; diamonds: number } | null>(null);
  const [eloScore, setEloScore] = useState(1000);
  const [matchmakingSeconds, setMatchmakingSeconds] = useState(0);
  const [duelOpponent, setDuelOpponent] = useState<DuelOpponent | null>(null);
  const [duelPlayerAnswers, setDuelPlayerAnswers] = useState<(number | null)[]>([]);
  const [duelOpponentAnswers, setDuelOpponentAnswers] = useState<(number | null)[]>([]);
  const [duelIndex, setDuelIndex] = useState(0);
  const [duelSelected, setDuelSelected] = useState<number | null>(null);
  const [duelStartedAt, setDuelStartedAt] = useState<number | null>(null);
  const [survivalLives, setSurvivalLives] = useState(3);
  const [survivalStage, setSurvivalStage] = useState(1);
  const [survivalScore, setSurvivalScore] = useState(0);
  const [survivalStartedAt, setSurvivalStartedAt] = useState<number | null>(null);
  const [survivalLeaderboard, setSurvivalLeaderboard] = useState<Array<{ pseudo: string; score: number; stage: number; duration: number }>>([]);
  const [survivalFreezeSeconds, setSurvivalFreezeSeconds] = useState(0);
  const [survivalBonusLives, setSurvivalBonusLives] = useState(0);
  const [usedHintsByQuestion, setUsedHintsByQuestion] = useState<Record<number, HintType[]>>({});
  const [disabledOptionsByQuestion, setDisabledOptionsByQuestion] = useState<Record<number, number[]>>({});
  const [contextHintByQuestion, setContextHintByQuestion] = useState<Record<number, string>>({});
  const [hintPanelOpen, setHintPanelOpen] = useState(false);
  const [hintBusy, setHintBusy] = useState<HintType | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [hintedQuestions, setHintedQuestions] = useState<number[]>([]);

  const current = questions[index];
  const duelCurrent = questions[duelIndex];
  const survivalCurrent = questions[index];

  const computeSimplifiedElo = (successRate: number, levelValue: number, streakValue: number) =>
    Math.round(700 + successRate * 300 + levelValue * 12 + Math.min(streakValue, 30) * 4);

  const inferDifficultyFromStage = (stage: number): "Facile" | "Moyen" | "Difficile" | "Expert" => {
    if (stage <= 5) return "Facile";
    if (stage <= 10) return "Moyen";
    if (stage <= 15) return "Difficile";
    return "Expert";
  };

  const survivalSubjectPool = SUBJECT_OPTIONS;

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"));
      setLocalQuizzes(JSON.parse(localStorage.getItem(LOCAL_QUIZ_KEY) ?? "[]"));
      const rawReview = JSON.parse(localStorage.getItem(REVIEW_QUEUE_KEY) ?? "[]");
      const sanitized = Array.isArray(rawReview)
        ? rawReview.filter(
            (item) =>
              item &&
              typeof item.dueAt === "string" &&
              Number.isFinite(new Date(item.dueAt).getTime()) &&
              item.question &&
              typeof item.question.question === "string"
          )
        : [];
      setReviewCards(sanitized);
    } catch {
      setFavorites([]);
      setLocalQuizzes([]);
      setReviewCards([]);
    }
  }, []);

  useEffect(() => {
    Promise.all([getQuizzlyProfile(), getQuizzlyInventory()]).then(([p, inv]) => {
      const asProfile = p as { pseudo: string; emoji: string; level: number; streak: number; diamonds: number };
      setProfile(asProfile);
      const stats = inv as Array<{ itemKey: string; quantity: number }>;
      const totalCorrect = stats.find((item) => item.itemKey === "stats:total-correct")?.quantity ?? 0;
      const totalPlayed = stats.find((item) => item.itemKey === "stats:quiz-played")?.quantity ?? 1;
      const successRate = Math.min(1, totalCorrect / Math.max(1, totalPlayed * 10));
      setEloScore(computeSimplifiedElo(successRate, asProfile.level, asProfile.streak));
    }).catch(() => undefined);

    try {
      setSurvivalLeaderboard(JSON.parse(localStorage.getItem("mai.quizzly.survival.lb.v1") ?? "[]"));
    } catch {
      setSurvivalLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(REVIEW_QUEUE_KEY, JSON.stringify(reviewCards));
  }, [reviewCards]);

  useEffect(() => {
    const shared = searchParams?.get("quiz");
    if (!shared) return;
    try {
      const payload = JSON.parse(atob(shared));
      setGrade(payload.grade ?? grade);
      setSubject(payload.subject ?? subject);
      setDifficulty(payload.difficulty ?? difficulty);
      setCount(Number(payload.count) || count);
      setChapter(payload.chapter ?? "");
      setThemePrompt(payload.themePrompt ?? "");
      setQuestionTypes(Array.isArray(payload.questionTypes) ? payload.questionTypes : ["qcm"]);
      if (Array.isArray(payload.customQuestions)) {
        const imported = payload.customQuestions
          .map((item: any) => ({
            id: crypto.randomUUID(),
            question: String(item?.question ?? "").slice(0, 300),
            options: [
              String(item?.options?.[0] ?? ""),
              String(item?.options?.[1] ?? ""),
              String(item?.options?.[2] ?? ""),
              String(item?.options?.[3] ?? ""),
            ] as [string, string, string, string],
            correctAnswerIndex: Math.min(3, Math.max(0, Number(item?.correctAnswerIndex) || 0)),
            explanation: String(item?.explanation ?? "").slice(0, 500),
          }))
          .filter((item: CustomDraftQuestion) => item.question.trim().length > 0);
        setCustomQuestions(imported.slice(0, 20));
      }
    } catch {
      // ignore invalid share payload
    }
  }, [searchParams]);

  useEffect(() => {
    if (step !== "matchmaking") return;
    const timer = setInterval(() => setMatchmakingSeconds((prev) => prev + 1), 1000);
    const lock = setTimeout(() => {
      const opponentLevel = Math.max(1, (profile?.level ?? 8) + Math.floor((Math.random() - 0.5) * 4));
      const opponentStreak = Math.max(0, (profile?.streak ?? 4) + Math.floor((Math.random() - 0.5) * 6));
      const opponentElo = eloScore + Math.floor((Math.random() - 0.5) * 90);
      setDuelOpponent({
        pseudo: ["Nova", "Kira", "Atlas", "Milo", "Lina"][Math.floor(Math.random() * 5)] ?? "Rival",
        emoji: ["⚡", "🦊", "🚀", "🧠", "🔥"][Math.floor(Math.random() * 5)] ?? "⚔️",
        elo: opponentElo,
        level: opponentLevel,
        streak: opponentStreak,
      });
      setStep("loading");
      startDuelQuiz();
    }, 2600 + Math.floor(Math.random() * 2000));

    return () => {
      clearInterval(timer);
      clearTimeout(lock);
    };
  }, [step, eloScore, profile]);

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
    if (gameMode === "duel") {
      setMatchmakingSeconds(0);
      setStep("matchmaking");
      return;
    }
    if (gameMode === "survival") {
      await startSurvivalMode();
      return;
    }
    if (examMode) {
      setChronoEnabled(true);
    }
    if (customQuestions.length > 0) {
      const prepared = customQuestions
        .filter((item) => item.question.trim().length > 0 && item.options.every((opt) => opt.trim().length > 0))
        .map((item) => ({
          question: item.question.trim(),
          options: item.options.map((opt) => opt.trim()),
          correctAnswerIndex: item.correctAnswerIndex,
          explanation: item.explanation.trim() || "Réponse issue du quiz personnalisé.",
        }));
      if (prepared.length > 0) {
        setQuestions(prepared);
        setIndex(0);
        setSelected(null);
        setCorrect(0);
        setStrictScore(0);
        setUsedHintsByQuestion({});
        setDisabledOptionsByQuestion({});
        setContextHintByQuestion({});
        setHintedQuestions([]);
        setAnswerInput("");
        setQuizStartedAt(Date.now());
        setStep("playing");
        return;
      }
    }
    setStep("loading");
    try {
      const res = await fetch("/api/quizzly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, difficulty, count, chapter, themePrompt, modelId, questionTypes }),
      });
      const data = (await res.json()) as { questions?: QuizQuestion[]; error?: string };
      if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(data.error ?? "Génération impossible");
      }
      setQuestions(data.questions);
      setIndex(0);
      setSelected(null);
      setCorrect(0);
      setStrictScore(0);
      setUsedHintsByQuestion({});
      setDisabledOptionsByQuestion({});
      setContextHintByQuestion({});
      setHintedQuestions([]);
      setAnswerInput("");
      setQuizStartedAt(Date.now());
      setStep("playing");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inattendue");
      setStep("setup");
    }
  };

  const startDuelQuiz = async () => {
    try {
      const duelCount = Math.max(5, Math.min(10, count));
      const res = await fetch("/api/quizzly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, difficulty, count: duelCount, chapter, themePrompt, modelId, questionTypes }),
      });
      const data = (await res.json()) as { questions?: QuizQuestion[]; error?: string };
      if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(data.error ?? "Génération duel impossible");
      }
      setQuestions(data.questions);
      setDuelPlayerAnswers(new Array(data.questions.length).fill(null));
      setDuelOpponentAnswers(new Array(data.questions.length).fill(null));
      setDuelIndex(0);
      setDuelSelected(null);
      setDuelStartedAt(Date.now());
      setStep("duel");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur duel inattendue");
      setStep("setup");
    }
  };

  const startSurvivalMode = async () => {
    setStep("loading");
    setSurvivalLives(3);
    setSurvivalStage(1);
    setSurvivalScore(0);
    setIndex(0);
    setSelected(null);
    setSurvivalFreezeSeconds(0);
    setSurvivalStartedAt(Date.now());
    await loadNextSurvivalBatch(1);
    setStep("survival");
  };

  const loadNextSurvivalBatch = async (stageValue: number) => {
    const nextDifficulty = inferDifficultyFromStage(stageValue);
    const nextSubject = survivalSubjectPool[Math.floor(Math.random() * survivalSubjectPool.length)] ?? subject;
    const res = await fetch("/api/quizzly/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade, subject: nextSubject, difficulty: nextDifficulty, count: 5, chapter: "", themePrompt: `Palier ${stageValue} en mode survie`, modelId, questionTypes: ["qcm"] }),
    });
    const data = (await res.json()) as { questions?: QuizQuestion[]; error?: string };
    if (!res.ok || !Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error(data.error ?? "Impossible de charger des questions de survie");
    }
    setSubject(nextSubject);
    setDifficulty(nextDifficulty);
    setQuestions(data.questions);
    setIndex(0);
    setSelected(null);
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
    const completionSeconds =
      quizStartedAt && quizStartedAt > 0
        ? Math.max(1, Math.floor((Date.now() - quizStartedAt) / 1000))
        : null;
    await finishQuiz(correct, null, completionSeconds);
    const nextLocal: LocalQuiz[] = [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        grade,
        subject,
        difficulty,
        questions,
        score: examMode ? strictScore : correct,
      },
      ...localQuizzes,
    ].slice(0, 50);
    persistLocalQuizzes(nextLocal);
    setStep("result");
  };

  const examNote = useMemo(() => {
    if (!questions.length) return 0;
    const coeff = SUBJECT_COEFFICIENTS[subject] ?? 1;
    const weighted = strictScore * coeff;
    const total = questions.length * coeff;
    return Number(((weighted / Math.max(1, total)) * 20).toFixed(2));
  }, [questions.length, strictScore, subject]);

  const nextQuestion = async () => {
    if (index >= questions.length - 1) {
      await finish();
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected(null);
    setHintPanelOpen(false);
    setAnswerInput("");
  };

  const hintCosts = [5, 10, 15] as const;
  const hintsForCurrentQuestion = usedHintsByQuestion[index] ?? [];
  const hintCountForCurrentQuestion = hintsForCurrentQuestion.length;
  const canUseHint = hintCountForCurrentQuestion < 2;

  const registerHintUsage = (hintType: HintType) => {
    setUsedHintsByQuestion((prev) => ({
      ...prev,
      [index]: [...(prev[index] ?? []), hintType],
    }));
    setHintedQuestions((prev) => (prev.includes(index) ? prev : [...prev, index]));
  };

  const consumeHint = async (hintType: HintType) => {
    if (!current || selected !== null) return;
    if (!canUseHint) {
      toast.error("Maximum 2 indices atteint pour cette question.");
      return;
    }
    if (hintsForCurrentQuestion.includes(hintType)) {
      toast.error("Cet indice est déjà utilisé pour cette question.");
      return;
    }
    const cost = hintCosts[Math.min(hintCosts.length - 1, hintCountForCurrentQuestion)] ?? 15;
    setHintBusy(hintType);
    try {
      const usage = await spendHintDiamonds(cost, hintType);
      setProfile((prev) => (prev ? { ...prev, diamonds: usage.diamondsLeft } : prev));

      if (hintType === "fifty") {
        const wrongIndexes = current.options
          .map((_, optionIndex) => optionIndex)
          .filter((optionIndex) => optionIndex !== current.correctAnswerIndex);
        const shuffled = wrongIndexes.sort(() => Math.random() - 0.5);
        const disabled = shuffled.slice(0, 2);
        setDisabledOptionsByQuestion((prev) => ({
          ...prev,
          [index]: Array.from(new Set([...(prev[index] ?? []), ...disabled])),
        }));
      } else if (hintType === "first_letter") {
        const firstLetter = (current.options[current.correctAnswerIndex] ?? "").trim().charAt(0);
        if (firstLetter) {
          setAnswerInput(firstLetter.toUpperCase());
        }
      } else if (hintType === "contextual") {
        const res = await fetch("/api/quizzly/hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: current.question,
            options: current.options,
            explanation: current.explanation,
            subject,
            difficulty,
            modelId,
          }),
        });
        const data = (await res.json()) as { hint?: string; error?: string };
        if (!res.ok || !data.hint) {
          throw new Error(data.error ?? "Impossible de générer un indice IA");
        }
        setContextHintByQuestion((prev) => ({ ...prev, [index]: data.hint ?? "" }));
      }
      registerHintUsage(hintType);
      toast.success(`Indice utilisé (-${cost}💎)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Utilisation de l'indice impossible");
    } finally {
      setHintBusy(null);
    }
  };

  const finalizeDuel = async () => {
    const playerCorrect = duelPlayerAnswers.reduce<number>((total, answer, idx) => total + (answer === questions[idx]?.correctAnswerIndex ? 1 : 0), 0);
    const opponentCorrect = duelOpponentAnswers.reduce<number>((total, answer, idx) => total + (answer === questions[idx]?.correctAnswerIndex ? 1 : 0), 0);
    const winnerMultiplier = playerCorrect >= opponentCorrect ? 2 : 1;
    const participation = playerCorrect >= opponentCorrect ? playerCorrect * 2 : Math.max(1, Math.floor(playerCorrect * 0.75));
    await finishQuiz(participation * winnerMultiplier, null, duelStartedAt ? Math.floor((Date.now() - duelStartedAt) / 1000) : undefined);
    setStep("duelResult");
  };

  const finalizeSurvival = async () => {
    const duration = survivalStartedAt ? Math.floor((Date.now() - survivalStartedAt) / 1000) : 0;
    await finishQuiz(Math.max(1, survivalScore), null, duration);
    const entry = { pseudo: profile?.pseudo ?? "Anonyme", score: survivalScore, stage: survivalStage, duration };
    const nextLb = [entry, ...survivalLeaderboard].sort((a, b) => b.score - a.score || b.stage - a.stage || a.duration - b.duration).slice(0, 20);
    setSurvivalLeaderboard(nextLb);
    localStorage.setItem("mai.quizzly.survival.lb.v1", JSON.stringify(nextLb));
    setStep("survivalResult");
  };

  useEffect(() => {
    if (step !== "duel" || questions.length === 0) return;
    const unansweredIndex = duelOpponentAnswers.findIndex((answer) => answer === null);
    if (unansweredIndex === -1) return;
    const timer = setTimeout(() => {
      const q = questions[unansweredIndex];
      if (!q) return;
      const isGood = Math.random() > 0.35;
      const answer = isGood ? q.correctAnswerIndex : Math.floor(Math.random() * q.options.length);
      setDuelOpponentAnswers((prev) => {
        const next = [...prev];
        next[unansweredIndex] = answer;
        return next;
      });
    }, 1200 + Math.floor(Math.random() * 1500));
    return () => clearTimeout(timer);
  }, [duelOpponentAnswers, questions, step]);

  useEffect(() => {
    if (step === "duel" && duelOpponentAnswers.every((answer) => answer !== null) && duelPlayerAnswers.every((answer) => answer !== null)) {
      finalizeDuel();
    }
  }, [duelOpponentAnswers, duelPlayerAnswers, step]);

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

  const shareQuizConfig = () => {
    const payload = {
      grade,
      subject,
      difficulty,
      count,
      chapter,
      themePrompt,
      questionTypes,
      customQuestions: customQuestions.length > 0 ? customQuestions : undefined,
    };
    const encoded = btoa(JSON.stringify(payload));
    const url = `${window.location.origin}/quizzly/play?quiz=${encoded}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien du quiz copié.");
  };

  const startReviewSession = () => {
    const dueNow = reviewCards.filter((item) => new Date(item.dueAt).getTime() <= Date.now()).slice(0, 12);
    if (dueNow.length === 0) {
      toast.info("Aucune carte de révision due.");
      return;
    }
    setQuestions(dueNow.map((item) => item.question));
    setIndex(0);
    setSelected(null);
    setCorrect(0);
    setStrictScore(0);
    setUsedHintsByQuestion({});
    setDisabledOptionsByQuestion({});
    setContextHintByQuestion({});
    setHintedQuestions([]);
    setAnswerInput("");
    setStep("playing");
    setExamMode(false);
  };

  if (step === "loading") {
    return <div className="py-24 text-center font-bold text-slate-600">Chargement du quiz…</div>;
  }

  if (step === "result") {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h1 className="text-3xl font-black text-slate-800">Quiz terminé !</h1>
        <p className="text-lg font-semibold text-violet-700">{correct} / {questions.length}</p>
        {examMode && <p className="text-sm text-slate-600">Note finale (coef matière {SUBJECT_COEFFICIENTS[subject] ?? 1}): {Math.min(20, examNote)}/20</p>}
        <div className="flex flex-wrap justify-center gap-2">
          <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold" onClick={downloadQuiz} type="button"><Download className="mr-1 inline h-4 w-4" /> Télécharger PDF</button>
          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white" onClick={shareResult} type="button"><Share2 className="mr-1 inline h-4 w-4" /> Partager</button>
          <button className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white" onClick={() => setStep("setup")} type="button">Rejouer</button>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-left">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Récapitulatif des questions</p>
          <div className="space-y-2 text-xs text-slate-700">
            {questions.map((question, questionIndex) => (
              <div key={`result-${questionIndex}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span>Q{questionIndex + 1} · {question.question.slice(0, 52)}{question.question.length > 52 ? "…" : ""}</span>
                {hintedQuestions.includes(questionIndex) ? (
                  <span className="rounded-full bg-amber-100 px-2 py-1 font-bold text-amber-700">Indice utilisé</span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-1 font-bold text-emerald-700">Sans aide</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "matchmaking") {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h2 className="text-3xl font-black text-slate-800">Recherche d'adversaire…</h2>
        <div className="mx-auto h-24 w-24 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        <p className="text-sm text-slate-500">Matchmaking ELO simplifié: {eloScore} · {matchmakingSeconds}s</p>
        <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700" onClick={() => setStep("setup")} type="button">
          Annuler la recherche
        </button>
      </div>
    );
  }

  if (step === "duel" && duelCurrent) {
    const playerProgress = (duelPlayerAnswers.filter((a) => a !== null).length / questions.length) * 100;
    const opponentProgress = (duelOpponentAnswers.filter((a) => a !== null).length / questions.length) * 100;
    return (
      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="font-bold text-slate-700">Duel • Question {duelIndex + 1}/{questions.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-black text-slate-800">{duelCurrent.question}</h2>
            <div className="space-y-2">
              {duelCurrent.options.map((opt, i) => (
                <button
                  key={opt}
                  className={`flex w-full rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${duelSelected === i ? "border-violet-500 bg-violet-50" : "border-slate-200 hover:border-violet-300"}`}
                  disabled={duelSelected !== null}
                  onClick={() => {
                    setDuelSelected(i);
                    setDuelPlayerAnswers((prev) => {
                      const next = [...prev];
                      next[duelIndex] = i;
                      return next;
                    });
                    setTimeout(() => {
                      if (duelIndex >= questions.length - 1) return;
                      setDuelIndex((prev) => prev + 1);
                      setDuelSelected(null);
                    }, 350);
                  }}
                  type="button"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
        <aside className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-black text-slate-700">Progression en temps réel</p>
          <p className="text-xs text-slate-500">Toi</p>
          <div className="mb-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-violet-600" style={{ width: `${playerProgress}%` }} /></div>
          <p className="text-xs text-slate-500">{duelOpponent?.pseudo ?? "Adversaire"} {duelOpponent?.emoji ?? "⚔️"}</p>
          <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${opponentProgress}%` }} /></div>
          <p className="mt-4 text-xs text-slate-500">Aucune réponse adverse n'est révélée pendant la partie.</p>
        </aside>
      </div>
    );
  }

  if (step === "duelResult") {
    const playerCorrect = duelPlayerAnswers.reduce<number>((total, answer, idx) => total + (answer === questions[idx]?.correctAnswerIndex ? 1 : 0), 0);
    const opponentCorrect = duelOpponentAnswers.reduce<number>((total, answer, idx) => total + (answer === questions[idx]?.correctAnswerIndex ? 1 : 0), 0);
    const playerAvg = ((duelStartedAt ? (Date.now() - duelStartedAt) / 1000 : 0) / Math.max(1, questions.length)).toFixed(1);
    const opponentAvg = (Number(playerAvg) + (Math.random() * 4 - 2)).toFixed(1);
    const isWinner = playerCorrect >= opponentCorrect;
    return (
      <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="text-center text-3xl font-black text-slate-800">{isWinner ? "🏆 Victoire !" : "🤝 Duel terminé"}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-violet-50 p-4 text-sm"><p className="font-bold">Toi ({profile?.pseudo ?? "Moi"})</p><p>Score: {playerCorrect}/{questions.length}</p><p>Temps moyen/question: {playerAvg}s</p><p>Bonnes réponses: {playerCorrect}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm"><p className="font-bold">{duelOpponent?.pseudo ?? "Adversaire"} {duelOpponent?.emoji ?? "⚔️"}</p><p>Score: {opponentCorrect}/{questions.length}</p><p>Temps moyen/question: {opponentAvg}s</p><p>Bonnes réponses: {opponentCorrect}</p></div>
        </div>
        <div className={`rounded-2xl p-4 text-sm font-bold ${isWinner ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>
          {isWinner ? "Récompenses vainqueur: XP x2 + diamants x2 ✨" : "Récompenses de participation obtenues pour ton fair-play 💙"}
        </div>
        <div className="flex justify-center gap-2">
          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white" onClick={() => setStep("setup")} type="button">Nouveau duel</button>
          <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold" onClick={() => router.push("/quizzly")} type="button">Retour</button>
        </div>
      </div>
    );
  }

  if (step === "survival" && survivalCurrent) {
    const canFreeze = survivalFreezeSeconds <= 0;
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="font-bold text-slate-700">Mode Survie • Palier {survivalStage}</p>
              <p className="text-xs text-slate-500">{subject} · {difficulty}</p>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: 3 }).map((_, i) => <Heart key={`life-${i}`} className={`h-5 w-5 ${i < survivalLives ? "fill-red-500 text-red-500 animate-pulse" : "text-slate-300"}`} />)}
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-black text-slate-800">{survivalCurrent.question}</h2>
          <div className="space-y-2">
            {survivalCurrent.options.map((opt, i) => (
              <button key={opt} className="w-full rounded-xl border border-slate-200 px-3 py-3 text-left text-sm font-medium hover:border-violet-300" onClick={async () => {
                const isCorrect = i === survivalCurrent.correctAnswerIndex;
                if (isCorrect) {
                  setSurvivalScore((prev) => prev + 1);
                } else {
                  setSurvivalLives((prev) => prev - 1);
                  navigator.vibrate?.(100);
                }
                if (!isCorrect && survivalLives <= 1) {
                  await finalizeSurvival();
                  return;
                }
                if (index >= questions.length - 1) {
                  const nextStage = survivalStage + 1;
                  setSurvivalStage(nextStage);
                  await loadNextSurvivalBatch(nextStage);
                  return;
                }
                setIndex((prev) => prev + 1);
              }} type="button">{opt}</button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 disabled:opacity-40" disabled={survivalBonusLives <= 0 || survivalLives >= 3} onClick={() => { setSurvivalLives((prev) => Math.min(3, prev + 1)); setSurvivalBonusLives((prev) => Math.max(0, prev - 1)); }} type="button"><Shield className="mr-1 inline h-4 w-4" /> Booster +1 vie</button>
            <button className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 disabled:opacity-40" disabled={!canFreeze} onClick={() => { setSurvivalFreezeSeconds(8); setTimeout(() => setSurvivalFreezeSeconds(0), 8000); }} type="button"><Snowflake className="mr-1 inline h-4 w-4" /> Geler chrono</button>
            <p className="text-xs text-slate-500">Score: {survivalScore}</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "survivalResult") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="text-center text-3xl font-black text-slate-800">Fin du mode Survie</h2>
        <p className="text-center text-sm text-slate-600">Score: {survivalScore} • Palier atteint: {survivalStage}</p>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="mb-2 text-sm font-bold text-slate-700">Classement mondial Survie (local)</p>
          <div className="space-y-1 text-xs text-slate-600">
            {survivalLeaderboard.slice(0, 10).map((entry, idx) => (
              <p key={`${entry.pseudo}-${entry.score}-${idx}`}>#{idx + 1} {entry.pseudo} — {entry.score} pts · palier {entry.stage} · {entry.duration}s</p>
            ))}
          </div>
        </div>
        <div className="flex justify-center gap-2">
          <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white" onClick={startSurvivalMode} type="button">Rejouer</button>
          <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold" onClick={() => setStep("setup")} type="button">Configurer</button>
        </div>
      </div>
    );
  }

  if (step === "playing" && current) {
    const ratio = chronoEnabled ? (remainingSeconds / chronoSeconds) * 100 : 100;
    const eliminatedOptions = disabledOptionsByQuestion[index] ?? [];
    const contextualHint = contextHintByQuestion[index];
    const isOpenQuestionMode = questionTypes.includes("completer");
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
          {isOpenQuestionMode && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="text-xs font-bold text-slate-600">Réponse libre</label>
              <input
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm ${answerInput ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200" : "border-slate-200 bg-white"}`}
                onChange={(e) => setAnswerInput(e.target.value)}
                placeholder="Écris ta réponse (optionnel)"
                value={answerInput}
              />
            </div>
          )}
          <div className="space-y-2">
            {current.options.map((opt, i) => {
              const isCorrect = i === current.correctAnswerIndex;
              const isSelected = selected === i;
              const showState = selected !== null;
              const isEliminated = eliminatedOptions.includes(i);
              return (
                <button
                  key={opt}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${isEliminated ? "border-slate-200 bg-slate-100 text-slate-400 opacity-60 line-through animate-pulse" : showState ? isCorrect ? "border-green-500 bg-green-50" : isSelected ? "border-red-500 bg-red-50" : "opacity-60" : "border-slate-200 hover:border-violet-300"}`}
                  disabled={selected !== null || isEliminated}
                  onClick={() => {
                    setSelected(i);
                    if (isCorrect) {
                      setStrictScore((prev) => prev + 1);
                      const bonus = chronoEnabled ? Math.max(0, Math.floor(remainingSeconds / 5)) : 0;
                      setCorrect((prev) => prev + (examMode ? 1 : 1 + bonus));
                      setReviewCards((prev) => {
                        const existing = prev.find((item) => item.question.question === current.question);
                        const nextStage = Math.min(REVIEW_INTERVALS_DAYS.length - 1, (existing?.stage ?? -1) + 1);
                        const due = new Date();
                        due.setDate(due.getDate() + REVIEW_INTERVALS_DAYS[nextStage]);
                        const next: ReviewCard = { question: current, stage: nextStage, dueAt: due.toISOString() };
                        return [next, ...prev.filter((item) => item.question.question !== current.question)].slice(0, 200);
                      });
                    } else {
                      navigator.vibrate?.(80);
                      setReviewCards((prev) => {
                        const existing = prev.find((item) => item.question.question === current.question);
                        const previousStage = existing?.stage ?? 0;
                        const nextStage = Math.max(0, Math.min(REVIEW_INTERVALS_DAYS.length - 1, previousStage - 1));
                        const due = new Date();
                        due.setDate(due.getDate() + REVIEW_INTERVALS_DAYS[nextStage]);
                        const next: ReviewCard = { question: current, stage: nextStage, dueAt: due.toISOString() };
                        return [next, ...prev.filter((item) => item.question.question !== current.question)].slice(0, 200);
                      });
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
          <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800">
            <p className="font-bold">Indices utilisés sur cette question: {hintCountForCurrentQuestion}/2</p>
            {answerInput ? <p className="mt-1">Première lettre révélée: <span className="rounded bg-white px-2 py-0.5 font-black text-amber-700">{answerInput}</span></p> : null}
            {contextualHint ? <p className="mt-2 whitespace-pre-wrap">{contextualHint}</p> : null}
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
        <div className="fixed bottom-6 right-6 z-20">
          <button
            className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-xl transition hover:scale-105"
            onClick={() => setHintPanelOpen((prev) => !prev)}
            type="button"
          >
            <Lightbulb className="h-6 w-6" />
          </button>
          {hintPanelOpen && (
            <div className="mt-3 w-72 space-y-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs shadow-2xl">
              <p className="font-bold text-slate-700">Indices ({hintCountForCurrentQuestion}/2)</p>
              <p className="text-slate-500">Coût prochain indice: {hintCosts[Math.min(hintCosts.length - 1, hintCountForCurrentQuestion)]} 💎</p>
              <button disabled={!canUseHint || hintBusy !== null || hintsForCurrentQuestion.includes("fifty")} onClick={() => consumeHint("fifty")} type="button" className="w-full rounded-lg border border-slate-200 px-2 py-2 text-left disabled:opacity-40">50/50 (QCM) — élimine 2 mauvaises réponses</button>
              <button disabled={!canUseHint || hintBusy !== null || hintsForCurrentQuestion.includes("first_letter")} onClick={() => consumeHint("first_letter")} type="button" className="w-full rounded-lg border border-slate-200 px-2 py-2 text-left disabled:opacity-40">Première lettre (compléter/libre)</button>
              <button disabled={!canUseHint || hintBusy !== null || hintsForCurrentQuestion.includes("contextual")} onClick={() => consumeHint("contextual")} type="button" className="w-full rounded-lg border border-slate-200 px-2 py-2 text-left disabled:opacity-40">Indice contextuel IA</button>
              <p className="text-[11px] text-slate-400">Les indices guident sans donner la réponse exacte.</p>
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
        <div className="flex gap-2">
        <button className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold" onClick={saveFavorite} type="button">
          ⭐ Sauvegarder en favori
        </button>
        <button className="rounded-xl border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700" onClick={shareQuizConfig} type="button">🔗 Partager</button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <button className={`rounded-2xl border p-4 text-left ${gameMode === "classic" ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white"}`} onClick={() => setGameMode("classic")} type="button">
          <p className="font-bold">🎯 Classique</p><p className="text-xs text-slate-500">Quiz solo configurable.</p>
        </button>
        <button className={`rounded-2xl border p-4 text-left ${gameMode === "duel" ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white"}`} onClick={() => setGameMode("duel")} type="button">
          <p className="font-bold flex items-center gap-2"><Sword className="h-4 w-4" /> Duel temps réel</p><p className="text-xs text-slate-500">Matchmaking auto ELO ({eloScore}).</p>
        </button>
        <button className={`rounded-2xl border p-4 text-left ${gameMode === "survival" ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-white"}`} onClick={() => setGameMode("survival")} type="button">
          <p className="font-bold flex items-center gap-2"><Trophy className="h-4 w-4" /> Survie infinie</p><p className="text-xs text-slate-500">3 vies, paliers progressifs, leaderboard.</p>
        </button>
      </div>
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
        Répétition espacée (1/3/7/30j) — cartes dues: {reviewCards.filter((item) => new Date(item.dueAt).getTime() <= Date.now()).length}
        <button className="ml-3 rounded-lg bg-sky-600 px-3 py-1 text-xs font-bold text-white" onClick={startReviewSession} type="button">Mode Révision</button>
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
        <label className="text-sm font-medium text-slate-700 md:col-span-2">Types de questions IA
          <select multiple className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2" value={questionTypes} onChange={(e) => setQuestionTypes(Array.from(e.target.selectedOptions).map((option) => option.value))}>
            {QUESTION_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
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
        <label className="ml-4 text-sm">
          <input checked={examMode} onChange={(e) => setExamMode(e.target.checked)} type="checkbox" /> Mode examen / Brevet blanc
        </label>
        {examMode && (
          <p className="mt-2 text-xs text-slate-600">
            Conditions examen: timer strict, aucune seconde chance, coefficient matière appliqué, note finale /20.
          </p>
        )}
      </div>
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="mb-2 font-bold text-slate-700">🧩 Quiz personnalisé (prof / classe)</p>
        <p className="mb-3 text-xs text-slate-500">Créez vos propres questions et partagez-les via le lien 🔗.</p>
        <div className="space-y-3">
          {customQuestions.map((draft, idx) => (
            <div key={draft.id} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">Question custom #{idx + 1}</p>
                <button className="text-xs text-red-600" onClick={() => setCustomQuestions((prev) => prev.filter((item) => item.id !== draft.id))} type="button">Supprimer</button>
              </div>
              <input className="mb-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm" placeholder="Énoncé" value={draft.question} onChange={(e) => setCustomQuestions((prev) => prev.map((item) => (item.id === draft.id ? { ...item, question: e.target.value } : item)))} />
              <div className="grid gap-2 md:grid-cols-2">
                {draft.options.map((opt, i) => (
                  <input key={`${draft.id}-${i}`} className="rounded-lg border border-slate-200 px-2 py-1 text-sm" placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => setCustomQuestions((prev) => prev.map((item) => (item.id === draft.id ? { ...item, options: item.options.map((inner, innerIndex) => (innerIndex === i ? e.target.value : inner)) as [string, string, string, string] } : item)))} />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-600">Bonne réponse:</span>
                <select className="rounded border border-slate-200 px-2 py-1 text-xs" value={draft.correctAnswerIndex} onChange={(e) => setCustomQuestions((prev) => prev.map((item) => (item.id === draft.id ? { ...item, correctAnswerIndex: Number(e.target.value) || 0 } : item)))}>
                  {[0, 1, 2, 3].map((option) => <option key={option} value={option}>Option {option + 1}</option>)}
                </select>
              </div>
              <input className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs" placeholder="Explication (optionnel)" value={draft.explanation} onChange={(e) => setCustomQuestions((prev) => prev.map((item) => (item.id === draft.id ? { ...item, explanation: e.target.value } : item)))} />
            </div>
          ))}
          <button className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700" onClick={() => setCustomQuestions((prev) => [...prev, { id: crypto.randomUUID(), question: "", options: ["", "", "", ""], correctAnswerIndex: 0, explanation: "" }])} type="button">
            + Ajouter une question personnalisée
          </button>
        </div>
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
