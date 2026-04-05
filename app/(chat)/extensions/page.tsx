"use client";

import {
  BlocksIcon,
  BotIcon,
  Code2,
  HeartPulse,
  Languages,
  Newspaper,
  Palette,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useWindowSize } from "usehooks-ts";

const EXTENSIONS = [
  {
    href: "/news",
    icon: Newspaper,
    label: "Actualités",
    description:
      "Recherche en temps réel et création de revues d'actualités personnalisées. Ne manquez plus aucune information avec mAI Actualités.",
    badge: "Accès restreint",
    badgeColor: "bg-red-500/90",
  },
  {
    href: "/Health",
    icon: HeartPulse,
    label: "mAIHealth",
    description:
      "Votre assistant médical personnel. Analysez vos symptômes, suivez vos constantes et accédez à des conseils de santé fiables.",
    badge: "Bêta",
    badgeColor: "bg-amber-500/90",
  },
  {
    href: "/studio",
    icon: Sparkles,
    label: "Studio",
    description:
      "Générez des images, des logos et des visuels de haute qualité avec des modèles de pointe. Laissez parler votre créativité.",
  },
  {
    href: "/translation",
    icon: Languages,
    label: "Traduction",
    description:
      "Traduction multilingue intelligente avec conservation du contexte et de la mise en page. Idéal pour les professionnels.",
  },
  {
    href: "/coder",
    icon: Code2,
    label: "Coder",
    description:
      "Assistant de programmation avancé. Générez, débuggez et optimisez votre code dans plus de 20 langages de programmation.",
    badge: "Accès restreint",
    badgeColor: "bg-red-500/90",
  },
  {
    href: "/mais",
    icon: BotIcon,
    label: "Mes mAIs",
    description:
      "Gérez, configurez et personnalisez vos agents intelligents. Adaptez leur comportement à vos besoins spécifiques.",
  },
  {
    href: "/color",
    icon: Palette,
    label: "Color",
    description:
      "Génération de palettes de couleurs harmonieuses et tendances pour vos projets de design. L'inspiration à portée de clic.",
    badge: "Accès Anticipé",
    badgeColor: "bg-blue-500/90",
  },
];

export default function ExtensionsPage() {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  return (
    <div className="flex flex-col h-full overflow-y-auto w-full p-4 md:p-8 pt-8">
      <div className="max-w-5xl mx-auto w-full">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
              <BlocksIcon className="size-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Extensions</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-base mt-2">
            Explorez l'écosystème modulaire de mAI. Accédez à des outils
            spécialisés conçus pour décupler votre productivité et votre
            créativité, sans encombrer votre espace de discussion.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {EXTENSIONS.map((ext) => (
            <Link
              className="group relative flex flex-col p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-md overflow-hidden"
              href={ext.href}
              key={ext.href}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative flex items-start justify-between mb-4">
                <div className="p-3 bg-background rounded-xl border border-border/50 shadow-sm group-hover:scale-110 group-hover:text-primary transition-all duration-300">
                  <ext.icon className="size-6" />
                </div>
                {ext.badge && (
                  <span
                    className={`px-2.5 py-1 text-[10px] font-medium text-white rounded-full ${ext.badgeColor} shadow-sm`}
                  >
                    {ext.badge}
                  </span>
                )}
              </div>

              <div className="relative">
                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                  {ext.label}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 h-[60px]">
                  {ext.description}
                </p>
              </div>

              <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Ouvrir l'extension <span className="ml-1 text-[16px]">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
