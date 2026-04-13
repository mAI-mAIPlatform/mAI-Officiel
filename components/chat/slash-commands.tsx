"use client";

import {
  BombIcon,
  ListIcon,
  PaletteIcon,
  PenLineIcon,
  PenSquareIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type SlashCommand = {
  name: string;
  description: string;
  icon: ReactNode;
  action: string;
  shortcut?: string;
};

export const defaultSlashCommands: SlashCommand[] = [
  {
    name: "new",
    description: "Créer une nouvelle discussion",
    icon: <PenSquareIcon className="size-3.5" />,
    action: "new",
  },
  {
    name: "clear",
    description: "Effacer la discussion courante",
    icon: <Trash2Icon className="size-3.5" />,
    action: "clear",
  },
  {
    name: "rename",
    description: "Renommer la discussion courante",
    icon: <PenLineIcon className="size-3.5" />,
    action: "rename",
  },
  {
    name: "model",
    description: "Changer de modèle IA",
    icon: <ListIcon className="size-3.5" />,
    action: "model",
  },
  {
    name: "theme",
    description: "Basculer clair/sombre",
    icon: <PaletteIcon className="size-3.5" />,
    action: "theme",
  },
  {
    name: "delete",
    description: "Supprimer la discussion courante",
    icon: <XIcon className="size-3.5" />,
    action: "delete",
  },
  {
    name: "résume",
    description: "Résumer le dernier échange",
    icon: <ListIcon className="size-3.5" />,
    action: "resume",
  },
  {
    name: "code",
    description: "Demander une réponse orientée code",
    icon: <PenLineIcon className="size-3.5" />,
    action: "code",
  },
  {
    name: "quiz",
    description: "Créer un quiz interactif",
    icon: <ListIcon className="size-3.5" />,
    action: "quiz",
  },
  {
    name: "purge",
    description: "Supprimer toutes les discussions",
    icon: <BombIcon className="size-3.5" />,
    action: "purge",
  },
];

const CUSTOM_SLASH_COMMANDS_KEY = "mai.custom-slash-commands";
const MAX_CUSTOM_SLASH_COMMANDS = 8;

const normalizeSlashToken = (value: string) =>
  value
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLowerCase();

const parseCustomSlashCommands = (): SlashCommand[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CUSTOM_SLASH_COMMANDS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .slice(0, MAX_CUSTOM_SLASH_COMMANDS)
      .filter(
        (item): item is { action?: string; description?: string; name: string } =>
          typeof item === "object" &&
          item !== null &&
          typeof item.name === "string" &&
          item.name.trim().length > 0
      )
      .map((item) => ({
        name: item.name.trim().replace(/^\//, "").slice(0, 20),
        description:
          typeof item.description === "string" && item.description.trim()
            ? item.description.trim().slice(0, 80)
            : "Commande personnalisée",
        action:
          typeof item.action === "string" && item.action.trim()
            ? item.action.trim()
            : "template",
        icon: <PenSquareIcon className="size-3.5" />,
      }));
  } catch {
    return [];
  }
};

export const getActiveSlashCommands = (): SlashCommand[] => {
  const customCommands = parseCustomSlashCommands();
  const existing = new Set(defaultSlashCommands.map((command) => command.name));
  const deduplicatedCustom = customCommands.filter((command) => {
    if (existing.has(command.name)) {
      return false;
    }
    existing.add(command.name);
    return true;
  });

  return [...defaultSlashCommands, ...deduplicatedCustom];
};

export const filterSlashCommands = (
  commands: SlashCommand[],
  query: string
): SlashCommand[] => {
  const normalizedQuery = normalizeSlashToken(query.trim());
  if (!normalizedQuery) {
    return commands;
  }

  return commands.filter((command) => {
    const normalizedName = normalizeSlashToken(command.name);
    return normalizedName.startsWith(normalizedQuery) ||
      normalizedName.includes(normalizedQuery)
      ? true
      : normalizeSlashToken(command.description).includes(normalizedQuery);
  });
};

type SlashCommandMenuProps = {
  commands: SlashCommand[];
  query: string;
  onSelect: (command: SlashCommand) => void;
  onClose: () => void;
  selectedIndex: number;
};

export function SlashCommandMenu({
  commands,
  query,
  onSelect,
  onClose: _onClose,
  selectedIndex,
}: SlashCommandMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const filtered = filterSlashCommands(commands, query);

  useEffect(() => {
    const selected = menuRef.current?.querySelector("[data-selected='true']");
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, []);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div
      className="liquid-panel absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-white/30 bg-white/85 text-black shadow-[var(--glass-shadow)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/60 dark:text-white"
      ref={menuRef}
    >
      <div className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/40">
        Commandes
      </div>
      <div className="max-h-64 overflow-y-auto pb-1 no-scrollbar">
        {filtered.map((cmd, index) => (
          <button
            className={cn(
              "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
              index === selectedIndex ? "bg-muted/70" : "hover:bg-muted/40"
            )}
            data-selected={index === selectedIndex}
            key={cmd.name}
            onClick={() => onSelect(cmd)}
            onMouseDown={(e) => e.preventDefault()}
            type="button"
          >
            <div className="flex size-6 shrink-0 items-center justify-center text-muted-foreground/60">
              {cmd.icon}
            </div>
            <span className="font-mono text-[13px] text-foreground">
              /{cmd.name}
            </span>
            <span className="text-[12px] text-muted-foreground/50">
              {cmd.description}
            </span>
            {cmd.shortcut && (
              <span className="ml-auto text-[11px] text-muted-foreground/30">
                {cmd.shortcut}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
