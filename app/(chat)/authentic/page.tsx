"use client";

import { SearchIcon, ShieldCheck } from "lucide-react";
import { useState } from "react";

export default function AuthenticPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ score: number; label: string } | null>(
    null
  );

  const handleAnalyze = () => {
    if (!text.trim()) return;

    // Simulation basique d'un algorithme de détection
    // On génère un score aléatoire pour la démonstration,
    // mais idéalement ceci appellerait une API (ZeroGPT, etc.)
    const score = Math.floor(Math.random() * 101); // 0 à 100
    let label = "";

    if (score === 100) {
      label = "Texte généré pur.";
    } else if (score >= 76) {
      label = "Travail d'IA amélioré/édité par l'humain.";
    } else if (score >= 51) {
      label = "IA avec retouches humaines significatives.";
    } else if (score >= 21) {
      label = "Humain avec assistance IA légère.";
    } else {
      label = "Travail humain.";
    }

    setResult({ score, label });
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto p-6 md:p-10">
      <header className="rounded-2xl border border-border/50 bg-card/70 p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Authentic</h1>
            <p className="text-sm text-muted-foreground">
              Détectez le contenu généré par IA et analysez l'origine de vos
              textes.
            </p>
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-1 flex-col gap-4 rounded-2xl border border-border/50 bg-card p-5">
          <h2 className="text-lg font-semibold">Analyseur de texte</h2>
          <textarea
            className="min-h-[200px] flex-1 resize-none rounded-xl border border-border/50 bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            onChange={(e) => setText(e.target.value)}
            placeholder="Collez le texte à analyser ici..."
            value={text}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            disabled={!text.trim()}
            onClick={handleAnalyze}
          >
            <SearchIcon className="size-4" />
            Lancer l'analyse
          </button>
        </div>

        {result && (
          <div className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border border-border/50 bg-card p-5 md:w-[350px]">
            <h2 className="text-lg font-semibold">Résultat</h2>
            <div className="flex size-32 items-center justify-center rounded-full border-8 border-primary/20 bg-background text-4xl font-bold text-primary">
              {result.score}%
            </div>
            <p className="text-center font-medium">IA détectée</p>
            <p className="text-center text-sm text-muted-foreground">
              {result.label}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
