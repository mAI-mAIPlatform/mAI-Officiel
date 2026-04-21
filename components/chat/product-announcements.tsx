"use client";

import { BookOpenCheck, Rocket, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { APP_VERSION } from "@/lib/app-version";
import { Button } from "../ui/button";

const ONBOARDING_KEY = "mai.onboarding.v1.completed";
const WHATS_NEW_KEY = "mai.whatsnew.version";

export function ProductAnnouncements() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  useEffect(() => {
    const onboardingDone = localStorage.getItem(ONBOARDING_KEY) === "true";
    if (!onboardingDone) {
      setShowOnboarding(true);
    }

    const seenVersion = localStorage.getItem(WHATS_NEW_KEY);
    if (seenVersion !== APP_VERSION) {
      setShowWhatsNew(true);
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

  return (
    <>
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
                Compteur mots/caractères, templates mAIs, snippets interpreter,
                historique Speaky, bibliothèque améliorée, onboarding et support
                PWA.
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
