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

    const filtered = withMeta.filter((extension) => {
      if (filter === "all") {
        return !extension.isHidden;
      }

      if (filter === "favorites") {
        return extension.isFavorite && !extension.isHidden;
      }

      if (filter === "pinned") {
        return extension.isPinned && !extension.isHidden;
      }

      return extension.isHidden;
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
  }, [filter, preferences.favorites, preferences.hidden, preferences.pinned]);

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
    router.push(route);
  };

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <header className="liquid-glass rounded-2xl border border-border/50 p-5">
        <div className="flex items-center gap-3">
          <PuzzleIcon className="size-8 text-foreground" />
          <div>
            <h1 className="text-3xl font-bold">Catalogue centralisé des mini-apps</h1>
            <p className="text-sm text-muted-foreground">
              Retrouvez LearnUp, Shopper, Actualités, mAIRepas, mAIHealth,
              Studio et vos autres extensions dans un hub unique, avec les modes
              Masquer, Favoris et Épingler, toujours en interface Liquid Glass.
            </p>
          </div>
        </div>
      </header>

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
        {visibleExtensions.map((extension) => (
          <div
            className="liquid-glass group rounded-2xl border border-border/50 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[var(--shadow-card)]"
            key={extension.id}
            onClick={() => handleOpenExtension(extension.route)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleOpenExtension(extension.route);
              }
            }}
            role="button"
            tabIndex={0}
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
              {extension.premium ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-foreground/20 bg-foreground/5 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                  <Star className="size-3" /> Premium
                </span>
              ) : (
                <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                  Standard
                </span>
              )}
            </div>

            <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
              {extension.description}
            </p>

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

            <p className="mt-4 inline-flex items-center gap-1 text-xs text-foreground">
              Ouvrir l&apos;extension
              <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </p>
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
