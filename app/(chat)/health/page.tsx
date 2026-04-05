"use client";

import {
  AlertTriangle,
  FileText,
  HeartPulse,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import {
  canConsumeUsage,
  consumeUsage,
  getUsageCount,
} from "@/lib/usage-limits";

const riskKeywords = [
  "douleur",
  "fièvre",
  "urgence",
  "sang",
  "malaise",
  "violence",
  "abus",
  "suicide",
];

export default function HealthPage() {
  const { currentPlanDefinition, isHydrated } = useSubscriptionPlan();
  const [documentText, setDocumentText] = useState("");
  const [hasRequestedAnalysis, setHasRequestedAnalysis] = useState(false);
  const [requestsThisMonth, setRequestsThisMonth] = useState(0);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);

  const monthlyLimit = currentPlanDefinition.limits.healthRequestsPerMonth;
  const remainingRequests = Math.max(monthlyLimit - requestsThisMonth, 0);

  const analysis = useMemo(() => {
    const normalized = documentText.toLowerCase();
    const matchedKeywords = riskKeywords.filter((keyword) =>
      normalized.includes(keyword)
    );

    return {
      wordCount: normalized.trim() ? normalized.trim().split(/\s+/).length : 0,
      matchedKeywords,
      priority:
        matchedKeywords.length >= 3
          ? "Élevée"
          : matchedKeywords.length > 0
            ? "Modérée"
            : "Normale",
    };
  }, [documentText]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    setRequestsThisMonth(getUsageCount("health", "month"));
  }, [isHydrated]);

  const handleRequestAnalysis = () => {
    if (!documentText.trim()) {
      setQuotaMessage("Ajoutez un texte clinique avant de lancer l'analyse.");
      return;
    }

    if (!canConsumeUsage("health", "month", monthlyLimit)) {
      setQuotaMessage(
        `Quota mAIHealth atteint (${monthlyLimit}/mois). Passez au forfait supérieur pour continuer.`
      );
      return;
    }

    const usage = consumeUsage("health", "month");
    setRequestsThisMonth(usage.count);
    setHasRequestedAnalysis(true);
    setQuotaMessage(null);
  };

  return (
    <div className="liquid-glass flex h-full w-full max-w-6xl flex-col gap-6 overflow-y-auto p-4 md:p-8">
      <header className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <HeartPulse className="size-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">mAIHealth</h1>
            <p className="text-sm text-muted-foreground">
              Module de santé numérique pour l&apos;analyse préliminaire de
              documents médicaux.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" /> Clause obligatoire
          </p>
          <p className="mt-1">
            mAIHealth ne remplace pas un professionnel de santé.
          </p>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="liquid-glass rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
          <p className="mb-3 flex items-center gap-2 text-base font-semibold">
            <FileText className="size-4" /> Document clinique
          </p>
          <textarea
            className="h-72 w-full resize-none rounded-xl border border-border/50 bg-background/60 p-3 text-sm outline-none"
            onChange={(event) => {
              setDocumentText(event.target.value);
              setHasRequestedAnalysis(false);
            }}
            placeholder="Collez un compte-rendu, une ordonnance ou une note clinique à analyser..."
            value={documentText}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Conseil sécurité : anonymisez les données sensibles avant tout
            traitement.
          </p>
        </article>

        <article className="liquid-glass rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
          <p className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Stethoscope className="size-4" /> Pré-analyse IA
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Quota mAIHealth : {requestsThisMonth}/{monthlyLimit} requêtes ce
            mois ({remainingRequests} restante{remainingRequests > 1 ? "s" : ""}
            ).
          </p>
          <div className="space-y-3 rounded-xl border border-border/40 bg-background/60 p-4 text-sm">
            {!hasRequestedAnalysis && (
              <p className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                Lancez une requête pour afficher la pré-analyse IA.
              </p>
            )}
            <p>
              <span className="font-medium">Volume :</span>{" "}
              {hasRequestedAnalysis ? analysis.wordCount : 0} mots
            </p>
            <p>
              <span className="font-medium">Priorité suggérée :</span>{" "}
              {hasRequestedAnalysis ? analysis.priority : "—"}
            </p>
            <div>
              <p className="font-medium">Signaux repérés :</p>
              {hasRequestedAnalysis && analysis.matchedKeywords.length > 0 ? (
                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                  {analysis.matchedKeywords.map((keyword) => (
                    <li key={keyword}>{keyword}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  {hasRequestedAnalysis
                    ? "Aucun mot-clé critique détecté automatiquement."
                    : "Aucune analyse exécutée pour le moment."}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-800 dark:text-red-200">
            <p className="flex items-center gap-2 font-medium">
              <ShieldAlert className="size-4" /> Sécurité & signalement
            </p>
            <p className="mt-1">
              En cas de contenu sensible (violence, abus, mise en danger),
              utilisez le bouton de signalement dans les messages pour renforcer
              la modération.
            </p>
          </div>

          {quotaMessage && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              {quotaMessage}
            </p>
          )}

          <Button
            className="mt-4"
            disabled={!isHydrated || remainingRequests <= 0}
            onClick={handleRequestAnalysis}
            type="button"
            variant="outline"
          >
            Lancer une requête mAIHealth
          </Button>
        </article>
      </section>
    </div>
  );
}
