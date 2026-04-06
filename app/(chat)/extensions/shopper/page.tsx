"use client";

import { Camera, Search, ShoppingBag, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

type ShopperResult = {
  id: string;
  merchant: string;
  title: string;
  price: number;
  score: number;
};

function generateResults(query: string) {
  const safeQuery = query.trim() || "article recherché";

  return [
    { id: "1", merchant: "Marketplace A", title: `${safeQuery} · Neuf`, price: 129, score: 87 },
    { id: "2", merchant: "Vinted", title: `${safeQuery} · Très bon état`, price: 94, score: 92 },
    { id: "3", merchant: "Boutique B", title: `${safeQuery} · Reconditionné`, price: 99, score: 90 },
  ] satisfies ShopperResult[];
}

export default function ShopperPage() {
  const [query, setQuery] = useState("");
  const [budget, setBudget] = useState(120);

  const results = useMemo(() => generateResults(query), [query]);

  const bestDeal = useMemo(() => {
    return [...results].sort((a, b) => b.score - a.score || a.price - b.price)[0];
  }, [results]);

  return (
    <div className="liquid-glass mx-auto flex h-full w-full max-w-6xl flex-col gap-5 overflow-y-auto p-6">
      <header className="liquid-glass rounded-2xl border border-border/50 p-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ShoppingBag className="size-6 text-primary" /> Shopper
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Assistant shopping intelligent: recherche multi-plateformes, synthèse
          IA, visual proof et priorisation des offres selon votre budget.
        </p>
      </header>

      <section className="liquid-glass grid gap-4 rounded-2xl border border-border/50 p-5 md:grid-cols-2">
        <label className="text-sm">
          Produit recherché
          <input
            className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex: casque audio à réduction de bruit"
            value={query}
          />
        </label>
        <label className="text-sm">
          Budget maximal (€)
          <input
            className="mt-1 w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2"
            min={20}
            onChange={(event) => setBudget(Math.max(20, Number(event.target.value) || 20))}
            type="number"
            value={budget}
          />
        </label>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="liquid-glass rounded-2xl border border-border/50 p-5 xl:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Search className="size-4 text-primary" /> Recherche Multi-Plateformes
          </h2>
          <div className="space-y-3">
            {results.map((result) => {
              const withinBudget = result.price <= budget;

              return (
                <div
                  className="rounded-xl border border-border/40 bg-background/50 p-3"
                  key={result.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{result.title}</p>
                    <span className="text-sm font-semibold">{result.price} €</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {result.merchant} · Score IA qualité/prix: {result.score}/100 · {withinBudget ? "✅ Dans le budget" : "⚠️ Hors budget"}
                  </p>
                </div>
              );
            })}
          </div>
        </article>

        <article className="liquid-glass rounded-2xl border border-border/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Wallet className="size-4 text-primary" /> Synthèse IA + Scan Budget
          </h2>
          <p className="text-sm text-muted-foreground">
            Meilleur rapport qualité/prix détecté: <strong>{bestDeal.title}</strong> à
            <strong> {bestDeal.price} €</strong> (score {bestDeal.score}/100).
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Recommandation: prioriser cette offre puis surveiller la seconde
            meilleure option si le prix descend sous {Math.max(20, budget - 10)} €.
          </p>

          <h3 className="mt-5 flex items-center gap-2 text-sm font-semibold">
            <Camera className="size-4 text-primary" /> Visual Proof
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {results.slice(0, 2).map((result) => (
              <div
                className="rounded-lg border border-border/50 bg-gradient-to-br from-background/60 to-primary/10 p-2 text-xs text-muted-foreground"
                key={result.id}
              >
                Capture produit simulée<br />
                <span className="font-medium text-foreground">{result.merchant}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
