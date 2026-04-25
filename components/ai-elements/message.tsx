"use client";

import type { UIMessage } from "ai";
import type { ComponentProps, HTMLAttributes, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  PencilIcon,
  RefreshCwIcon,
} from "lucide-react";
import {
  createContext,
  type MouseEvent,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Streamdown } from "streamdown";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "flex min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageActionsProps = ComponentProps<"div">;

export const MessageActions = ({
  className,
  children,
  ...props
}: MessageActionsProps) => (
  <div className={cn("flex items-center gap-1", className)} {...props}>
    {children}
  </div>
);

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} type="button" variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};

interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(
  null
);

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext);

  if (!context) {
    throw new Error(
      "MessageBranch components must be used within MessageBranch"
    );
  }

  return context;
};

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch);
  const [branches, setBranches] = useState<ReactElement[]>([]);

  const handleBranchChange = useCallback(
    (newBranch: number) => {
      setCurrentBranch(newBranch);
      onBranchChange?.(newBranch);
    },
    [onBranchChange]
  );

  const goToPrevious = useCallback(() => {
    const newBranch =
      currentBranch > 0 ? currentBranch - 1 : branches.length - 1;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const goToNext = useCallback(() => {
    const newBranch =
      currentBranch < branches.length - 1 ? currentBranch + 1 : 0;
    handleBranchChange(newBranch);
  }, [currentBranch, branches.length, handleBranchChange]);

  const contextValue = useMemo<MessageBranchContextType>(
    () => ({
      branches,
      currentBranch,
      goToNext,
      goToPrevious,
      setBranches,
      totalBranches: branches.length,
    }),
    [branches, currentBranch, goToNext, goToPrevious]
  );

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div
        className={cn("grid w-full gap-2 [&>div]:pb-0", className)}
        {...props}
      />
    </MessageBranchContext.Provider>
  );
};

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageBranchContent = ({
  children,
  ...props
}: MessageBranchContentProps) => {
  const { currentBranch, setBranches, branches } = useMessageBranch();
  const childrenArray = useMemo(
    () => (Array.isArray(children) ? children : [children]),
    [children]
  );

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray);
    }
  }, [childrenArray, branches, setBranches]);

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        "grid gap-2 overflow-hidden [&>div]:pb-0",
        index === currentBranch ? "block" : "hidden"
      )}
      key={branch.key}
      {...props}
    >
      {branch}
    </div>
  ));
};

export type MessageBranchSelectorProps = ComponentProps<typeof ButtonGroup>;

export const MessageBranchSelector = ({
  className,
  ...props
}: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch();

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null;
  }

  return (
    <ButtonGroup
      className={cn(
        "[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md",
        className
      )}
      orientation="horizontal"
      {...props}
    />
  );
};

export type MessageBranchPreviousProps = ComponentProps<typeof Button>;

export const MessageBranchPrevious = ({
  children,
  ...props
}: MessageBranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  );
};

export type MessageBranchNextProps = ComponentProps<typeof Button>;

export const MessageBranchNext = ({
  children,
  ...props
}: MessageBranchNextProps) => {
  const { goToNext, totalBranches } = useMessageBranch();

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      type="button"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  );
};

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;

export const MessageBranchPage = ({
  className,
  ...props
}: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch();

  return (
    <ButtonGroupText
      className={cn(
        "border-none bg-transparent text-muted-foreground shadow-none",
        className
      )}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  );
};

export type MessageResponseProps = ComponentProps<typeof Streamdown>;

const streamdownPlugins = { cjk, code, math, mermaid };
const streamdownControls = {
  code: true,
  table: true,
  mermaid: {
    copy: true,
    download: true,
    fullscreen: true,
    panZoom: true,
  },
} as const;

const detectLanguageFromSnippet = (snippet: string) => {
  const source = snippet.toLowerCase();

  if (source.includes("def ") || source.includes("import ") || source.includes("print(")) return "python";
  if (source.includes("interface ") || source.includes("const ") || source.includes("=>")) return "typescript";
  if (source.includes("#include") || source.includes("std::")) return "cpp";
  if (source.includes("select ") || source.includes("from ")) return "sql";
  if (source.includes("<html") || source.includes("<div")) return "html";

  return "text";
};

const enrichMarkdownFences = (content?: string) => {
  if (!content) return content;

  return content.replace(/```([\t ]*)\n([\s\S]*?)```/g, (_match, spaces, codeSnippet) => {
    const inferredLanguage = detectLanguageFromSnippet(codeSnippet);
    return `\`\`\`${spaces}${inferredLanguage}\n${codeSnippet}\`\`\``;
  });
};

const CodeOrTableToolbar = ({
  targetType,
  onCopy,
  onDownload,
  onEdit,
  onRedo,
}: {
  targetType: "code" | "table";
  onCopy: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onRedo: () => void;
}) => (
  <div className="liquid-panel pointer-events-none absolute top-2 right-2 z-10 flex gap-1 rounded-lg border border-white/30 bg-white/70 p-1 opacity-0 backdrop-blur-xl transition group-hover:pointer-events-auto group-hover:opacity-100 dark:border-white/10 dark:bg-black/35">
    <button className="toolbar-btn" onClick={onEdit} type="button">
      <PencilIcon size={12} /> Modifier
    </button>
    <button className="toolbar-btn" onClick={onRedo} type="button">
      <RefreshCwIcon size={12} /> Refaire
    </button>
    <button className="toolbar-btn" onClick={onDownload} type="button">
      <DownloadIcon size={12} /> Télécharger
    </button>
    <button className="toolbar-btn" onClick={onCopy} type="button">
      <CopyIcon size={12} /> Copier
    </button>
    <span className="sr-only">{`Actions ${targetType}`}</span>
  </div>
);

const RenderWithToolbar = ({
  tag,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLPreElement | HTMLTableElement> & {
  tag: "pre" | "table";
}) => {
  const handleEvent = useCallback(
    (eventName: string) => {
      if (typeof window === "undefined") return;
      window.dispatchEvent(new CustomEvent(eventName, { detail: { target: tag } }));
    },
    [tag]
  );

  const handleCopy = useCallback(async () => {
    if (typeof window === "undefined") return;
    const textContent = (props as { children?: unknown }).children?.toString() ?? "";
    await navigator.clipboard.writeText(textContent);
    handleEvent("mai.block.copy");
  }, [handleEvent, props]);

  const handleDownload = useCallback(() => {
    if (typeof window === "undefined") return;
    const blob = new Blob([(props as { children?: unknown }).children?.toString() ?? ""], {
      type: "text/plain;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = tag === "pre" ? "code.txt" : "table.md";
    link.click();
    URL.revokeObjectURL(link.href);
    handleEvent("mai.block.download");
  }, [handleEvent, props, tag]);

  const handleWrapperClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const Element = tag;

  return (
    <div className="group relative my-2" onClick={handleWrapperClick}>
      <CodeOrTableToolbar
        onCopy={handleCopy}
        onDownload={handleDownload}
        onEdit={() => handleEvent("mai.block.edit")}
        onRedo={() => handleEvent("mai.block.redo")}
        targetType={tag === "pre" ? "code" : "table"}
      />
      <Element className={className} {...props}>
        {children}
      </Element>
    </div>
  );
};


const INLINE_SUGGESTION_PREFIX = "mai-suggest:";

const decodeSuggestionPrompt = (href: string) => {
  const encoded = href.slice(INLINE_SUGGESTION_PREFIX.length);
  try {
    return decodeURIComponent(encoded).trim();
  } catch {
    return encoded.trim();
  }
};

export const MessageResponse = memo(
  ({ className, children, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      components={{
        a: ({ href = "", children: linkChildren, title }) => {
          const isInlineSuggestion = href.startsWith(INLINE_SUGGESTION_PREFIX);

          if (!isInlineSuggestion) {
            return (
              <a
                className="underline decoration-border/70 underline-offset-4 transition-colors hover:text-foreground"
                href={href}
                rel="noreferrer"
                target="_blank"
                title={title}
              >
                {linkChildren}
              </a>
            );
          }

          return (
            <button
              aria-label="Envoyer cette suggestion"
              className="mx-1 inline-flex cursor-pointer items-center rounded-full border border-primary/25 bg-primary/8 px-2.5 py-1 text-xs font-medium text-foreground no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              onClick={() => {
                if (typeof window === "undefined") return;
                const prompt = decodeSuggestionPrompt(href);
                if (!prompt) return;
                window.dispatchEvent(
                  new CustomEvent("mai.inline-suggestion", { detail: { prompt } })
                );
              }}
              title={title}
              type="button"
            >
              {linkChildren}
            </button>
          );
        },
        pre: ({ children: preChildren, ...preProps }) => (
          <RenderWithToolbar tag="pre" {...preProps}>
            {preChildren}
          </RenderWithToolbar>
        ),
        table: ({ children: tableChildren, ...tableProps }) => (
          <RenderWithToolbar tag="table" {...tableProps}>
            {tableChildren}
          </RenderWithToolbar>
        ),
      }}
      controls={streamdownControls}
      plugins={streamdownPlugins}
      {...props}
    >
      {enrichMarkdownFences(children?.toString())}
    </Streamdown>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

MessageResponse.displayName = "MessageResponse";

export type MessageToolbarProps = ComponentProps<"div">;

export const MessageToolbar = ({
  className,
  children,
  ...props
}: MessageToolbarProps) => (
  <div
    className={cn(
      "mt-4 flex w-full items-center justify-between gap-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
