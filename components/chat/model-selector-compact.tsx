"use client";
import {
  BotIcon,
  BrainIcon,
  EyeIcon,
  LockIcon,
  WrenchIcon,
} from "lucide-react";
import { memo, useState } from "react";
import useSWR from "swr";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import {
  type ChatModel,
  chatModels,
  DEFAULT_CHAT_MODEL,
  type ModelCapabilities,
} from "@/lib/ai/models";
import { cn } from "@/lib/utils";

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
}

function getModelLogoProvider(
  model: Pick<ChatModel, "id" | "name" | "provider">
) {
  const id = model.id.toLowerCase();
  const name = model.name.toLowerCase();

  if (id.includes("deepseek") || name.includes("deepseek")) {
    return "deepseek";
  }
  if (id.includes("openai/") || id.includes("/gpt") || name.includes("gpt")) {
    return "openai";
  }
  if (
    id.includes("anthropic/") ||
    id.includes("/claude") ||
    name.includes("claude")
  ) {
    return "anthropic";
  }
  if (
    id.includes("google/") ||
    id.includes("/gemini") ||
    name.includes("gemini")
  ) {
    return "google";
  }
  if (
    id.includes("mistral/") ||
    id.includes("/mistral") ||
    name.includes("mistral")
  ) {
    return "mistral";
  }
  if (id.includes("x-ai/") || id.includes("/grok") || name.includes("grok")) {
    return "xai";
  }
  if (
    id.includes("cohere/") ||
    id.includes("/command") ||
    name.includes("command")
  ) {
    return "cohere";
  }
  if (name.includes("llama")) {
    return "meta";
  }
  return "custom";
}

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: modelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 }
  );

  const capabilities: Record<string, ModelCapabilities> | undefined =
    modelsData?.capabilities ?? modelsData;
  const dynamicModels: ChatModel[] | undefined = modelsData?.models;
  const activeModels = dynamicModels ?? chatModels;

  const selectedModel =
    activeModels.find((m: ChatModel) => m.id === selectedModelId) ??
    activeModels.find((m: ChatModel) => m.id === DEFAULT_CHAT_MODEL) ??
    activeModels[0] ??
    chatModels[0];

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild>
        <Button
          className="h-7 max-w-[200px] justify-between gap-1.5 rounded-lg px-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          data-testid="model-selector"
          variant="ghost"
        >
          <ModelSelectorLogo provider={getModelLogoProvider(selectedModel)} />
          <ModelSelectorName>{selectedModel.name}</ModelSelectorName>
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorInput placeholder="Rechercher un modèle..." />
        <ModelSelectorList>
          {(() => {
            const curatedIds = new Set(chatModels.map((m) => m.id));
            const allModels = dynamicModels
              ? [
                  ...chatModels,
                  ...dynamicModels.filter((m) => !curatedIds.has(m.id)),
                ]
              : chatModels;

            const grouped: Record<
              string,
              { model: ChatModel; curated: boolean }[]
            > = {};
            for (const model of allModels) {
              const key = curatedIds.has(model.id)
                ? "_curated"
                : model.provider;
              if (!grouped[key]) {
                grouped[key] = [];
              }
              grouped[key].push({ model, curated: curatedIds.has(model.id) });
            }

            const customAgents = modelsData?.customAgents || [];

            const sortedKeys = Object.keys(grouped).sort((a, b) => {
              if (a === "_curated") {
                return -1;
              }
              if (b === "_curated") {
                return 1;
              }
              return a.localeCompare(b);
            });

            const providerNames: Record<string, string> = {
              alibaba: "Alibaba",
              anthropic: "Anthropic",
              "arcee-ai": "Arcee AI",
              bytedance: "ByteDance",
              cohere: "Cohere",
              deepseek: "DeepSeek",
              google: "Google",
              inception: "Inception",
              kwaipilot: "Kwaipilot",
              meituan: "Meituan",
              meta: "Meta",
              minimax: "MiniMax",
              mistral: "Mistral",
              moonshotai: "Moonshot",
              morph: "Morph",
              nvidia: "Nvidia",
              openai: "OpenAI",
              perplexity: "Perplexity",
              "prime-intellect": "Prime Intellect",
              xiaomi: "Xiaomi",
              xai: "xAI",
              zai: "Zai",
            };

            return (
              <>
                {customAgents.length > 0 && (
                  <ModelSelectorGroup heading="Mes mAIs">
                    {customAgents.map((agent: any) => (
                      <ModelSelectorItem
                        className={cn(
                          "flex w-full",
                          selectedModelId === `agent-${agent.id}` &&
                            "bg-muted/50"
                        )}
                        key={`agent-${agent.id}`}
                        onSelect={() => {
                          onModelChange?.(`agent-${agent.id}`);
                          setCookie("chat-model", `agent-${agent.id}`);
                          setOpen(false);
                          setTimeout(() => {
                            document
                              .querySelector<HTMLTextAreaElement>(
                                "[data-testid='multimodal-input']"
                              )
                              ?.focus();
                          }, 50);
                        }}
                        value={`agent-${agent.id}`}
                      >
                        {agent.image ? (
                          <div
                            className="mr-1 h-4 w-4 rounded-sm bg-cover bg-center"
                            style={{ backgroundImage: `url(${agent.image})` }}
                          />
                        ) : (
                          <BotIcon className="w-4 h-4 mr-1 text-primary" />
                        )}
                        <ModelSelectorName>{agent.name}</ModelSelectorName>
                      </ModelSelectorItem>
                    ))}
                  </ModelSelectorGroup>
                )}
                {sortedKeys.map((key) => (
                  <ModelSelectorGroup
                    heading={
                      key === "_curated"
                        ? undefined
                        : (providerNames[key] ?? key)
                    }
                    key={key}
                  >
                    {grouped[key].map(({ model, curated }) => {
                      const logoProvider = getModelLogoProvider(model);
                      return (
                        <ModelSelectorItem
                          className={cn(
                            "flex w-full",
                            model.id === selectedModel.id && "bg-muted/50",
                            !curated && "opacity-40 cursor-default"
                          )}
                          key={model.id}
                          onSelect={() => {
                            if (!curated) {
                              return;
                            }
                            onModelChange?.(model.id);
                            setCookie("chat-model", model.id);
                            setOpen(false);
                            setTimeout(() => {
                              document
                                .querySelector<HTMLTextAreaElement>(
                                  "[data-testid='multimodal-input']"
                                )
                                ?.focus();
                            }, 50);
                          }}
                          value={model.id}
                        >
                          <ModelSelectorLogo provider={logoProvider} />
                          <ModelSelectorName>{model.name}</ModelSelectorName>
                          <div className="ml-auto flex items-center gap-2 text-foreground/70">
                            {capabilities?.[model.id]?.tools && (
                              <WrenchIcon className="size-3.5" />
                            )}
                            {capabilities?.[model.id]?.vision && (
                              <EyeIcon className="size-3.5" />
                            )}
                            {capabilities?.[model.id]?.reasoning && (
                              <BrainIcon className="size-3.5" />
                            )}
                            {!curated && (
                              <LockIcon className="size-3 text-muted-foreground/50" />
                            )}
                          </div>
                        </ModelSelectorItem>
                      );
                    })}
                  </ModelSelectorGroup>
                ))}
              </>
            );
          })()}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

export { ModelSelectorCompact };
