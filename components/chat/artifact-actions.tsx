import { memo, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { artifactDefinitions, type UIArtifact } from "./artifact";
import type { ArtifactActionContext } from "./create-artifact";

const exportFormats = ["pdf", "doc", "pptx", "xlsx"] as const;

type ArtifactActionsProps = {
  artifact: UIArtifact;
  handleVersionChange: (type: "next" | "prev" | "toggle" | "latest") => void;
  currentVersionIndex: number;
  isCurrentVersion: boolean;
  mode: "edit" | "diff";
  metadata: ArtifactActionContext["metadata"];
  setMetadata: ArtifactActionContext["setMetadata"];
};

function PureArtifactActions({
  artifact,
  handleVersionChange,
  currentVersionIndex,
  isCurrentVersion,
  mode,
  metadata,
  setMetadata,
}: ArtifactActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const artifactDefinition = artifactDefinitions.find(
    (definition) => definition.kind === artifact.kind
  );

  if (!artifactDefinition) {
    throw new Error("Artifact definition not found!");
  }

  const availableExportFormats = useMemo<
    (typeof exportFormats)[number][]
  >(() => {
    if (artifact.kind === "image") {
      return [];
    }

    if (artifact.kind === "sheet") {
      return ["xlsx", "pdf"];
    }

    return [...exportFormats];
  }, [artifact.kind]);

  const handleExport = async (format: (typeof exportFormats)[number]) => {
    try {
      const query = new URLSearchParams({
        id: artifact.documentId,
        format,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/document/export?${query.toString()}`
      );

      if (!response.ok) {
        throw new Error("export_failed");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition");
      const maybeName = disposition?.match(/filename="([^"]+)"/i)?.[1];
      const fileName = maybeName ?? `${artifact.title}.${format}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`Export ${format.toUpperCase()} généré.`);
    } catch {
      toast.error("Échec de l'export. Réessayez dans quelques secondes.");
    }
  };

  const actionContext: ArtifactActionContext = {
    content: artifact.content,
    handleVersionChange,
    currentVersionIndex,
    isCurrentVersion,
    mode,
    metadata,
    setMetadata,
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      {artifactDefinition.actions.map((action) => {
        const disabled =
          isLoading || artifact.status === "streaming"
            ? true
            : action.isDisabled
              ? action.isDisabled(actionContext)
              : false;

        return (
          <Tooltip key={action.description}>
            <TooltipTrigger asChild>
              <button
                className={cn(
                  "flex items-center justify-center rounded-full p-3 text-muted-foreground transition-all duration-150",
                  "hover:text-foreground",
                  "active:scale-95",
                  "disabled:pointer-events-none disabled:opacity-30",
                  {
                    "text-foreground":
                      mode === "diff" && action.description === "View changes",
                  }
                )}
                disabled={disabled}
                onClick={async () => {
                  setIsLoading(true);

                  try {
                    await Promise.resolve(action.onClick(actionContext));
                  } catch (_error) {
                    toast.error("Failed to execute action");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                type="button"
              >
                {action.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              {action.description}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {availableExportFormats.length > 0 ? (
        <div className="mt-2 flex flex-col items-center gap-1.5 rounded-full border border-border/60 bg-background/70 p-1.5">
          {availableExportFormats.map((format) => (
            <Tooltip key={format}>
              <TooltipTrigger asChild>
                <button
                  className="rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                  disabled={artifact.status === "streaming"}
                  onClick={() => {
                    void handleExport(format);
                  }}
                  type="button"
                >
                  {format.toUpperCase()}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8}>
                Exporter en {format.toUpperCase()}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export const ArtifactActions = memo(
  PureArtifactActions,
  (prevProps, nextProps) => {
    if (prevProps.artifact.status !== nextProps.artifact.status) {
      return false;
    }
    if (prevProps.currentVersionIndex !== nextProps.currentVersionIndex) {
      return false;
    }
    if (prevProps.isCurrentVersion !== nextProps.isCurrentVersion) {
      return false;
    }
    if (prevProps.artifact.content !== nextProps.artifact.content) {
      return false;
    }
    if (prevProps.mode !== nextProps.mode) {
      return false;
    }

    return true;
  }
);
