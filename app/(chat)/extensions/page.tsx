"use client";

import { ArrowUpRight, PuzzleIcon, Star } from "lucide-react";
import { useRouter } from "next/navigation";

const extensionCatalog = [
  {
    id: "news",
    title: "Actualités",
    description:
      "Veille intelligente, synthèse rapide et export de rapports en un clic pour vos sujets prioritaires.",
    icon: "🗞️",
    route: "/news",
    premium: true,
  },
  {
    id: "coder",
    title: "Coder",
    description:
      "Mini-IDE avec workflow de planification, édition de fichiers et génération assistée côté mAI.",
    icon: "💻",
    route: "/coder",
    premium: true,
  },
  {
    id: "health",
    title: "Health",
    description:
      "Pré-analyse clinique, détection de signaux et rappel sécurité pour vos documents médicaux.",
    icon: "🩺",
    route: "/Health",
    premium: false,
  },
  {
    id: "studio",
    title: "Studio",
    description:
      "Générez et itérez vos visuels avec styles prédéfinis dans un espace créatif optimisé.",
    icon: "🎨",
    route: "/studio",
    premium: true,
  },
  {
    id: "library",
    title: "Bibliothèque",
    description:
      "Gérez vos fichiers, apercevez vos assets instantanément et centralisez vos imports cloud.",
    icon: "📚",
    route: "/library",
    premium: false,
  },
  {
    id: "translation",
    title: "Traduction",
    description:
      "Traduction multilingue, reformulation contextuelle et export rapide pour vos contenus.",
    icon: "🌐",
    route: "/translation",
    premium: false,
  },
];

export default function ExtensionsPage() {
  const router = useRouter();

  return (
    <div className="liquid-glass flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <header className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <PuzzleIcon className="size-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Mini-Store : Extensions</h1>
            <p className="text-sm text-muted-foreground">
              Catalogue mAI avec ouverture immédiate des mini-apps.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {extensionCatalog.map((extension) => (
          <button
            className="liquid-glass group rounded-2xl border border-border/50 bg-background/60 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
            key={extension.id}
            onClick={() => router.push(extension.route)}
            type="button"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xl font-semibold">
                <span>{extension.icon}</span>
                <h2 className="font-bold text-lg">{extension.title}</h2>
              </div>
              {extension.premium ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  <Star className="size-3" /> Premium
                </span>
              ) : (
                <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                  Standard
                </span>
              )}
            </div>
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {extension.description}
            </p>
            <p className="mt-4 inline-flex items-center gap-1 text-xs text-primary">
              Ouvrir l&apos;extension
              <ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </p>
          </button>
        ))}
      </section>
    </div>
  );
}
