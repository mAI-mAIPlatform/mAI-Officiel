"use client";

import { BrainCircuit, ScanText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type HumanizyResult = {
  confidence: number;
  explanation: string;
  label: "IA" | "Humain";
  signals: string[];
};

export default function HumanizyPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HumanizyResult | null>(null);

  const analyzeText = async () => {
    if (!text.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/humanizy/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Analyse impossible");
      }

      const payload = (await response.json()) as HumanizyResult;
      setResult(payload);
    } catch {
      setResult({
        confidence: 0,
        explanation: "Une erreur est survenue pendant l'analyse.",
        label: "Humain",
        signals: ["Veuillez réessayer dans quelques instants."],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquid-glass flex h-full flex-col gap-4 overflow-auto p-4 md:p-8">
      <header className="space-y-1">
        <h1 className="inline-flex items-center gap-2 text-2xl font-semibold">
          <BrainCircuit className="size-5 text-primary" />
          Humanizy
        </h1>
        <p className="text-sm text-muted-foreground">
          Détection avancée IA vs humain avec explication des signaux
          linguistiques.
        </p>
      </header>

      <section className="liquid-panel rounded-2xl p-4">
        <label className="text-xs font-medium" htmlFor="humanizy-text">
          Texte à analyser
        </label>
        <textarea
          className="mt-2 min-h-[220px] w-full resize-none rounded-xl border border-border/50 bg-background/70 p-3 text-sm"
          id="humanizy-text"
          onChange={(event) => setText(event.target.value)}
          placeholder="Collez un texte pour obtenir un score de probabilité IA / humain..."
          value={text}
        />
        <div className="mt-3 flex items-center gap-2">
          <Button
            disabled={loading || !text.trim()}
            onClick={analyzeText}
            type="button"
          >
            <ScanText className="mr-2 size-4" />
            {loading ? "Analyse..." : "Analyser"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Analyse NLP locale + scoring probabiliste
          </p>
        </div>
      </section>

      {result ? (
        <section className="liquid-panel rounded-2xl border border-border/60 p-4">
          <p className="text-xs text-muted-foreground">Résultat</p>
          <p className="mt-1 text-2xl font-semibold">
            {result.label} · {result.confidence}%
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full ${result.label === "IA" ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.max(8, result.confidence)}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {result.explanation}
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {result.signals.map((signal) => (
              <li key={signal}>{signal}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
