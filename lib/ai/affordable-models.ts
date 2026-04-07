export type AffordableModelOption = {
  id: string;
  label: string;
};

export const affordableTextModels: AffordableModelOption[] = [
  { id: "gpt-5.4-nano", label: "GPT-5.4 Nano (CometAPI)" },
  { id: "gpt-5.4-mini", label: "GPT-5.4 Mini (CometAPI)" },
  {
    id: "huggingface/Qwen/Qwen2.5-7B-Instruct",
    label: "Qwen 2.5 7B Instruct (Hugging Face)",
  },
  {
    id: "huggingface/meta-llama/Llama-3.1-8B-Instruct",
    label: "Llama 3.1 8B Instruct (Hugging Face)",
  },
  {
    id: "huggingface/microsoft/Phi-3.5-mini-instruct",
    label: "Phi-3.5 Mini Instruct (Hugging Face)",
  },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  {
    id: "gemini-3.1-flash-lite-preview",
    label: "Gemini 3.1 Flash Lite Preview",
  },
  { id: "gemini-3-pro-preview", label: "Gemini 3 Pro Preview" },
  { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview" },
];

export const affordableImageModels: AffordableModelOption[] = [
  { id: "flux-2-max", label: "Flux 2 Max" },
  { id: "kling-image", label: "Kling Image" },
  { id: "flux-2-pro", label: "Flux 2 Pro" },
  { id: "flux-2-flex", label: "Flux 2 Flex" },
];
