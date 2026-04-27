"use client";

const presetColors = [
  "#0EA5E9",
  "#06B6D4",
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#14B8A6",
  "#64748B",
  "#111827",
];

function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function ProjectColorPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Couleur d'accent</p>
      <div className="grid grid-cols-6 gap-2">
        {presetColors.map((color) => (
          <button
            className={`min-h-11 rounded-full border-2 ${
              value === color ? "border-black" : "border-white"
            }`}
            key={color}
            onClick={() => onChange(color)}
            style={{ backgroundColor: color }}
            type="button"
          />
        ))}
      </div>

      <input
        className="h-10 w-full rounded-xl border border-black/15 bg-white px-3 text-sm"
        onChange={(event) => {
          const next = event.target.value.trim();
          onChange(isHexColor(next) ? next : null);
        }}
        placeholder="#22C55E"
        value={value ?? ""}
      />

      <div className="rounded-xl border border-black/10 bg-white/80 p-3">
        <div className="rounded-lg border-l-4 bg-white p-3" style={{ borderLeftColor: value ?? "#0EA5E9" }}>
          <p className="text-sm font-medium">Aperçu carte projet</p>
          <p className="text-xs text-black/60">Accent en temps réel</p>
        </div>
      </div>
    </div>
  );
}
