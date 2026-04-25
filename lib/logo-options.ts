export type AppLogoOption = {
  id: string;
  name: string;
  src: string;
  maxOnly: boolean;
};

export const appLogoOptions: AppLogoOption[] = [
  { id: "logo", name: "Défaut", src: "/images/logo.png", maxOnly: false },
  { id: "logo-noir", name: "Noir", src: "/images/logo-noir.png", maxOnly: false },
  { id: "logo-noir-blanc", name: "Noir & Blanc", src: "/images/logo-noir-blanc.png", maxOnly: false },
  { id: "logo-bleu-blanc", name: "Bleu & Blanc", src: "/images/logo-bleu-blanc.png", maxOnly: true },
  { id: "logo-bleu-noir", name: "Bleu & Noir", src: "/images/logo-bleu-noir.png", maxOnly: true },
  { id: "logo-bleudegrade-blanc", name: "Bleu Dégradé Blanc", src: "/images/logo-bleudégradé-blanc.png", maxOnly: true },
  { id: "logo-bleudegrade-noir", name: "Bleu Dégradé Noir", src: "/images/logo-bleudégradé-noir.png", maxOnly: true },
  { id: "logo-red-blanc", name: "Rouge & Blanc", src: "/images/logo-red-blanc.png", maxOnly: false },
  { id: "logo-red-noir", name: "Rouge & Noir", src: "/images/logo-red-noir.png", maxOnly: false },
  { id: "logo-reddegrade-blanc", name: "Rouge Dégradé Blanc", src: "/images/logo-reddégradé-blanc.png", maxOnly: false },
  { id: "logo-reddegrade-noir", name: "Rouge Dégradé Noir", src: "/images/logo-reddégradé-noir.png", maxOnly: false },
  { id: "logo-vert-blanc", name: "Vert & Blanc", src: "/images/logo-vert-blanc.png", maxOnly: false },
  { id: "logo-vert-noir", name: "Vert & Noir", src: "/images/logo-vert-noir.png", maxOnly: false },
  { id: "logo-violet-blanc", name: "Violet & Blanc", src: "/images/logo-violet-blanc.png", maxOnly: false },
  { id: "logo-violet-noir", name: "Violet & Noir", src: "/images/logo-violet-noir.png", maxOnly: false },
  { id: "logo-platform", name: "Platform", src: "/images/logo-platform.png", maxOnly: false },
  { id: "logo-platform-vertical", name: "Platform Vertical", src: "/images/logo-platform-vertical.PNG", maxOnly: false },
  { id: "logo-landscape", name: "Landscape", src: "/images/logo-landscape.PNG", maxOnly: false },
  { id: "logo-betamodels", name: "Beta Models", src: "/images/logo-betamodels.png", maxOnly: false },
  { id: "logo-transparent", name: "Transparent", src: "/images/logo-transparent-lg26.PNG", maxOnly: false },
  { id: "symbole-etoile", name: "Étoile", src: "/images/Symbole étoile.PNG", maxOnly: false },
  { id: "ai-star-black", name: "Étoile Noire", src: "/images/ai-star-black.png", maxOnly: false },
];
