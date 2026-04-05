"use client";

import { PanelLeftIcon } from "lucide-react";
import Image from "next/image";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { chatModels } from "@/lib/ai/models";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  currentModelId,
  onModelChange,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  currentModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const { state, toggleSidebar, isMobile } = useSidebar();

  if (state === "collapsed" && !isMobile) {
    return null;
  }

  const quickModelFamilies = [
    { label: "GPT", matcher: ["gpt", "openai"] },
    { label: "Claude", matcher: ["claude", "anthropic"] },
    { label: "Gemini", matcher: ["gemini", "google"] },
  ] as const;

  const activeFamily =
    quickModelFamilies.find((family) =>
      family.matcher.some((keyword) =>
        currentModelId.toLowerCase().includes(keyword)
      )
    )?.label ?? "GPT";

  return (
    <header className="liquid-glass sticky top-0 flex h-14 items-center gap-2 px-3">
      <Button
        className="md:hidden"
        onClick={toggleSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <PanelLeftIcon className="size-4" />
      </Button>

      <div className="ml-1 flex items-center gap-2">
        <Image
          alt="Logo mAI"
          className="size-5"
          height={20}
          src="/mai-logo.svg"
          width={20}
        />
        <span className="font-semibold text-sm">mAI</span>
      </div>

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      {!isReadonly && (
        <label className="ml-1 hidden items-center gap-1 rounded-full border border-border/50 bg-background/65 px-2 py-1 text-[11px] text-muted-foreground md:flex">
          <span>Moteur</span>
          <select
            className="rounded-full bg-transparent text-foreground outline-none"
            onChange={(event) => {
              const selectedFamily = event.target.value;
              const matchingModel = chatModels.find((model) => {
                const normalized =
                  `${model.id} ${model.name} ${model.provider}`.toLowerCase();
                if (selectedFamily === "GPT") {
                  return (
                    normalized.includes("gpt") || normalized.includes("openai")
                  );
                }
                if (selectedFamily === "Claude") {
                  return (
                    normalized.includes("claude") ||
                    normalized.includes("anthropic")
                  );
                }
                return (
                  normalized.includes("gemini") || normalized.includes("google")
                );
              });

              if (matchingModel) {
                onModelChange?.(matchingModel.id);
              }
            }}
            value={activeFamily}
          >
            {quickModelFamilies.map((family) => (
              <option key={family.label} value={family.label}>
                {family.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <span className="ml-auto rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 font-medium text-[10px] text-blue-600 dark:text-blue-300">
        Bêta
      </span>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    prevProps.currentModelId === nextProps.currentModelId
  );
});
