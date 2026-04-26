"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getQuizzlyProfile,
  getQuizzlyInventory,
  buyItem,
  claimDailyReward,
  spinWheelOfFortune,
} from "@/lib/quizzly/actions";
import { toast } from "sonner";
import { Star, Zap, Shield, Diamond, Gift } from "lucide-react";

const SHOP_ITEMS = [
  { key: "star_1", name: "1 Étoile", icon: Star, color: "text-yellow-400 bg-yellow-50", price: 50, type: "star", amount: 1 },
  { key: "star_5", name: "Pack 5 Étoiles", icon: Star, color: "text-orange-500 bg-orange-50", price: 200, type: "star", amount: 5 },
  { key: "booster_x1.5", name: "Booster x1.5", icon: Zap, color: "text-cyan-500 bg-cyan-50", price: 100, type: "booster", amount: 1 },
  { key: "booster_x2", name: "Booster x2", icon: Zap, color: "text-blue-500 bg-blue-50", price: 200, type: "booster", amount: 1 },
  { key: "booster_x3", name: "Booster x3", icon: Zap, color: "text-rose-500 bg-rose-50", price: 400, type: "booster", amount: 1 },
  { key: "shield_1d", name: "Bouclier 1 jour", icon: Shield, color: "text-sky-600 bg-sky-50", price: 200, type: "shield", amount: 1 },
  { key: "shield_3d", name: "Bouclier 3 jours", icon: Shield, color: "text-indigo-600 bg-indigo-50", price: 500, type: "shield", amount: 1 },
  { key: "shield_7d", name: "Bouclier 7 jours", icon: Shield, color: "text-violet-600 bg-violet-50", price: 1000, type: "shield", amount: 1 },
  { key: "title:champion", name: "Titre: Champion", icon: Gift, color: "text-fuchsia-600 bg-fuchsia-50", price: 300, type: "title", amount: 1 },
  { key: "title:grand-maitre", name: "Titre: Grand Maître", icon: Gift, color: "text-rose-600 bg-rose-50", price: 700, type: "title", amount: 1 },
  { key: "avatar:dragon", name: "Avatar Dragon", icon: Gift, color: "text-red-600 bg-red-50", price: 450, type: "avatar", amount: 1 },
  { key: "avatar:neon", name: "Avatar Neon", icon: Gift, color: "text-cyan-600 bg-cyan-50", price: 450, type: "avatar", amount: 1 },
  { key: "effect:feu", name: "Effet Feu", icon: Zap, color: "text-orange-600 bg-orange-50", price: 350, type: "effect", amount: 1 },
  { key: "effect:glow", name: "Effet Glow", icon: Zap, color: "text-lime-600 bg-lime-50", price: 350, type: "effect", amount: 1 },
] as const;

type Profile = { diamonds: number };
type InventoryItem = { itemKey: string; quantity: number };
function getWeekKey(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export default function QuizzlyShopPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyClaiming, setDailyClaiming] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [lastWheelResult, setLastWheelResult] = useState<number | null>(null);
  const [wheelFxLevel, setWheelFxLevel] = useState<"idle" | "normal" | "jackpot">("idle");

  const loadData = async () => {
    const [p, inv] = await Promise.all([getQuizzlyProfile(), getQuizzlyInventory()]);
    setProfile(p as Profile);
    setInventory(inv as InventoryItem[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const canClaimDaily = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return !inventory.some((item) => item.itemKey === `daily-reward:${today}`);
  }, [inventory]);
  const canSpinWheel = useMemo(() => {
    const weekKey = getWeekKey();
    return !inventory.some((item) => item.itemKey === `wheel-spin:${weekKey}`);
  }, [inventory]);

  const handleDailyClaim = async () => {
    setDailyClaiming(true);
    try {
      const result = await claimDailyReward();
      if (result.success) {
        toast.success(`Récompense gratuite récupérée: +${result.reward}💎`);
      } else {
        toast.error(result.message);
      }
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(message);
    } finally {
      setDailyClaiming(false);
    }
  };

  const handleBuy = async (itemKey: string, price: number, amount = 1) => {
    if (!profile || profile.diamonds < price) {
      toast.error("Pas assez de diamants !");
      return;
    }

    try {
      await buyItem(itemKey, price, amount);
      toast.success("Achat réussi !");
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(message);
    }
  };

  const handleSpin = async () => {
    if (!confirm("Tourner la roue coûte 10 diamants. Continuer ?")) return;
    setSpinning(true);
    setWheelFxLevel("idle");
    try {
      const res = await spinWheelOfFortune();
      setLastWheelResult(res.result);
      if (res.isJackpot) {
        setWheelFxLevel("jackpot");
        toast.success("🎉 JACKPOT 100 💎 ! La tribu va en entendre parler !");
      } else {
        setWheelFxLevel("normal");
        toast.success(`Roue terminée : ${res.result} 💎`);
      }
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de roue");
    } finally {
      setSpinning(false);
    }
  };

  if (loading || !profile) return <div className="p-10 text-center animate-pulse">Chargement...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Boutique</h1>
          <p className="text-slate-500 mt-1">Boosters, boucliers, étoiles et cadeau quotidien.</p>
        </div>
        <div className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2">
          {profile.diamonds} <Diamond className="w-5 h-5 text-cyan-400" />
        </div>
      </div>

      <div id="daily-free" className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-3xl border border-orange-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-black text-slate-800 flex items-center gap-2"><Gift className="w-5 h-5 text-orange-500" /> Item gratuit du jour</p>
            <p className="text-sm text-slate-600 mt-1">Une fois par compte et par jour: <span className="font-bold">10 diamants</span>.</p>
          </div>
          <button
            onClick={handleDailyClaim}
            disabled={!canClaimDaily || dailyClaiming}
            className="px-4 py-2.5 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-50"
          >
            {canClaimDaily ? "Récupérer +10💎" : "Déjà récupéré"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-50 to-violet-50 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-black text-slate-800">🎰 Roue de la Fortune</p>
            <p className="mt-1 text-sm text-slate-600">
              Mise fixe: <strong>10 💎</strong>. Disponible <strong>1 fois par semaine</strong>. Gains possibles: 0, 5, 10, 15, 25, 50, 75, 100.
            </p>
            {!canSpinWheel && <p className="mt-1 text-xs font-semibold text-amber-700">Roue déjà utilisée cette semaine.</p>}
            {lastWheelResult !== null && (
              <p className="mt-2 text-xs font-bold text-fuchsia-700">Dernier résultat: {lastWheelResult} 💎</p>
            )}
          </div>
          <div className="relative h-28 w-28">
            <div className="absolute left-1/2 -top-2 h-0 w-0 -translate-x-1/2 border-x-8 border-b-[12px] border-x-transparent border-b-violet-700" />
            <div
              className={`h-28 w-28 rounded-full border-4 border-white shadow ${wheelFxLevel === "normal" ? "ring-4 ring-fuchsia-300/70" : ""} ${wheelFxLevel === "jackpot" ? "animate-pulse ring-4 ring-yellow-300" : ""}`}
              style={{
                background:
                  "conic-gradient(#f43f5e 0 45deg,#fb7185 45deg 90deg,#f97316 90deg 135deg,#f59e0b 135deg 180deg,#84cc16 180deg 225deg,#22d3ee 225deg 270deg,#3b82f6 270deg 315deg,#8b5cf6 315deg 360deg)",
              }}
            />
          </div>
          <button
            className="rounded-xl bg-fuchsia-600 px-4 py-2.5 font-bold text-white disabled:opacity-50"
            disabled={spinning || profile.diamonds < 10 || !canSpinWheel}
            onClick={handleSpin}
            type="button"
          >
            {spinning ? "Résolution..." : canSpinWheel ? "Parier 10💎" : "Déjà joué cette semaine"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SHOP_ITEMS.map((item) => {
          const owned = inventory.find((i) => i.itemKey === item.key)?.quantity || 0;

          return (
            <div key={item.key} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${item.color}`}>
                <item.icon className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium uppercase tracking-wider">{item.type}</p>

              <div className="mt-auto w-full space-y-3">
                {owned > 0 && (
                  <div className="text-xs font-bold text-violet-600 bg-violet-50 py-1.5 rounded-lg">En stock : {owned}</div>
                )}
                <button
                  onClick={() => handleBuy(item.key, item.price, item.amount ?? 1)}
                  disabled={profile.diamonds < item.price}
                  className="w-full bg-slate-100 text-slate-800 font-bold py-3 rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {item.price} <Diamond className="w-4 h-4 text-cyan-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
