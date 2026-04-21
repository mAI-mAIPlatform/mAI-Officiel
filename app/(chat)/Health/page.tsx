"use client";

import {
  AlertTriangle,
  CircleAlert,
  FileText,
  HeartPulse,
  Pill,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";
import {
  buildAiCopilotNote,
  defaultExtensionAiModel,
  type ExtensionAiModel,
  extensionAiModels,
} from "@/lib/ai/extension-models";
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
  const searchParams = useSearchParams();
  const { currentPlanDefinition, isHydrated } = useSubscriptionPlan();
  const [documentText, setDocumentText] = useState("");
  const [hasRequestedAnalysis, setHasRequestedAnalysis] = useState(false);
  const [requestsThisMonth, setRequestsThisMonth] = useState(0);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);
  const [aiPlan, setAiPlan] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<ExtensionAiModel>(
    defaultExtensionAiModel
  );

  useEffect(() => {
    const modelFromRoute = searchParams.get("model");
    if (!modelFromRoute) {
      return;
    }

    if (extensionAiModels.includes(modelFromRoute as ExtensionAiModel)) {
      setSelectedModel(modelFromRoute as ExtensionAiModel);
    }
  }, [searchParams]);
  const healthBubbles = useMemo(
    () =>
      [
        "Analyse d'une ordonnance",
        "Résumé d'un compte-rendu",
        "Vérification dose et fréquence",
        "Checklist pré-consultation",
      ]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3),
    []
  );

  const monthlyLimit = currentPlanDefinition.limits.healthRequestsPerMonth;
  const remainingRequests = Math.max(monthlyLimit - requestsThisMonth, 0);
  const usagePercent = monthlyLimit
    ? Math.min((requestsThisMonth / monthlyLimit) * 100, 100)
    : 0;

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

    const actions = [
      buildAiCopilotNote(selectedModel, "santé", documentText),
      "Vérifier que l'identité patient est anonymisée.",
      "Confirmer les doses et fréquences avec le référentiel médical local.",
      "Documenter les points d'incertitude pour le praticien.",
    ];

    if (analysis.matchedKeywords.length > 0) {
      actions.unshift(
        "Escalader la revue clinique rapidement en raison des signaux détectés."
      );
    }

    setAiPlan(actions);
  };

  return (
    <div className="liquid-glass flex h-full w-full max-w-6xl flex-col gap-6 overflow-y-auto p-4 md:p-8">
      <header className="liquid-glass rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <HeartPulse className="size-8 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">mAIHealth</h1>
              <span className="rounded-full border border-emerald-400/60 bg-emerald-200/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-500/20 dark:text-emerald-200">
                Release Candidate
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Pré-analyse clinique assistée IA, orientée sécurité et
              collaboration médecin-patient.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-border/50 bg-background/50 p-3">
          <label className="text-xs text-muted-foreground">
            Modèle IA clinique
            <select
              className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm"
              onChange={(event) =>
                setSelectedModel(event.target.value as ExtensionAiModel)
              }
              value={selectedModel}
            >
              {extensionAiModels.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </label>
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

      <div className="flex flex-wrap gap-2">
        {healthBubbles.map((bubble) => (
          <button
            className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
            key={bubble}
            onClick={() => {
              setDocumentText((current) =>
                current ? `${current}\n${bubble}` : bubble
              );
              setHasRequestedAnalysis(false);
            }}
            type="button"
          >
            ✨ {bubble}
          </button>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="liquid-glass rounded-2xl p-5">
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

        <article className="liquid-glass rounded-2xl p-5">
          <p className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Stethoscope className="size-4" /> Pré-analyse IA
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Quota mAIHealth : {requestsThisMonth}/{monthlyLimit} requêtes ce
            mois ({remainingRequests} restante{remainingRequests > 1 ? "s" : ""}
            ).
          </p>
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-primary/80 transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>
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
            <div className="rounded-lg border border-border/50 bg-background/65 p-3 text-xs text-muted-foreground">
              <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                <Pill className="size-3.5" />
                Plan d&apos;actions recommandé
              </p>
              <ul className="list-disc space-y-1 pl-4">
                {(hasRequestedAnalysis
                  ? aiPlan
                  : ["Analyse en attente..."]
                ).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-800 dark:text-red-200">
            <p className="flex items-center gap-2 font-medium">
              <ShieldAlert className="size-4" /> Sécurité & signalement
            </p>
            <p className="mt-1">
              En cas de contenu sensible (violence, abus, mise en danger),
              utilisez le bouton de signalement pour renforcer la modération.
            </p>
          </div>

          {quotaMessage && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              <span className="inline-flex items-center gap-1">
                <CircleAlert className="size-4" />
                {quotaMessage}
              </span>
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
