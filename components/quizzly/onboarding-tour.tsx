"use client";

import { useEffect, useMemo, useState } from "react";
import { claimOnboardingWelcomePack, updateQuizzlyProfile } from "@/lib/quizzly/actions";
import { toast } from "sonner";
import { getQuizzlySettingsFromStorage, saveQuizzlySettingsToStorage } from "@/lib/quizzly/settings";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
};

type Profile = {
  pseudo: string;
  emoji: string;
};

const ONBOARDING_KEY = "mai.quizzly.onboarding.completed.v1";
const ONBOARDING_RESTART_EVENT = "mai:quizzly-onboarding-restart";
const CLASS_OPTIONS = ["CE1", "CE2", "CM1", "CM2", "6ème", "5ème", "4ème", "3ème", "Seconde", "Première", "Terminale"];
const SUBJECT_OPTIONS = ["Mathématiques", "Français", "Histoire", "Géographie", "Sciences", "Anglais"];
const AVATARS = ["🧠", "🚀", "🦊", "🐼", "🦁", "🐙", "🐯", "🦄", "⚡", "🌟"];

const bubbles = [
  { selector: "[data-onboarding-nav]", text: "Ici, la barre de navigation t'accompagne vers Jouer, Stats, Boutique et plus.", title: "Navigation" },
  { selector: "[data-onboarding-diamonds]", text: "Tes diamants servent à acheter boosters, thèmes et bonus en boutique.", title: "Diamants" },
  { selector: "[data-onboarding-level]", text: "Ton niveau monte avec l'XP. Plus tu joues, plus tu progresses.", title: "Niveau" },
  { selector: "[data-onboarding-streak]", text: "Ta streak représente tes jours consécutifs. Reste régulier pour la garder !", title: "Streak" },
] as const;

export function QuizzlyOnboardingTour({
  profile,
  inventoryKeys,
  onProfileRefresh,
}: {
  profile: Profile;
  inventoryKeys: string[];
  onProfileRefresh: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [reviewMode, setReviewMode] = useState(false);
  const [pseudo, setPseudo] = useState(profile.pseudo || "");
  const [emoji, setEmoji] = useState(profile.emoji || "🧠");
  const [schoolClass, setSchoolClass] = useState("3ème");
  const [subject, setSubject] = useState("Mathématiques");
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [encouragement, setEncouragement] = useState("");
  const [packClaiming, setPackClaiming] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const shouldAutoOpen = useMemo(() => {
    const claimed = inventoryKeys.includes("onboarding:tutorial-completed") || inventoryKeys.includes("onboarding:welcome-pack:claimed");
    return !claimed;
  }, [inventoryKeys]);

  useEffect(() => {
    const alreadySeen = localStorage.getItem(ONBOARDING_KEY) === "1";
    if (shouldAutoOpen && !alreadySeen) {
      setOpen(true);
      setStep(1);
    }
    const settings = getQuizzlySettingsFromStorage();
    if (settings.classDefault) setSchoolClass(settings.classDefault);
    if (settings.subjectDefault) setSubject(settings.subjectDefault);
  }, [shouldAutoOpen]);

  useEffect(() => {
    const openFromSettings = () => {
      setReviewMode(true);
      setStep(1);
      setBubbleIndex(0);
      setOpen(true);
    };
    window.addEventListener(ONBOARDING_RESTART_EVENT, openFromSettings);
    return () => window.removeEventListener(ONBOARDING_RESTART_EVENT, openFromSettings);
  }, []);

  useEffect(() => {
    if (step !== 3 || questions.length > 0) return;
    const run = async () => {
      const res = await fetch("/api/quizzly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: schoolClass, subject, difficulty: "Facile", count: 5, chapter: "", themePrompt: "Onboarding", questionTypes: ["qcm"] }),
      });
      const data = (await res.json()) as { questions?: QuizQuestion[] };
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        toast.error("Impossible de charger le quiz de tutoriel.");
        return;
      }
      setQuestions(data.questions.slice(0, 5));
    };
    void run();
  }, [questions.length, schoolClass, step, subject]);

  useEffect(() => {
    if (step !== 5 || reviewMode || packClaiming) return;
    setPackClaiming(true);
    claimOnboardingWelcomePack()
      .then((result) => {
        if (result.claimed) {
          toast.success("Pack de bienvenue débloqué : +50💎, Booster x1.5 et titre Nouveau venu !");
          setConfetti(true);
          setTimeout(() => setConfetti(false), 2200);
          void onProfileRefresh();
        }
      })
      .catch(() => toast.error("Impossible d'attribuer le pack de bienvenue."))
      .finally(() => setPackClaiming(false));
  }, [onProfileRefresh, packClaiming, reviewMode, step]);

  useEffect(() => {
    if (step !== 2) return;
    const updateRect = () => {
      const target = document.querySelector(bubbles[bubbleIndex]?.selector ?? "");
      if (!target) {
        setTargetRect(null);
        return;
      }
      const rect = target.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [bubbleIndex, step]);

  if (!open) return null;

  const closeTutorial = () => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setOpen(false);
    setReviewMode(false);
  };

  const nextBubble = () => {
    if (bubbleIndex >= bubbles.length - 1) {
      setStep(3);
      return;
    }
    setBubbleIndex((prev) => prev + 1);
  };

  const currentQuestion = questions[quizIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 p-3 md:p-8">
      <div className="mx-auto flex max-w-4xl items-center justify-between text-white">
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-full ${i + 1 <= step ? "bg-violet-300" : "bg-white/40"}`} />
          ))}
        </div>
        <button className="text-xs text-white/80 hover:text-white" onClick={closeTutorial} type="button">Passer le tutoriel</button>
      </div>

      <div className="mx-auto mt-4 max-w-4xl rounded-3xl bg-white p-5 shadow-2xl md:p-8">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-800">Bienvenue sur Quizzly ✨</h2>
            <p className="text-sm text-slate-600">Personnalise ton profil pour démarrer.</p>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Pseudo</p>
              <input className="w-full rounded-xl border border-slate-200 px-3 py-2" value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Ex: MathMaster" />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Avatar emoji</p>
              <div className="flex flex-wrap gap-2">
                {AVATARS.map((item) => (
                  <button key={item} className={`rounded-lg border px-3 py-1.5 text-lg ${emoji === item ? "border-violet-600 bg-violet-50" : "border-slate-200"}`} onClick={() => setEmoji(item)} type="button">{item}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Classe scolaire</p>
              <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={schoolClass} onChange={(e) => setSchoolClass(e.target.value)}>
                {CLASS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Matière pour ton premier quiz</p>
              <select className="w-full rounded-xl border border-slate-200 px-3 py-2" value={subject} onChange={(e) => setSubject(e.target.value)}>
                {SUBJECT_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <button
              className="rounded-xl bg-violet-600 px-4 py-2 font-bold text-white"
              onClick={async () => {
                await updateQuizzlyProfile({ pseudo: pseudo.trim() || profile.pseudo, emoji });
                const settings = getQuizzlySettingsFromStorage();
                saveQuizzlySettingsToStorage({ ...settings, classDefault: schoolClass, subjectDefault: subject });
                await onProfileRefresh();
                setStep(2);
              }}
              type="button"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-xl font-black text-slate-800">Découverte rapide de l'interface</h2>
            <p className="text-sm text-slate-600">Clique la bulle ou passe à la suivante.</p>
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4" onClick={nextBubble}>
              <p className="text-xs font-bold uppercase text-violet-600">{bubbles[bubbleIndex]?.title}</p>
              <p className="text-sm text-violet-900">{bubbles[bubbleIndex]?.text}</p>
            </div>
            <button className="rounded-xl bg-violet-600 px-4 py-2 font-bold text-white" onClick={nextBubble} type="button">Suivant</button>
            {targetRect && (
              <>
                <div
                  className="pointer-events-none fixed z-[101] rounded-2xl border-2 border-violet-300 bg-violet-200/20 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]"
                  style={{ top: targetRect.top - 6, left: targetRect.left - 6, width: targetRect.width + 12, height: targetRect.height + 12 }}
                />
                <div
                  className="pointer-events-none fixed z-[102] max-w-xs rounded-xl bg-white/90 p-3 text-xs text-slate-700 shadow-xl backdrop-blur"
                  style={{ top: Math.max(16, targetRect.top - 74), left: Math.max(12, targetRect.left + 8) }}
                >
                  <p className="font-bold text-violet-700">{bubbles[bubbleIndex]?.title}</p>
                  <p>{bubbles[bubbleIndex]?.text}</p>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800">Premier quiz guidé (5 questions faciles)</h2>
            {!currentQuestion ? (
              <p className="text-sm text-slate-600">Chargement des questions...</p>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-700">Question {quizIndex + 1}/5</p>
                <p className="font-semibold text-slate-800">{currentQuestion.question}</p>
                <div className="grid gap-2">
                  {currentQuestion.options.map((opt, optionIndex) => (
                    <button
                      key={`${quizIndex}-${optionIndex}`}
                      className={`rounded-xl border px-3 py-2 text-left ${selected === optionIndex ? "border-violet-500 bg-violet-50" : "border-slate-200"}`}
                      disabled={selected !== null}
                      onClick={() => {
                        setSelected(optionIndex);
                        const isCorrect = optionIndex === currentQuestion.correctAnswerIndex;
                        if (isCorrect) {
                          setScore((prev) => prev + 1);
                          setEncouragement("Excellent, tu maîtrises déjà ce sujet ✅");
                        } else {
                          setEncouragement("Pas de souci, tu vas vite progresser, regarde l'explication 💪");
                        }
                      }}
                      type="button"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {selected !== null && (
                  <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="font-semibold">{encouragement}</p>
                    {selected !== currentQuestion.correctAnswerIndex && currentQuestion.explanation && <p className="mt-1 text-xs">{currentQuestion.explanation}</p>}
                  </div>
                )}
                <button
                  className="rounded-xl bg-violet-600 px-4 py-2 font-bold text-white disabled:opacity-50"
                  disabled={selected === null}
                  onClick={() => {
                    if (quizIndex >= 4) {
                      setStep(4);
                      return;
                    }
                    setQuizIndex((prev) => prev + 1);
                    setSelected(null);
                    setEncouragement("");
                  }}
                  type="button"
                >
                  {quizIndex >= 4 ? "Voir le résultat" : "Question suivante"}
                </button>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-800">Résultat du quiz</h2>
            <div className="rounded-2xl bg-violet-50 p-4 text-violet-900">
              <p className="text-lg font-black">Score: {score}/5</p>
              <p className="text-sm">Tu gagnes de l'XP selon tes réponses justes. Les diamants t'aident à acheter boosters, indices et thèmes premium.</p>
              <p className="mt-1 text-sm">En progressant, ton niveau monte et débloque plus de récompenses dans Quizzly.</p>
            </div>
            <button className="rounded-xl bg-violet-600 px-4 py-2 font-bold text-white" onClick={() => setStep(5)} type="button">Continuer</button>
          </div>
        )}

        {step === 5 && (
          <div className="relative space-y-4 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            {confetti && (
              <div className="pointer-events-none absolute inset-0">
                {Array.from({ length: 18 }, (_, i) => (
                  <span
                    key={i}
                    className="absolute text-xl"
                    style={{ left: `${(i * 7) % 100}%`, top: `${(i * 13) % 70}%`, animation: `mai-confetti 900ms ease ${i * 40}ms 1 both` }}
                  >
                    🎉
                  </span>
                ))}
              </div>
            )}
            <h2 className="text-xl font-black text-emerald-900">Pack de bienvenue débloqué</h2>
            <p className="text-sm text-emerald-800">+50 diamants, +1 booster x1.5, titre exclusif « Nouveau venu ».</p>
            <button className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white" onClick={closeTutorial} type="button">Terminer</button>
          </div>
        )}
      </div>
    </div>
  );
}

export const quizzlyOnboardingRestartEvent = ONBOARDING_RESTART_EVENT;
