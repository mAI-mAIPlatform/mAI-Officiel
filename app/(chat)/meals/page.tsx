"use client";

import {
  ClipboardList,
  Download,
  SendHorizonal,
  UploadCloud,
  Utensils,
} from "lucide-react";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
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

type Result = { link: string; snippet: string; source: string; title: string };

type ReportHistory = { createdAt: string; query: string; report: string };

const MEALS_HISTORY_STORAGE_KEY = "mai.meals.history.v2";
const dietaryFocuses = [
  "Équilibré",
  "Végétarien",
  "Protéiné",
  "Sans gluten",
] as const;

const MEALS_INSPIRATION_BUBBLES = [
  "Recettes de saison rapides",
  "Dîner végétarien léger",
  "Plats traditionnels revisités",
  "Desserts sans sucre ajouté",
  "Repas de fête à petit budget",
] as const;

export default function MealsPage() {
  const { currentPlanDefinition, isHydrated } = useSubscriptionPlan();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [report, setReport] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [externalContext, setExternalContext] = useState("");
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [searchesToday, setSearchesToday] = useState(0);
  const [quotaMessage, setQuotaMessage] = useState<string | null>(null);
  const [importSource, setImportSource] = useState<"device" | "mai-library">(
    "device"
  );
  const [selectedModel, setSelectedModel] = useState<ExtensionAiModel>(
    defaultExtensionAiModel
  );
  const [dietaryFocus, setDietaryFocus] =
    useState<(typeof dietaryFocuses)[number]>("Équilibré");
  const [servings, setServings] = useState(2);

  const dailyLimit = currentPlanDefinition.limits.mealsSearchesPerDay;
  const remainingSearches = Math.max(dailyLimit - searchesToday, 0);
  const randomBubbles = useMemo(
    () =>
      [...MEALS_INSPIRATION_BUBBLES]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3),
    []
  );

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    setSearchesToday(getUsageCount("meals", "day"));
    const rawHistory = localStorage.getItem(MEALS_HISTORY_STORAGE_KEY);
    if (rawHistory) {
      try {
        const parsed = JSON.parse(rawHistory) as ReportHistory[];
        setHistory(Array.isArray(parsed) ? parsed.slice(0, 10) : []);
      } catch {
        localStorage.removeItem(MEALS_HISTORY_STORAGE_KEY);
      }
    }
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    localStorage.setItem(
      MEALS_HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, 10))
    );
  }, [history, isHydrated]);

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    setExternalContext(text.slice(0, 2500));
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      setQuotaMessage("Ajoutez une requête recette avant de lancer CookAI.");
      return;
    }

    if (!canConsumeUsage("meals", "day", dailyLimit)) {
      setQuotaMessage(
        `Quota CookAI atteint (${dailyLimit}/jour). Passez au forfait supérieur ou réessayez demain.`
      );
      return;
    }

    setQuotaMessage(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/meals/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileContext: externalContext,
          model: selectedModel,
          query: `${query} | régime: ${dietaryFocus} | portions: ${servings}`,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setReport(payload.error ?? "Erreur lors de la recherche.");
        return;
      }

      setResults(payload.organicResults ?? []);
      const generatedReport =
        payload.report ?? payload.error ?? "Aucun rapport généré";
      setReport(
        `${buildAiCopilotNote(selectedModel, "cuisine", query)}\nPréférence: ${dietaryFocus} · Portions: ${servings}\n\n${generatedReport}`
      );
      const usage = consumeUsage("meals", "day");
      setSearchesToday(usage.count);
      if (payload.report) {
        setHistory((prev) => [
          {
            createdAt: new Date().toISOString(),
            query,
            report: payload.report,
          },
          ...prev,
        ]);
      }
    } catch {
      setReport("Impossible de contacter le service CookAI. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  const reportAsBlob = useMemo(
    () => new Blob([report], { type: "text/plain;charset=utf-8" }),
    [report]
  );

  const shoppingList = useMemo(() => {
    if (!report) {
      return [];
    }

    return report
      .split("\n")
      .filter(
        (line) => /[-•]/.test(line) || /ingrédient|ingredient/i.test(line)
      )
      .slice(0, 8);
  }, [report]);

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-5 overflow-y-auto p-6 md:p-10">
      <div className="flex items-center gap-3">
        <Utensils className="size-8 text-primary" />
        <h1 className="text-3xl font-bold">Recettes & Repas (CookAI)</h1>
        <p className="text-xs text-muted-foreground">
          Propulsé par {selectedModel}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {randomBubbles.map((bubble) => (
          <button
            className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary"
            key={bubble}
            onClick={() => setQuery(bubble)}
            type="button"
          >
            ✨ {bubble}
          </button>
        ))}
      </div>

      <div className="liquid-glass rounded-2xl p-4">
        <p className="mb-3 text-xs text-muted-foreground">
          Quota CookAI : {searchesToday}/{dailyLimit} recherches
          aujourd&apos;hui ({remainingSearches} restante
          {remainingSearches > 1 ? "s" : ""}).
        </p>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="h-11 flex-1 rounded-xl border border-border bg-background/60 px-3"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une recette avec assistance IA..."
            value={query}
          />
          <Button
            disabled={isLoading || !isHydrated || remainingSearches <= 0}
            onClick={handleSearch}
          >
            {isLoading ? "Recherche..." : "Rechercher"}
          </Button>
          <select
            className="h-11 rounded-xl border border-border bg-background/60 px-3 text-xs"
            onChange={(event) =>
              setSelectedModel(event.target.value as ExtensionAiModel)
            }
            value={selectedModel}
          >
            {extensionAiModels.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
          <select
            className="h-11 rounded-xl border border-border bg-background/60 px-3 text-xs"
            onChange={(event) =>
              setDietaryFocus(
                event.target.value as (typeof dietaryFocuses)[number]
              )
            }
            value={dietaryFocus}
          >
            {dietaryFocuses.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
          <input
            className="h-11 w-24 rounded-xl border border-border bg-background/60 px-3 text-xs"
            max={12}
            min={1}
            onChange={(event) =>
              setServings(
                Math.min(12, Math.max(1, Number(event.target.value) || 1))
              )
            }
            type="number"
            value={servings}
          />
          <select
            className="h-11 rounded-xl border border-border bg-background/60 px-3 text-xs"
            onChange={(event) =>
              setImportSource(event.target.value as "device" | "mai-library")
            }
            value={importSource}
          >
            <option value="device">Source : appareil local</option>
            <option value="mai-library">Source : Bibliothèque mAI</option>
          </select>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3">
            <UploadCloud className="size-4" />
            {importSource === "device"
              ? "Importer un fichier"
              : "Choisir depuis mAI"}
            <input className="hidden" onChange={handleImportFile} type="file" />
          </label>
        </div>
        {quotaMessage && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            {quotaMessage}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="liquid-glass rounded-2xl p-4">
          <h2 className="mb-2 font-semibold">Résultats Web (mSearch)</h2>
          <div className="space-y-3 text-sm">
            {results.map((item) => (
              <a
                className="block rounded-lg border border-border/50 p-3 hover:bg-muted/40"
                href={item.link}
                key={item.link}
                rel="noreferrer"
                target="_blank"
              >
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">{item.snippet}</p>
              </a>
            ))}
            {results.length === 0 && (
              <p className="text-muted-foreground">
                Aucun résultat pour le moment.
              </p>
            )}
          </div>
        </div>

        <div className="liquid-glass rounded-2xl p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Rapport de synthèse</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const url = URL.createObjectURL(reportAsBlob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "rapport-recettes.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                size="sm"
                variant="outline"
              >
                <Download className="mr-1 size-4" />
                Télécharger
              </Button>
              <Button size="sm" variant="outline">
                <SendHorizonal className="mr-1 size-4" />
                Envoyer
              </Button>
            </div>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-background/70 p-3 text-xs">
            {report || "La synthèse complète sera affichée ici."}
          </pre>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl p-4">
        <h3 className="mb-2 flex items-center gap-2 font-semibold">
          <ClipboardList className="size-4 text-primary" /> Liste de courses
          rapide
        </h3>
        {shoppingList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Lancez une recherche pour générer une liste de courses.
          </p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {shoppingList.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="liquid-glass rounded-2xl p-4">
        <h3 className="mb-2 font-semibold">Historique des rapports</h3>
        <div className="space-y-2 text-sm">
          {history.map((item) => (
            <button
              className="w-full rounded-lg border border-border/50 p-3 text-left hover:bg-background/45"
              key={`${item.createdAt}-${item.query}`}
              onClick={() => {
                setQuery(item.query);
                setReport(item.report);
              }}
              type="button"
            >
              <p className="font-medium">{item.query}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </button>
          ))}
          {history.length === 0 && (
            <p className="text-muted-foreground">
              Aucun historique disponible.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
