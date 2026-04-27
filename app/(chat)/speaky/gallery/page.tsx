"use client";

import {
  Copy,
  ExternalLink,
  Flag,
  Heart,
  Play,
  QrCode,
  Share2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";
import {
  SPEAKY_FAVORITES_STORAGE_KEY,
  SPEAKY_PUBLIC_GALLERY_STORAGE_KEY,
  type PublicSpeakyCreation,
  type SpeakyGalleryCategory,
} from "@/lib/speaky-gallery";

const CATEGORY_LABELS: Record<SpeakyGalleryCategory, string> = {
  narration: "Narration",
  education: "Éducation",
  entertainment: "Divertissement",
  music: "Musique",
  professional: "Professionnel",
};

const SORT_OPTIONS = [
  { key: "popular", label: "Popularité" },
  { key: "recent", label: "Date" },
  { key: "duration", label: "Durée" },
] as const;

function formatDuration(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function SpeakyGalleryPage() {
  const [galleryItems, setGalleryItems] = useLocalStorage<PublicSpeakyCreation[]>(
    SPEAKY_PUBLIC_GALLERY_STORAGE_KEY,
    []
  );
  const [favoriteIds, setFavoriteIds] = useLocalStorage<string[]>(
    SPEAKY_FAVORITES_STORAGE_KEY,
    []
  );
  const [languageFilter, setLanguageFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<SpeakyGalleryCategory | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]["key"]>(
    "popular"
  );
  const [nowPlayingId, setNowPlayingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const items = galleryItems
      .filter((item) =>
        languageFilter === "all" ? true : item.language === languageFilter
      )
      .filter((item) =>
        categoryFilter === "all" ? true : item.category === categoryFilter
      );

    return items.sort((left, right) => {
      if (sortBy === "recent") {
        return (
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        );
      }
      if (sortBy === "duration") {
        return right.durationSec - left.durationSec;
      }
      return right.listens + right.favorites - (left.listens + left.favorites);
    });
  }, [categoryFilter, galleryItems, languageFilter, sortBy]);

  const uniqueLanguages = useMemo(
    () => Array.from(new Set(galleryItems.map((item) => item.language))),
    [galleryItems]
  );

  const toggleFavorite = (item: PublicSpeakyCreation) => {
    setFavoriteIds((current) =>
      current.includes(item.id)
        ? current.filter((id) => id !== item.id)
        : [item.id, ...current]
    );
    setGalleryItems((current) =>
      current.map((row) =>
        row.id === item.id
          ? {
              ...row,
              favorites: Math.max(
                0,
                row.favorites + (favoriteIds.includes(item.id) ? -1 : 1)
              ),
            }
          : row
      )
    );
  };

  const createShareLinks = (item: PublicSpeakyCreation) => {
    const link = `${window.location.origin}/speaky/gallery?audio=${item.id}`;
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(link)}`;
    const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `${item.title} ${link}`
    )}`;
    const embed = `<iframe src="${link}" width="360" height="120" frameborder="0"></iframe>`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      link
    )}`;

    return { embed, link, qr, twitter, whatsapp };
  };

  const reportItem = (item: PublicSpeakyCreation) => {
    const reason = window.prompt(
      "Motif du signalement (spam, contenu inapproprié, haine, autre)"
    );
    if (!reason) return;
    toast.success(`Signalement transmis pour \"${item.title}\" (${reason}).`);
  };

  const exportMiniPlayerVideo = async (item: PublicSpeakyCreation) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas indisponible.");
      }

      context.fillStyle = "#0f172a";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#22d3ee";
      context.font = "bold 34px sans-serif";
      context.fillText("Speaky Story", 24, 60);
      context.fillStyle = "#e2e8f0";
      context.font = "24px sans-serif";
      context.fillText(item.title, 24, 130);
      context.fillText(`${item.creatorName} · ${item.language.toUpperCase()}`, 24, 170);

      for (let index = 0; index < 28; index += 1) {
        const x = 24 + index * 20;
        const h = 20 + ((index * 17) % 120);
        context.fillRect(x, 280 - h, 10, h);
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((value) => {
          if (!value) {
            reject(new Error("Export impossible"));
            return;
          }
          resolve(value);
        }, "image/png");
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `speaky-story-${item.id}.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Visuel mini-lecteur exporté (format image pour Story).");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export impossible");
    }
  };

  return (
    <div className="liquid-glass flex h-full flex-col gap-4 overflow-auto p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold">Galerie Speaky</h1>
        <p className="text-sm text-muted-foreground">
          Créations audio publiques de la communauté Speaky.
        </p>
      </header>

      <div className="grid gap-2 md:grid-cols-3">
        <select
          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
          onChange={(event) => setLanguageFilter(event.target.value)}
          value={languageFilter}
        >
          <option value="all">Toutes les langues</option>
          {uniqueLanguages.map((language) => (
            <option key={language} value={language}>
              {language.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
          onChange={(event) =>
            setCategoryFilter(event.target.value as SpeakyGalleryCategory | "all")
          }
          value={categoryFilter}
        >
          <option value="all">Toutes catégories</option>
          {(Object.keys(CATEGORY_LABELS) as SpeakyGalleryCategory[]).map((key) => (
            <option key={key} value={key}>
              {CATEGORY_LABELS[key]}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-border/50 bg-background px-3 py-2 text-sm"
          onChange={(event) =>
            setSortBy(event.target.value as (typeof SORT_OPTIONS)[number]["key"])
          }
          value={sortBy}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              Tri: {option.label}
            </option>
          ))}
        </select>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => {
          const share = createShareLinks(item);
          const isFavorite = favoriteIds.includes(item.id);

          return (
            <article
              className="rounded-2xl border border-border/50 bg-background/40 p-4"
              key={item.id}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="text-[11px] text-muted-foreground">
                    @{item.creatorName} · {item.language.toUpperCase()} · {item.voice}
                  </p>
                </div>
                <button
                  className={`rounded-lg border px-2 py-1 ${isFavorite ? "text-red-500" : ""}`}
                  onClick={() => toggleFavorite(item)}
                  type="button"
                >
                  <Heart className="size-4" />
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground">{item.description}</p>
              <p className="mt-1 text-[11px]">
                {CATEGORY_LABELS[item.category]} · Durée {formatDuration(item.durationSec)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {item.listens.toLocaleString("fr-FR")} écoutes · {item.favorites.toLocaleString("fr-FR")} favoris
              </p>

              <audio
                className="mt-2 w-full"
                controls
                onPlay={() => setNowPlayingId(item.id)}
                src={item.audioUrl}
              />

              <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                <button
                  className="inline-flex items-center justify-center gap-1 rounded border px-2 py-1"
                  onClick={async () => {
                    await navigator.clipboard.writeText(share.link);
                    toast.success("Lien copié.");
                  }}
                  type="button"
                >
                  <Copy className="size-3" /> Lien
                </button>
                <a className="inline-flex items-center justify-center gap-1 rounded border px-2 py-1" href={share.whatsapp} rel="noreferrer" target="_blank">
                  <Share2 className="size-3" /> WhatsApp
                </a>
                <a className="inline-flex items-center justify-center gap-1 rounded border px-2 py-1" href={share.twitter} rel="noreferrer" target="_blank">
                  <ExternalLink className="size-3" /> Twitter
                </a>
                <button
                  className="inline-flex items-center justify-center gap-1 rounded border px-2 py-1"
                  onClick={() => exportMiniPlayerVideo(item)}
                  type="button"
                >
                  <Play className="size-3" /> Story visuelle
                </button>
                <button
                  className="inline-flex items-center justify-center gap-1 rounded border px-2 py-1"
                  onClick={async () => {
                    await navigator.clipboard.writeText(share.embed);
                    toast.success("Code embed copié.");
                  }}
                  type="button"
                >
                  <Copy className="size-3" /> Embed
                </button>
                <button
                  className="inline-flex items-center justify-center gap-1 rounded border px-2 py-1"
                  onClick={() => window.open(share.qr, "_blank")}
                  type="button"
                >
                  <QrCode className="size-3" /> QR
                </button>
                <button
                  className="col-span-2 inline-flex items-center justify-center gap-1 rounded border border-red-300 px-2 py-1 text-red-600"
                  onClick={() => reportItem(item)}
                  type="button"
                >
                  <Flag className="size-3" /> Signaler
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {nowPlayingId ? (
        <p className="text-xs text-muted-foreground">
          En lecture: {galleryItems.find((item) => item.id === nowPlayingId)?.title}
        </p>
      ) : null}
      {filteredItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune création publique pour ces filtres.</p>
      ) : null}
      <div className="rounded-xl border border-border/50 bg-background/40 p-3 text-[11px] text-muted-foreground">
        <p className="font-medium text-foreground">Mes Favoris</p>
        <p>
          {favoriteIds.length} audio(s) favori(s). Ils sont sauvegardés et réutilisables depuis votre profil Speaky.
        </p>
      </div>
    </div>
  );
}
