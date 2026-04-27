"use client";

import {
  Book,
  Briefcase,
  Camera,
  ChartBar,
  CheckSquare,
  Code,
  Compass,
  Cpu,
  FileText,
  FlaskConical,
  Folder,
  Gamepad2,
  Gem,
  Globe,
  Heart,
  Home,
  Image,
  Lightbulb,
  Map,
  Megaphone,
  MessageCircle,
  Monitor,
  Music,
  Palette,
  PenTool,
  Rocket,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

const iconEntries: Array<{ name: string; Icon: LucideIcon }> = [
  { name: "folder", Icon: Folder },
  { name: "code", Icon: Code },
  { name: "book", Icon: Book },
  { name: "rocket", Icon: Rocket },
  { name: "star", Icon: Star },
  { name: "heart", Icon: Heart },
  { name: "music", Icon: Music },
  { name: "camera", Icon: Camera },
  { name: "globe", Icon: Globe },
  { name: "briefcase", Icon: Briefcase },
  { name: "chart", Icon: ChartBar },
  { name: "check", Icon: CheckSquare },
  { name: "compass", Icon: Compass },
  { name: "cpu", Icon: Cpu },
  { name: "file", Icon: FileText },
  { name: "flask", Icon: FlaskConical },
  { name: "game", Icon: Gamepad2 },
  { name: "gem", Icon: Gem },
  { name: "home", Icon: Home },
  { name: "image", Icon: Image },
  { name: "idea", Icon: Lightbulb },
  { name: "map", Icon: Map },
  { name: "megaphone", Icon: Megaphone },
  { name: "message", Icon: MessageCircle },
  { name: "monitor", Icon: Monitor },
  { name: "palette", Icon: Palette },
  { name: "pen", Icon: PenTool },
  { name: "shield", Icon: Shield },
  { name: "shopping", Icon: ShoppingBag },
  { name: "sparkles", Icon: Sparkles },
  { name: "wrench", Icon: Wrench },
];

export function resolveProjectIcon(name?: string | null): LucideIcon {
  return iconEntries.find((entry) => entry.name === name)?.Icon ?? Folder;
}

export function ProjectIconPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      iconEntries.filter((entry) =>
        entry.name.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const SelectedIcon = resolveProjectIcon(value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor="project-icon-search">
        Icône du projet
      </label>
      <input
        className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
        id="project-icon-search"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Rechercher une icône"
        value={query}
      />

      <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-white/80 px-3 py-2">
        <SelectedIcon className="size-4" />
        <span className="text-xs text-black/70">Aperçu: {value ?? "folder"}</span>
      </div>

      <div className="grid max-h-44 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-black/10 bg-white/75 p-2">
        {filtered.map(({ name, Icon }) => (
          <button
            className={`flex min-h-11 items-center justify-center rounded-lg border ${
              value === name ? "border-cyan-500 bg-cyan-100" : "border-black/10 bg-white"
            }`}
            key={name}
            onClick={() => onChange(name)}
            title={name}
            type="button"
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
