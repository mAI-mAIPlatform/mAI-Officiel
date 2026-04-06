import type { LucideIcon } from "lucide-react";
import {
  BrainCircuit,
  Code2,
  FileSearch,
  Globe,
  HeartPulse,
  GraduationCap,
  LibraryBig,
  Newspaper,
  PenLine,
  Salad,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";

export type StoreExtension = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
  premium?: boolean;
  beta?: boolean;
  featured?: boolean;
};

/**
 * Catalogue unique du Store : centralise toutes les mini-apps accessibles
 * depuis la sidebar (hors Projets et Mes mAIs, gardés en accès direct).
 */
export const extensionCatalog: StoreExtension[] = [
  {
    id: "manalyse",
    title: "mAnalyse",
    description:
      "Analyse URL, PDF, DOCX, TXT et image avec extraction multi-source puis rapport structuré prêt à partager.",
    icon: FileSearch,
    route: "/extensions/manalyse",
    featured: true,
  },
  {
    id: "ecri20",
    title: "Ecri20",
    description:
      "Rédaction augmentée avec ton, format intelligent et export instantané TXT, JSON, DOCX et PDF.",
    icon: PenLine,
    route: "/extensions/ecri20",
    featured: true,
  },
  {
    id: "brainstorming",
    title: "Brainstorming",
    description:
      "Partenaire de réflexion en mode Socrate avec relances guidées, plans clairs et options actionnables.",
    icon: BrainCircuit,
    route: "/extensions/brainstorming",
    featured: true,
  },
  {
    id: "authentic",
    title: "Authentic",
    description:
      "Détectez le contenu IA et analysez la fiabilité globale de vos textes rapidement.",
    icon: ShieldCheck,
    route: "/authentic",
    premium: true,
  },
  {
    id: "coder",
    title: "Coder",
    description:
      "Mini-IDE assisté pour planifier, générer et itérer sur votre code avec l'IA.",
    icon: Code2,
    route: "/coder",
    premium: true,
    beta: true,
  },
  {
    id: "news",
    title: "Actualités",
    description:
      "Veille intelligente avec synthèse rapide et suivi des sujets stratégiques en temps réel.",
    icon: Newspaper,
    route: "/news",
    premium: true,
    beta: true,
  },
  {
    id: "translation",
    title: "Traduction",
    description:
      "Traduction multilingue contextuelle avec reformulation adaptée à votre audience.",
    icon: Globe,
    route: "/translation",
  },
  {
    id: "health",
    title: "mAIHealth",
    description:
      "Pré-analyse de documents santé avec alertes de prudence et points de vigilance.",
    icon: HeartPulse,
    route: "/Health",
    beta: true,
  },
  {
    id: "meals",
    title: "mAIRepas",
    description:
      "Planifiez vos repas avec des idées adaptées à vos objectifs et vos contraintes alimentaires.",
    icon: Salad,
    route: "/meals",
    beta: true,
  },
  {
    id: "learnup",
    title: "LearnUp",
    description:
      "Révision intelligente: quiz IA, exercices ciblés, fiches de révision et cours structurés en quelques secondes.",
    icon: GraduationCap,
    route: "/extensions/learnup",
    featured: true,
  },
  {
    id: "shopper",
    title: "Shopper",
    description:
      "Assistant shopping IA avec recherche multi-plateformes, preuves visuelles et optimisation du budget selon vos critères.",
    icon: ShoppingBag,
    route: "/extensions/shopper",
    featured: true,
  },
  {
    id: "studio",
    title: "Studio",
    description:
      "Générez et itérez vos visuels dans un espace créatif optimisé et moderne.",
    icon: Sparkles,
    route: "/studio",
    premium: true,
  },
  {
    id: "library",
    title: "Bibliothèque",
    description:
      "Centralisez, organisez et prévisualisez vos assets et fichiers de travail.",
    icon: LibraryBig,
    route: "/library",
  },
  {
    id: "store",
    title: "Store mAI",
    description:
      "Centre de découverte et gestion de vos extensions disponibles en un seul endroit.",
    icon: Store,
    route: "/extensions",
  },
];
