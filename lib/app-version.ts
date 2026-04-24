import packageJson from "@/package.json";

/**
 * Source unique de vérité pour le nom/version affichés dans l'app.
 * Changer package.json suffit pour mettre à jour l'UI.
 */
export const APP_NAME = packageJson.name;
export const APP_VERSION = `${packageJson.version} (6)`;
