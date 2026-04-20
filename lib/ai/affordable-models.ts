export type AffordableModelOption = {
  id: string;
  label: string;
};

export const affordableTextModels: AffordableModelOption[] = [
  { id: "openai/gpt-5.4", label: "GPT-5.4 (FranceStudent)" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini (FranceStudent)" },
  { id: "openai/gpt-5.4-nano", label: "GPT-5.4 Nano (FranceStudent)" },
  { id: "openai/gpt-5.2", label: "GPT-5.2 (FranceStudent)" },
  { id: "openai/gpt-5.1", label: "GPT-5.1 (FranceStudent)" },
  { id: "openai/gpt-5", label: "GPT-5 (FranceStudent)" },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS-120b (FranceStudent)" },
  { id: "azure/deepseek-v3.2", label: "DeepSeek-V3.2 (FranceStudent)" },
  { id: "azure/kimi-k2.5", label: "Kimi-K2.5 (FranceStudent)" },
  { id: "azure/mistral-large-3", label: "Mistral-Large-3 (FranceStudent)" },
];

export const affordableImageModels: AffordableModelOption[] = [];
