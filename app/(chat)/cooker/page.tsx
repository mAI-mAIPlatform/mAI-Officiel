"use client";

import { ChefHat, History, Settings2, Sparkles } from "lucide-react";
import { Streamdown } from "streamdown";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { chatModels } from "@/lib/ai/models";
import { cn } from "@/lib/utils";

type Category = "Plat" | "Entrée" | "Dessert";
type Refinement = "none" | "simple" | "light" | "gourmet";

type CookerDefaults = {
  category: Category;
  includeDefaults: string;
  excludeDefaults: string;
  maxMinutes: number;
  servings: number;
  thermomixMode: boolean;
  modelId: string;
};

type RecipeHistoryEntry = {
  createdAt: string;
  id: string;
  recipe: string;
  title: string;
};

const includeSuggestions = [
  "tomates",
  "ail",
  "oignon",
  "basilic",
  "thym",
  "romarin",
  "citron",
  "riz",
  "quinoa",
  "poulet",
  "saumon",
  "pois chiches",
  "courgettes",
  "épinards",
  "champignons",
];

const excludeSuggestions = [
  "arachides",
  "gluten",
  "lactose",
  "soja",
  "fruits à coque",
  "sésame",
  "crustacés",
  "porc",
  "piment",
  "coriandre",
  "œufs",
  "beurre",
  "ail",
  "oignon",
  "tomate",
];

const STORAGE_KEY = "mai.cooker.defaults.v1";
const HISTORY_KEY = "mai.cooker.recipe-history.v1";
const DEFAULT_COOKER_MODEL_KEY = "mai.settings.default.cooker-model.v1";

function splitCommaIngredients(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getDefaultCookerModel() {
  if (typeof window === "undefined") {
    return "gpt-5.5";
  }
  return window.localStorage.getItem(DEFAULT_COOKER_MODEL_KEY) ?? "gpt-5.5";
}

function loadDefaults(): CookerDefaults {
  if (typeof window === "undefined") {
    return {
      category: "Plat",
      includeDefaults: "",
      excludeDefaults: "",
      maxMinutes: 30,
      servings: 4,
      thermomixMode: false,
      modelId: getDefaultCookerModel(),
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("no data");
    return JSON.parse(raw) as CookerDefaults;
  } catch {
    return {
      category: "Plat",
      includeDefaults: "",
      excludeDefaults: "",
      maxMinutes: 30,
      servings: 4,
      thermomixMode: false,
      modelId: getDefaultCookerModel(),
    };
  }
}

function loadHistory(): RecipeHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecipeHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch {
    return [];
  }
}

export default function CookerPage() {
  const defaults = useMemo(() => loadDefaults(), []);
  const [description, setDescription] = useState("");
  const [includeIngredients, setIncludeIngredients] = useState(defaults.includeDefaults);
  const [excludeIngredients, setExcludeIngredients] = useState(defaults.excludeDefaults);
  const [maxMinutes, setMaxMinutes] = useState(defaults.maxMinutes);
  const [servings, setServings] = useState(defaults.servings);
  const [category, setCategory] = useState<Category>(defaults.category);
  const [thermomixMode, setThermomixMode] = useState(defaults.thermomixMode);
  const [modelId, setModelId] = useState(defaults.modelId);
  const [recipe, setRecipe] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<RecipeHistoryEntry[]>(() => loadHistory());

  const includeChips = splitCommaIngredients(includeIngredients);
  const excludeChips = splitCommaIngredients(excludeIngredients);

  const saveHistory = (entry: RecipeHistoryEntry) => {
    setHistory((current) => {
      const next = [entry, ...current].slice(0, 20);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const generateRecipe = async (refinement: Refinement = "none") => {
    if (!description.trim() && !recipe.trim()) {
      setError("Ajoutez une envie de recette.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cooker/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description: description.trim() || "Régénérer la recette actuelle.",
          includeIngredients: includeChips,
          excludeIngredients: excludeChips,
          maxPreparationMinutes: maxMinutes,
          servings,
          thermomixMode,
          modelId,
          refinement,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Erreur de génération.");
        return;
      }

      const nextRecipe = payload.recipe ?? "Aucune recette générée.";
      setRecipe(nextRecipe);
      saveHistory({
        createdAt: new Date().toISOString(),
        id: crypto.randomUUID(),
        recipe: nextRecipe,
        title: (description || "Recette").slice(0, 60),
      });
    } catch {
      setError("Le service Cooker est indisponible.");
    } finally {
      setLoading(false);
    }
  };

  const saveDefaults = () => {
    const data: CookerDefaults = {
      category,
      includeDefaults: includeIngredients,
      excludeDefaults: excludeIngredients,
      maxMinutes,
      servings,
      thermomixMode,
      modelId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setShowSettings(false);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-5 overflow-y-auto p-4 md:p-8">
      <header className="liquid-glass rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ChefHat className="size-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Cooker</h1>
              <p className="text-sm text-muted-foreground">Générez des recettes complètes avec votre modèle IA préféré.</p>
            </div>
          </div>
          <Button onClick={() => setShowSettings((current) => !current)} type="button" variant="outline">
            <Settings2 className="mr-2 size-4" /> Paramètres
          </Button>
        </div>

        {showSettings ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-border/50 bg-background/60 p-4 md:grid-cols-2">
            <label className="text-sm">Modèle IA par défaut
              <select className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background px-2" onChange={(event) => setModelId(event.target.value)} value={modelId}>
                {chatModels.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
              </select>
            </label>
            <label className="text-sm">Catégorie
              <select className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background px-2" onChange={(event) => setCategory(event.target.value as Category)} value={category}>
                <option value="Plat">Plat</option><option value="Entrée">Entrée</option><option value="Dessert">Dessert</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
              <input checked={thermomixMode} onChange={(event) => setThermomixMode(event.target.checked)} type="checkbox" /> Mode Thermomix par défaut
            </label>
            <div className="md:col-span-2"><Button onClick={saveDefaults} type="button">Enregistrer les paramètres</Button></div>
          </div>
        ) : null}
      </header>

      <section className="liquid-glass rounded-2xl p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm md:col-span-2">Que voulez-vous cuisiner ?
            <textarea className="mt-1 h-24 w-full rounded-xl border border-border/60 bg-background/60 p-3" onChange={(event) => setDescription(event.target.value)} placeholder="ex: velouté potimarron" value={description} />
          </label>
          <label className="text-sm">Ingrédients à inclure (séparés par des virgules)
            <input className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background px-2" onChange={(event) => setIncludeIngredients(event.target.value)} placeholder="ex: poulet, tomates, riz" value={includeIngredients} />
            <div className="mt-2 flex flex-wrap gap-2">
              {includeChips.map((chip) => <span className="rounded-full border px-2 py-0.5 text-xs" key={`in-${chip}`}>+ {chip}</span>)}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {includeSuggestions.slice(0, 5).map((item) => (
                <button className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary" key={item} onClick={() => setIncludeIngredients((current) => (current ? `${current}, ${item}` : item))} type="button">✨ {item}</button>
              ))}
            </div>
          </label>
          <label className="text-sm">Ingrédients à ne pas mettre (séparés par des virgules)
            <input className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background px-2" onChange={(event) => setExcludeIngredients(event.target.value)} placeholder="ex: arachides, gluten" value={excludeIngredients} />
            <div className="mt-2 flex flex-wrap gap-2">
              {excludeChips.map((chip) => <span className="rounded-full border px-2 py-0.5 text-xs" key={`out-${chip}`}>- {chip}</span>)}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {excludeSuggestions.slice(0, 5).map((item) => (
                <button className="rounded-full border border-rose-300/40 bg-rose-100/50 px-3 py-1 text-xs text-rose-600" key={item} onClick={() => setExcludeIngredients((current) => (current ? `${current}, ${item}` : item))} type="button">✕ {item}</button>
              ))}
            </div>
          </label>
          <label className="text-sm">Personnes
            <input className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background px-2" min={1} onChange={(event) => setServings(Number(event.target.value) || 1)} type="number" value={servings} />
          </label>
          <label className="text-sm">Temps max (min)
            <input className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background px-2" min={5} onChange={(event) => setMaxMinutes(Number(event.target.value) || 5)} type="number" value={maxMinutes} />
          </label>
          <label className="text-sm">Catégorie
            <select className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background px-2" onChange={(event) => setCategory(event.target.value as Category)} value={category}>
              <option value="Plat">Plat</option><option value="Entrée">Entrée</option><option value="Dessert">Dessert</option>
            </select>
          </label>
          <label className="text-sm">Modèle IA
            <select className="mt-1 h-10 w-full rounded-lg border border-border/60 bg-background px-2" onChange={(event) => setModelId(event.target.value)} value={modelId}>
              {chatModels.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
            <input checked={thermomixMode} onChange={(event) => setThermomixMode(event.target.checked)} type="checkbox" /> Mode Thermomix
          </label>
        </div>

        <Button className="mt-5 w-full" onClick={() => generateRecipe("none")} type="button">
          <Sparkles className="mr-2 size-4" /> {loading ? "Génération..." : "Générer la recette"}
        </Button>
        {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
      </section>

      <section className={cn("liquid-glass rounded-2xl p-5", !recipe && "text-muted-foreground")}>
        {recipe ? (
          <div className="prose prose-sm max-w-none dark:prose-invert" style={{ fontFamily: "Atkinson Hyperlegible, Inter, system-ui, sans-serif" }}>
            <Streamdown>{recipe}</Streamdown>
          </div>
        ) : (
          "La recette générée s'affichera ici."
        )}
        {recipe ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-full border px-3 py-1 text-xs" onClick={() => generateRecipe("simple")} type="button">Plus simple</button>
            <button className="rounded-full border px-3 py-1 text-xs" onClick={() => generateRecipe("light")} type="button">Plus léger</button>
            <button className="rounded-full border px-3 py-1 text-xs" onClick={() => generateRecipe("gourmet")} type="button">Plus gourmet</button>
          </div>
        ) : null}
      </section>

      <section className="liquid-glass rounded-2xl p-5">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><History className="size-4" /> Historique des recettes</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {history.slice(0, 8).map((entry) => (
            <button className="rounded-xl border border-border/60 p-3 text-left text-xs" key={entry.id} onClick={() => setRecipe(entry.recipe)} type="button">
              <p className="font-semibold">{entry.title || "Recette"}</p>
              <p className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString("fr-FR")}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
