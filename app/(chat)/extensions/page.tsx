"use client";

import {
  ArrowUpRight,
  EyeOff,
  Pin,
  PinOff,
  PuzzleIcon,
  Star,
  StarOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  defaultExtensionAiModel,
  type ExtensionAiModel,
  extensionAiModelOptions,
} from "@/lib/ai/extension-models";
import { extensionCatalog } from "./data";

type ExtensionPreferences = {
  favorites: string[];
  hidden: string[];
  pinned: string[];
};

type ExtensionFilter = "all" | "favorites" | "pinned" | "hidden";

const STORAGE_KEY = "mai-extensions-preferences-v1";

const defaultPreferences: ExtensionPreferences = {
  favorites: [],
  hidden: [],
  pinned: [],
};

export default function ExtensionsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<ExtensionFilter>("all");
  const [preferences, setPreferences] =
    useState<ExtensionPreferences>(defaultPreferences);
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalModel, setGlobalModel] = useState<ExtensionAiModel>(
    defaultExtensionAiModel
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsHydrated(true);
        return;
      }

      const parsed = JSON.parse(stored) as Partial<ExtensionPreferences>;

      setPreferences({
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
        pinned: Array.isArray(parsed.pinned) ? parsed.pinned : [],
      });
    } catch {
      setPreferences(defaultPreferences);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [isHydrated, preferences]);

  const visibleExtensions = useMemo(() => {
    const hiddenSet = new Set(preferences.hidden);
    const favoriteSet = new Set(preferences.favorites);
    const pinnedSet = new Set(preferences.pinned);

    const withMeta = extensionCatalog.map((extension) => ({
      ...extension,
      isHidden: hiddenSet.has(extension.id),
      isFavorite: favoriteSet.has(extension.id),
      isPinned: pinnedSet.has(extension.id),
    }));

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = withMeta.filter((extension) => {
      const visibleByFilter =
        filter === "all"
          ? !extension.isHidden
          : filter === "favorites"
            ? extension.isFavorite && !extension.isHidden
            : filter === "pinned"
              ? extension.isPinned && !extension.isHidden
              : extension.isHidden;

      if (!visibleByFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        extension.title.toLowerCase().includes(normalizedSearch) ||
        extension.description.toLowerCase().includes(normalizedSearch)
      );
    });

    return filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }

      return a.title.localeCompare(b.title, "fr");
    });
  }, [
    filter,
    preferences.favorites,
    preferences.hidden,
    preferences.pinned,
    searchTerm,
  ]);

  const togglePreference = (
    key: keyof ExtensionPreferences,
    extensionId: string,
    forceValue?: boolean
  ) => {
    setPreferences((previous) => {
      const currentSet = new Set(previous[key]);
      const nextValue = forceValue ?? !currentSet.has(extensionId);

      if (nextValue) {
        currentSet.add(extensionId);
      } else {
        currentSet.delete(extensionId);
      }

      const next: ExtensionPreferences = {
        ...previous,
        [key]: [...currentSet],
      };

      // Bugfix UX: si une extension est masquée, on la retire des épinglés.
      if (key === "hidden" && nextValue) {
        next.pinned = next.pinned.filter((id) => id !== extensionId);
      }

      return next;
    });
  };

  const filters: Array<{ id: ExtensionFilter; label: string }> = [
    { id: "all", label: "Toutes" },
    { id: "favorites", label: "Favoris" },
    { id: "pinned", label: "Épinglées" },
    { id: "hidden", label: "Masquées" },
  ];

  const handleOpenExtension = (route: string) => {
    const separator = route.includes("?") ? "&" : "?";
    router.push(`${route}${separator}model=${globalModel}`);
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <header className="liquid-glass rounded-2xl border border-border/50 p-5">
        <div className="flex items-center gap-3">
          <PuzzleIcon className="size-8 text-foreground" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Extensions</h1>
              <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white">
                Bêta
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Retrouvez LearnUp, Shopper, Actualités, CookAI, mAIHealth, Studio
              et vos autres extensions dans un hub unique, avec les modes
              Masquer, Favoris et Épingler.
            </p>
          </div>
        </div>
      </header>

      <section className="liquid-glass grid gap-3 rounded-2xl border border-border/50 p-4 md:grid-cols-2">
        <label className="text-xs text-muted-foreground">
          Recherche extension
          <input
            className="mt-1 h-10 w-full rounded-xl border border-border/60 bg-background/60 px-3 text-sm"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Ex: rédaction, santé, shopping..."
            value={searchTerm}
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Modèle global par défaut
          <select
            className="mt-1 h-10 w-full rounded-xl border border-border/60 bg-background/60 px-3 text-sm"
            onChange={(event) =>
              setGlobalModel(event.target.value as ExtensionAiModel)
            }
            value={globalModel}
          >
            {extensionAiModelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} · coût {option.monthlyCostProfile}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="liquid-glass rounded-2xl border border-border/50 p-4">
        <p className="mb-2 text-xs text-muted-foreground">
          Tous les modules sont propulsés par les modèles IA disponibles :
        </p>
        <div className="flex flex-wrap gap-2">
          {extensionAiModelOptions.map((option) => (
            <span
              className="rounded-full border border-border/60 bg-background/50 px-2 py-1 text-[11px] text-muted-foreground"
              key={option.id}
              title={option.strengths}
            >
              {option.id}
            </span>
          ))}
        </div>
      </section>

      <section className="liquid-glass flex flex-wrap gap-2 rounded-2xl border border-border/50 p-3">
        {filters.map((item) => {
          const active = filter === item.id;

          return (
            <button
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                active
                  ? "border-foreground/40 bg-foreground/10 text-foreground"
                  : "border-border/60 bg-background/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              }`}
              key={item.id}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleExtensions.length === 0 && (
          <div className="liquid-glass rounded-2xl border border-border/50 p-4 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            Aucune extension ne correspond à votre recherche.
          </div>
        )}
        {visibleExtensions.map((extension) => (
          <div
            className="liquid-glass group rounded-2xl border border-border/50 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[var(--shadow-card)]"
            key={extension.id}
          >
            <button
              className="w-full cursor-pointer text-left"
              onClick={() => handleOpenExtension(extension.route)}
              type="button"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xl font-semibold">
                  <span className="inline-flex size-8 items-center justify-center rounded-xl border border-black/20 bg-white text-black shadow-sm dark:border-white/20 dark:bg-black dark:text-white">
                    <extension.icon
                      className="size-4 stroke-[2.2]"
                      stroke="currentColor"
                    />
                  </span>
                  <h2 className="text-lg font-bold text-foreground">
                    {extension.title}
                  </h2>
                </div>
                <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                  Standard
                </span>
              </div>

              <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                {extension.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs text-foreground">
                Ouvrir l&apos;extension
                <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                aria-pressed={extension.isFavorite}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition ${
                  extension.isFavorite
                    ? "border-foreground/40 bg-foreground/10 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  togglePreference("favorites", extension.id);
                }}
                type="button"
              >
                {extension.isFavorite ? (
                  <StarOff className="size-3" />
                ) : (
                  <Star className="size-3" />
                )}
                {extension.isFavorite ? "Retirer favori" : "Favori"}
              </button>

              <button
                aria-pressed={extension.isPinned}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition ${
                  extension.isPinned
                    ? "border-foreground/40 bg-foreground/10 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
                disabled={extension.isHidden}
                onClick={(event) => {
                  event.stopPropagation();
                  togglePreference("pinned", extension.id);
                }}
                type="button"
              >
                {extension.isPinned ? (
                  <PinOff className="size-3" />
                ) : (
                  <Pin className="size-3" />
                )}
                {extension.isPinned ? "Désépingler" : "Épingler"}
              </button>

              <button
                aria-pressed={extension.isHidden}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] transition ${
                  extension.isHidden
                    ? "border-foreground/40 bg-foreground/10 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  togglePreference("hidden", extension.id);
                }}
                type="button"
              >
                <EyeOff className="size-3" />
                {extension.isHidden ? "Afficher" : "Masquer"}
              </button>
            </div>
          </div>
        ))}
      </section>

      {visibleExtensions.length === 0 ? (
        <p className="liquid-glass rounded-2xl border border-border/50 p-4 text-sm text-muted-foreground">
          Aucune extension dans ce filtre pour le moment.
        </p>
      ) : null}
    </div>
  );
}
