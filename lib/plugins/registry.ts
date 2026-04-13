export type PluginCategory =
  | "automation"
  | "canvas"
  | "content"
  | "export"
  | "media";

export type MaiPlugin = {
  command: `@${string}`;
  description: string;
  id: string;
  name: string;
  targetTool: "audioAssistant" | "textUtilities";
  category: PluginCategory;
  enabledByDefault?: boolean;
  isNew?: boolean;
};

export const pluginRegistry: MaiPlugin[] = [
  {
    id: "audio-generator",
    command: "@audio",
    name: "Audio Assistant",
    description: "Prépare un pack voix pour Speaky (voix, style, script).",
    targetTool: "audioAssistant",
    category: "media",
    enabledByDefault: true,
  },
  {
    id: "text-tools",
    command: "@utils",
    name: "Text Utilities",
    description:
      "Lance des utilitaires texte: résumé, mots-clés, slug, mot de passe.",
    targetTool: "textUtilities",
    category: "content",
    enabledByDefault: true,
  },
  {
    id: "tone-rewriter",
    command: "@rewrite",
    name: "Tone Rewriter",
    description:
      "Utilise l'outil texte pour reformuler rapidement selon le ton voulu.",
    targetTool: "textUtilities",
    category: "content",
  },
  {
    id: "password-safe",
    command: "@password",
    name: "Password Safe",
    description:
      "Génère des mots de passe robustes via l'outil utilitaire texte.",
    targetTool: "textUtilities",
    category: "automation",
  },
  {
    id: "advanced-doc-generation",
    command: "@docgen",
    name: "Doc Gen Avancé",
    description:
      "Structure, enrichit et prépare des documents exportables multi-formats.",
    targetTool: "textUtilities",
    category: "content",
    isNew: true,
  },
  {
    id: "interactive-canvas",
    command: "@canvas",
    name: "Canvas Interactif",
    description:
      "Optimise la mise en blocs et les sections pour l'édition type canevas.",
    targetTool: "textUtilities",
    category: "canvas",
    isNew: true,
  },
  {
    id: "multi-export",
    command: "@export",
    name: "Export Multi-format",
    description: "Prépare un contenu prêt pour PDF, DOC, PPTX et XLSX.",
    targetTool: "textUtilities",
    category: "export",
    isNew: true,
  },
  {
    id: "ai-content-optimizer",
    command: "@optimize",
    name: "Optimiseur IA",
    description:
      "Améliore lisibilité, concision et cohérence avant export final.",
    targetTool: "textUtilities",
    category: "content",
    isNew: true,
  },
  {
    id: "productivity-boost",
    command: "@productivity",
    name: "Productivité+",
    description:
      "Active des raccourcis avancés pour reformulation, actions et suivi rapide.",
    targetTool: "textUtilities",
    category: "automation",
    enabledByDefault: true,
    isNew: true,
  },
  {
    id: "smart-search-pro",
    command: "@smartsearch",
    name: "Recherche intelligente",
    description:
      "Optimise la recherche contextuelle pour trouver plus vite les informations clés.",
    targetTool: "textUtilities",
    category: "content",
    isNew: true,
  },
  {
    id: "auto-summary-plus",
    command: "@autosummary",
    name: "Résumé automatique+",
    description:
      "Produit des résumés structurés avec points clés, décisions et actions.",
    targetTool: "textUtilities",
    category: "content",
    isNew: true,
  },
  {
    id: "text-cleanup-rewriter",
    command: "@cleanup",
    name: "Nettoyage & reformulation",
    description:
      "Corrige, nettoie et reformule le texte pour un rendu pro et cohérent.",
    targetTool: "textUtilities",
    category: "content",
    isNew: true,
  },
  {
    id: "quick-ai-actions",
    command: "@quickactions",
    name: "Outils rapides IA",
    description:
      "Déclenche des actions contextuelles rapides depuis le menu et les commandes.",
    targetTool: "textUtilities",
    category: "automation",
    isNew: true,
  },
];
