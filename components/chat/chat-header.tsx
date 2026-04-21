"use client";

import { PanelLeftIcon } from "lucide-react";
import Image from "next/image";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  currentModelId: _currentModelId,
  onModelChange: _onModelChange,
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

  return (
    <>
      <Button
        className="fixed top-3 left-3 z-50 border border-border/60 bg-background/75 shadow-sm backdrop-blur md:top-4 md:left-4"
        onClick={toggleSidebar}
        size="icon-sm"
        variant="ghost"
      >
        <PanelLeftIcon className="size-4" />
      </Button>
      <header className="liquid-glass sticky top-0 z-20 mx-2 mt-2 flex h-14 items-center gap-2 rounded-2xl px-3 md:mx-3">
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

        <span className="ml-auto rounded-full border border-emerald-400/60 bg-emerald-200/60 px-2 py-0.5 font-medium text-[10px] text-emerald-700 dark:border-emerald-300/40 dark:bg-emerald-500/20 dark:text-emerald-200">
          Release Candidate
        </span>
      </header>
    </>
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
