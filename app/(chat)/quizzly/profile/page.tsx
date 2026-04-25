"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useSubscriptionPlan } from "@/hooks/use-subscription-plan";

type Badge = {
  id: "plus" | "pro" | "max";
  label: string;
  rarity: string;
};

const allBadges: Badge[] = [
  { id: "plus", label: "Un petit Plus", rarity: "Peu commun" },
  { id: "pro", label: "Je suis Pro", rarity: "Rare" },
  { id: "max", label: "Productivité Maximale", rarity: "Légendaire" },
];

export default function QuizzlyProfilePage() {
  const { currentPlanDefinition, plan } = useSubscriptionPlan();
  const [pseudo, setPseudo] = useState("Player");
  const [bio, setBio] = useState("J'adore les quiz.");
  const [emoji, setEmoji] = useState("🧠");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [favoriteBadge, setFavoriteBadge] = useState<Badge["id"] | "none">("none");

  const unlockedBadges = useMemo(() => {
    if (plan === "max") return allBadges;
    if (plan === "pro") return allBadges.filter((badge) => badge.id !== "max");
    if (plan === "plus") return allBadges.filter((badge) => badge.id === "plus");
    return [];
  }, [plan]);

  return (
    <section className="space-y-4">
      <div className="liquid-glass rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Image alt="Quizzly" className="size-10 rounded-lg" height={40} src="/images/logo.png" width={40} />
          <h1 className="text-3xl font-bold">Profil</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Date de création: {new Date().toLocaleDateString("fr-FR")}</p>
        <p className="text-sm">Forfait actuel: <strong>{currentPlanDefinition.label}</strong></p>
      </div>

      <div className="liquid-glass rounded-2xl p-5">
        <div className="mt-2 flex items-center gap-4">
          <div className="flex size-20 items-center justify-center rounded-full border text-4xl" style={avatarDataUrl ? { backgroundImage: `url(${avatarDataUrl})`, backgroundSize: "cover" } : undefined}>{avatarDataUrl ? "" : emoji}</div>
          <div className="grid flex-1 gap-2 md:grid-cols-2">
            <input className="h-9 rounded-lg border px-2" onChange={(e) => setPseudo(e.target.value)} value={pseudo} />
            <input className="h-9 rounded-lg border px-2" onChange={(e) => setBio(e.target.value)} value={bio} />
            <input className="h-9 rounded-lg border px-2" maxLength={2} onChange={(e) => setEmoji(e.target.value)} value={emoji} />
            <label className="flex h-9 items-center rounded-lg border px-2 text-xs">Importer image avatar<input className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setAvatarDataUrl(String(reader.result)); reader.readAsDataURL(file); }} type="file" /></label>
          </div>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl p-5">
        <h2 className="text-xl font-bold">Badges débloqués</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {allBadges.map((badge) => {
            const unlocked = unlockedBadges.some((item) => item.id === badge.id);
            return (
              <article className="rounded-xl border p-3" key={badge.id}>
                <p className="font-semibold">{badge.label}</p>
                <p className="text-xs text-muted-foreground">{badge.rarity}</p>
                <p className="mt-2 text-xs">{unlocked ? "Débloqué" : "Verrouillé"}</p>
              </article>
            );
          })}
        </div>

        <label className="mt-4 block text-sm">Badge favori
          <select className="mt-1 h-10 w-full rounded-lg border px-2" onChange={(event) => setFavoriteBadge(event.target.value as Badge["id"] | "none")} value={favoriteBadge}>
            <option value="none">Aucun</option>
            {unlockedBadges.map((badge) => <option key={badge.id} value={badge.id}>{badge.label}</option>)}
          </select>
        </label>
        <p className="mt-2 text-sm">Badge affiché: <strong>{favoriteBadge === "none" ? "Aucun" : allBadges.find((badge) => badge.id === favoriteBadge)?.label}</strong></p>
      </div>
    </section>
  );
}
