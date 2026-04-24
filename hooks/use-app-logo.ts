import { useLocalStorage } from "usehooks-ts";

export const APP_LOGO_STORAGE_KEY = "mai.app.logo.v1";
export const DEFAULT_APP_LOGO = "/images/logo.png";

export const availableLogos = [
  "logo.png",
  "logo-noir.png",
  "logo-noir-blanc.png",
  "logo-vert-blanc.png",
  "logo-vert-noir.png",
  "logo-violet-blanc.png",
  "logo-violet-noir.png",
  "logo-red-blanc.png",
  "logo-red-noir.png",
  "logo-reddégradé-blanc.png",
  "logo-reddégradé-noir.png",
  "ai-star-black.png",
];

export const maxPlanLogos = [
  "logo-bleu-blanc.png",
  "logo-bleu-noir.png",
  "logo-bleudégradé-blanc.png",
  "logo-bleudégradé-noir.png",
];

export function useAppLogo() {
  const [appLogo, setAppLogo] = useLocalStorage<string>(
    APP_LOGO_STORAGE_KEY,
    DEFAULT_APP_LOGO
  );
  return { appLogo, setAppLogo };
}
