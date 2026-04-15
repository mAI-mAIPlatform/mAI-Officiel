export type ExtensionModelOption = {
  id: string;
  label: string;
  monthlyCostProfile: "très-faible" | "faible";
  strengths: string;
};

/**
 * Modèles orientés coût faible + polyvalence pour les extensions grand public.
 */
export const extensionAiModelOptions: ExtensionModelOption[] = [
  {
    id: "openai/gpt-5.4",
    label: "GPT-5.4",
    monthlyCostProfile: "faible",
    strengths: "Modèle par défaut, robuste pour assistants et workflows.",
  },
  {
    id: "openai/gpt-5.4-mini",
    label: "GPT-5.4 Mini",
    monthlyCostProfile: "très-faible",
    strengths: "Rapide, économique, idéal pour assistants quotidiens.",
  },
  {
    id: "openai/gpt-5.4-nano",
    label: "GPT-5.4 Nano",
    monthlyCostProfile: "très-faible",
    strengths: "Version nano à très faible coût pour actions fréquentes.",
  },
  {
    id: "openai/gpt-5.2",
    label: "GPT-5.2",
    monthlyCostProfile: "faible",
    strengths: "Très bon équilibre pour rédaction, analyse et raisonnement.",
  },
  {
    id: "azure/deepseek-v3.2",
    label: "DeepSeek-V3.2",
    monthlyCostProfile: "très-faible",
    strengths: "Fort rapport qualité/prix pour tâches variées et code.",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS-120b",
    monthlyCostProfile: "faible",
    strengths: "Open-source haut niveau pour assistants et automatisations.",
  },
] as const;

export type ExtensionAiModel = (typeof extensionAiModelOptions)[number]["id"];

export const extensionAiModels: ExtensionAiModel[] =
  extensionAiModelOptions.map((option) => option.id);

export const defaultExtensionAiModel: ExtensionAiModel = "openai/gpt-5.4";

export function buildAiCopilotNote(
  model: ExtensionAiModel,
  scope: string,
  context: string
): string {
  const safeContext = context.trim() || "contexte par défaut";

  return `[${model}] Suggestion ${scope} : priorisez un résultat mesurable, expliquez les hypothèses et validez avec le contexte « ${safeContext} ».`;
}
