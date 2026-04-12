export type MaiPlugin = {
  command: `@${string}`;
  description: string;
  id: string;
  name: string;
  targetTool: "audioAssistant" | "textUtilities";
};

export const pluginRegistry: MaiPlugin[] = [
  {
    id: "audio-generator",
    command: "@audio",
    name: "Audio Assistant",
    description: "Prépare un pack voix pour Speaky (voix, style, script).",
    targetTool: "audioAssistant",
  },
  {
    id: "text-tools",
    command: "@utils",
    name: "Text Utilities",
    description:
      "Lance des utilitaires texte: résumé, mots-clés, slug, mot de passe.",
    targetTool: "textUtilities",
  },
  {
    id: "tone-rewriter",
    command: "@rewrite",
    name: "Tone Rewriter",
    description:
      "Utilise l'outil texte pour reformuler rapidement selon le ton voulu.",
    targetTool: "textUtilities",
  },
  {
    id: "password-safe",
    command: "@password",
    name: "Password Safe",
    description:
      "Génère des mots de passe robustes via l'outil utilitaire texte.",
    targetTool: "textUtilities",
  },
];
