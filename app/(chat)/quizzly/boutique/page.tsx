"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ShopItem = {
  category: "boosters" | "stars" | "shields";
  cost: number;
  effect: string;
  id: string;
  label: string;
};

const items: ShopItem[] = [
  { id: "star-1", label: "1 Étoile", cost: 50, category: "stars", effect: "+1 énergie" },
  { id: "star-5", label: "Pack 5 Étoiles", cost: 200, category: "stars", effect: "+5 énergie" },
  { id: "boost-15", label: "Booster x1.5", cost: 100, category: "boosters", effect: "15 min" },
  { id: "boost-2", label: "Booster x2", cost: 200, category: "boosters", effect: "15 min" },
  { id: "boost-3", label: "Booster x3", cost: 400, category: "boosters", effect: "10 min" },
  { id: "shield-1", label: "Bouclier 1j", cost: 25, category: "shields", effect: "Protège la série" },
  { id: "shield-3", label: "Bouclier 3j", cost: 60, category: "shields", effect: "Protège la série" },
  { id: "shield-7", label: "Bouclier 7j", cost: 120, category: "shields", effect: "Protège la série" },
];

export default function QuizzlyShopPage() {
  const [diamonds, setDiamonds] = useState(0);
  const [lastClaimDay, setLastClaimDay] = useState("");
  const [inventory, setInventory] = useState<Record<string, number>>({});

  const grouped = useMemo(
    () => ({
      boosters: items.filter((item) => item.category === "boosters"),
      stars: items.filter((item) => item.category === "stars"),
      shields: items.filter((item) => item.category === "shields"),
    }),
    []
  );

  const claimDaily = () => {
    const today = new Date().toISOString().slice(0, 10);
    if (today === lastClaimDay) return;
    setLastClaimDay(today);
    setDiamonds((current) => current + 5);
  };

  const buy = (item: ShopItem) => {
    if (diamonds < item.cost) return;
    setDiamonds((current) => current - item.cost);
    setInventory((current) => ({ ...current, [item.id]: (current[item.id] ?? 0) + 1 }));
  };

  return (
    <section className="space-y-4">
      <div className="liquid-glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-black text-violet-600">BOUTIQUE 💎</h1>
          <div className="rounded-2xl border px-4 py-2 text-2xl font-black">💎 {diamonds}</div>
        </div>
        <p className="mt-1 text-muted-foreground">Tes diamants servent à acheter boosters, étoiles et boucliers.</p>
        <button className="mt-4 rounded-xl bg-amber-400 px-4 py-2 font-semibold" onClick={claimDaily} type="button">🎁 Réclamer +5 💎 (quotidien)</button>
      </div>

      <div className="liquid-glass rounded-2xl p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...grouped.stars, ...grouped.boosters, ...grouped.shields].map((item) => (
            <article className="rounded-xl border p-4" key={item.id}>
              <div className="mb-3 flex items-center gap-2">
                <Image alt="Quizzly" className="size-8 rounded" height={32} src="/images/logo.png" width={32} />
                <div>
                  <p className="font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.effect}</p>
                </div>
              </div>
              <p className="text-sm">Prix: {item.cost} 💎</p>
              <p className="text-xs text-muted-foreground">Possédé: {inventory[item.id] ?? 0}</p>
              <button className="mt-2 rounded-lg border px-3 py-1 text-sm disabled:opacity-50" disabled={diamonds < item.cost} onClick={() => buy(item)} type="button">Acheter</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
