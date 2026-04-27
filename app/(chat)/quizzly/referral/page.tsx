"use client";

import { useEffect, useMemo, useState } from "react";
import { claimMonthlyReferralTopBonus, claimReferralTierRewards, getMonthlyReferralLeaderboard, getReferralProgramData } from "@/lib/quizzly/actions";
import { Copy, MessageCircle, Share2, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function QuizzlyReferralPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getReferralProgramData>> | null>(null);
  const [leaderboard, setLeaderboard] = useState<Awaited<ReturnType<typeof getMonthlyReferralLeaderboard>> | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    Promise.all([getReferralProgramData(), getMonthlyReferralLeaderboard(), claimReferralTierRewards(), claimMonthlyReferralTopBonus()])
      .then(([referralData, monthly, tierClaim, monthlyClaim]) => {
        setData(referralData);
        setLeaderboard(monthly);
        if (tierClaim.unlockedNow.length > 0 || monthlyClaim.granted) {
          setCelebrate(true);
          tierClaim.unlockedNow.forEach((label) => toast.success(`🎉 Nouveau palier débloqué: ${label}`));
          if (monthlyClaim.granted) toast.success(`🏆 Bonus classement mensuel: +${monthlyClaim.bonusDiamonds}💎`);
          setTimeout(() => setCelebrate(false), 2400);
        }
      })
      .catch(() => {
        setData(null);
        setLeaderboard(null);
      });
  }, []);

  const shareText = useMemo(() => `Rejoins-moi sur Quizzly 🚀 Utilise mon lien de parrainage: ${data?.referralLink ?? ""}`, [data?.referralLink]);

  if (!data) return <div className="p-10 text-center animate-pulse">Chargement du programme de parrainage...</div>;

  const socials = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(shareText)}`, icon: MessageCircle },
    { name: "Instagram", href: `https://www.instagram.com/`, icon: Share2 },
    { name: "Snapchat", href: `https://www.snapchat.com/`, icon: Share2 },
    { name: "SMS", href: `sms:?&body=${encodeURIComponent(shareText)}`, icon: Smartphone },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800">Inviter des amis</h1>
        <p className="text-slate-500">Partage ton lien unique, gagne des récompenses et suis tes filleuls.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-700">Ton lien de parrainage</p>
          <div className="mt-2 flex gap-2">
            <input className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" readOnly value={data.referralLink} />
            <button
              className="rounded-xl bg-violet-600 px-3 py-2 text-sm font-bold text-white"
              onClick={async () => {
                await navigator.clipboard.writeText(data.referralLink);
                toast.success("Lien copié !");
              }}
              type="button"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {socials.map((item) => (
              <a key={item.name} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700" href={item.href} rel="noreferrer" target="_blank">
                <item.icon className="mr-1 inline h-3.5 w-3.5" /> {item.name}
              </a>
            ))}
            <button className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700" onClick={() => navigator.clipboard.writeText(data.referralLink)} type="button">Copie brute</button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm">
          <img alt="QR code parrainage" className="mx-auto h-44 w-44 rounded-xl border border-slate-100" src={data.qrCodeUrl} />
          <p className="mt-2 text-xs text-slate-500">QR code de partage rapide</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-800">Progression vers le prochain palier</p>
        <p className="text-xs text-slate-500">{data.activeReferrals} filleuls actifs • prochain palier à {data.nextTierTarget}</p>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-violet-600 transition-all duration-700" style={{ width: `${Math.min(100, data.progress)}%` }} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-800">Échelle des paliers ambassadeur</p>
        <div className="mt-3 relative border-l-2 border-violet-200 pl-4 space-y-4">
          {data.tierStatuses.map((tier) => (
            <div key={tier.key} className="relative rounded-xl bg-slate-50 p-3">
              <span className={`absolute -left-[22px] top-4 h-3 w-3 rounded-full ${tier.claimed ? "bg-emerald-500" : tier.unlocked ? "bg-violet-500" : "bg-slate-300"}`} />
              <p className="font-bold text-slate-800">{tier.referrals} filleuls actifs</p>
              <p className="text-xs text-slate-600">{tier.rewardsLabel}</p>
              <p className={`mt-1 text-xs font-bold ${tier.claimed ? "text-emerald-700" : tier.unlocked ? "text-violet-700" : "text-slate-500"}`}>
                {tier.claimed ? "Débloqué" : tier.unlocked ? "Disponible" : "Verrouillé"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-800">Mes filleuls ({data.totalReferrals})</p>
        <div className="mt-3 space-y-2">
          {data.children.map((child) => (
            <div key={`${child.pseudo}-${child.joinedAt}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <div>
                <p className="font-semibold text-slate-800">{child.pseudo}</p>
                <p className="text-xs text-slate-500">Inscription: {child.joinedAt || "—"}</p>
              </div>
              <div className="text-right text-xs">
                <p className={`font-bold ${child.active ? "text-emerald-600" : "text-slate-500"}`}>{child.active ? "Actif (7j)" : "Inactif"}</p>
                <p className="text-slate-500">{child.rewards}</p>
              </div>
            </div>
          ))}
          {data.children.length === 0 && <p className="text-sm text-slate-500">Aucun filleul pour le moment.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-800">Classement mensuel des meilleurs parrains ({leaderboard?.monthKey ?? "—"})</p>
        <div className="mt-3 space-y-2">
          {(leaderboard?.entries ?? []).map((entry, index) => (
            <div key={entry.userId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <p className="font-semibold text-slate-800">#{index + 1} {entry.pseudo}</p>
              <p className="text-xs font-bold text-violet-700">{entry.activeReferrals} filleuls actifs</p>
            </div>
          ))}
          {(leaderboard?.entries?.length ?? 0) === 0 && <p className="text-sm text-slate-500">Aucun parrainage actif ce mois-ci.</p>}
        </div>
        <p className="mt-2 text-xs text-slate-500">Bonus fin de mois: #1 +200💎, #2 +150💎, #3 +100💎.</p>
      </div>

      {celebrate && (
        <div className="pointer-events-none fixed inset-0 z-50">
          {Array.from({ length: 28 }, (_, i) => (
            <span key={i} className="absolute text-xl" style={{ left: `${(i * 13) % 100}%`, top: `${(i * 7) % 40}%`, animation: `mai-confetti 1000ms ease ${i * 35}ms 1 both` }}>✨</span>
          ))}
        </div>
      )}
    </div>
  );
}
