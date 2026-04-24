"use client";

import { BookOpenCheck, Rocket, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { APP_VERSION } from "@/lib/app-version";
import { Button } from "../ui/button";

const ONBOARDING_KEY = "mai.onboarding.v1.completed";
const WHATS_NEW_KEY = "mai.whatsnew.version";
const GPT55_BANNER_STATE_KEY = "mai.gpt55.banner.state.v1";

export function ProductAnnouncements() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [showGpt55Banner, setShowGpt55Banner] = useState(false);

  useEffect(() => {
    const onboardingDone = localStorage.getItem(ONBOARDING_KEY) === "true";
    if (!onboardingDone) {
      setShowOnboarding(true);
    }

    const seenVersion = localStorage.getItem(WHATS_NEW_KEY);
    if (seenVersion !== APP_VERSION) {
      setShowWhatsNew(true);
    }

    try {
      const raw = localStorage.getItem(GPT55_BANNER_STATE_KEY);
      const parsed = raw
        ? (JSON.parse(raw) as {
            dismissedForever?: boolean;
            skipCountdown?: number;
            visits?: number;
          })
        : {};

      const dismissedForever = parsed.dismissedForever === true;
      const nextVisits = Math.max(0, (parsed.visits ?? 0) + 1);
      const currentCountdown = Math.max(0, parsed.skipCountdown ?? 0);
      const shouldShow = !dismissedForever && currentCountdown <= 0;

      setShowGpt55Banner(shouldShow);

      localStorage.setItem(
        GPT55_BANNER_STATE_KEY,
        JSON.stringify({
          ...parsed,
          visits: nextVisits,
          skipCountdown: shouldShow ? 0 : Math.max(0, currentCountdown - 1),
        })
      );
    } catch {
      setShowGpt55Banner(true);
    }
  }, []);

  const onboardingSteps = useMemo(
    () => [
      "1. Commencez une discussion via le chat principal.",
      "2. Créez un mAI puis mentionnez-le avec @Nom.",
      "3. Organisez vos contenus dans Projets et Bibliothèque.",
      "4. Explorez Code Interpreter et Speaky pour aller plus loin.",
    ],
    []
  );

  const closeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowOnboarding(false);
  };

  const closeWhatsNew = () => {
    localStorage.setItem(WHATS_NEW_KEY, APP_VERSION);
    setShowWhatsNew(false);
  };

  const deferGpt55 = () => {
    localStorage.setItem(
      GPT55_BANNER_STATE_KEY,
      JSON.stringify({ dismissedForever: false, skipCountdown: 2, visits: 0 })
    );
    setShowGpt55Banner(false);
  };

  const tryGpt55 = () => {
    localStorage.setItem("chat-model", "gpt-5.5");
    document.cookie = `chat-model=${encodeURIComponent("gpt-5.5")}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setShowGpt55Banner(false);
  };

  const closeGpt55Forever = () => {
    localStorage.setItem(
      GPT55_BANNER_STATE_KEY,
      JSON.stringify({ dismissedForever: true, skipCountdown: 0, visits: 0 })
    );
    setShowGpt55Banner(false);
  };

  return (
    <>
      {showGpt55Banner && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="liquid-glass w-full max-w-2xl rounded-3xl border border-border/60 bg-card/95 p-4 md:p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">GPT-5.5 est disponible</h2>
                <p className="text-sm text-muted-foreground">
                  Une nouvelle catégorie d’intelligence pour le vrai travail
                </p>
              </div>
              <button
                className="rounded-full p-1 hover:bg-muted"
                onClick={closeGpt55Forever}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/30">
              <Image
                alt="Affiche GPT-5.5"
                className="h-auto w-full object-cover"
                height={640}
                onError={(event) => {
                  (event.currentTarget as HTMLImageElement).style.display =
                    "none";
                }}
                src="/images/gpt-5.5-poster.png"
                width={1280}
              />
              <div className="p-3 text-sm text-muted-foreground">
                Le nouveau modèle GPT-5.5 est maintenant disponible dans le
                sélecteur de modèles France Student.
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <Button onClick={deferGpt55} type="button" variant="secondary">
                Plus tard
              </Button>
              <Button onClick={tryGpt55} type="button">
                Essayer
              </Button>
              <Button
                onClick={closeGpt55Forever}
                type="button"
                variant="ghost"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="liquid-glass w-full max-w-xl rounded-3xl border border-border/60 bg-white p-5 text-black">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <BookOpenCheck className="size-5 text-primary" /> Onboarding mAI
              </h2>
              <button onClick={closeOnboarding} type="button">
                <X className="size-4" />
              </button>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {onboardingSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
            <Button className="mt-4" onClick={closeOnboarding} type="button">
              Commencer
            </Button>
          </div>
        </div>
      )}

      {showWhatsNew && (
        <div className="fixed inset-x-0 top-3 z-50 mx-auto w-[min(92vw,760px)]">
          <div className="liquid-glass flex items-start gap-3 rounded-2xl border border-border/60 bg-white p-4 text-black backdrop-blur-xl">
            <Rocket className="mt-0.5 size-5 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Quoi de neuf</p>
              <p className="text-sm text-muted-foreground">
                GPT-5.5, nouvelles langues, badge bêta langues, affichage outil,
                streaming adouci, et ajustements UX.
              </p>
            </div>
            <button
              className="rounded-full p-1 hover:bg-muted"
              onClick={closeWhatsNew}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
