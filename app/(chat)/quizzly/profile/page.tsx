"use client";

import { useEffect, useState } from "react";
import { getQuizzlyProfile, updateQuizzlyProfile } from "@/lib/quizzly/actions";
import { toast } from "sonner";
import { Calendar, Link2, Medal } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PROFILE_SOCIALS_KEY = "mai.quizzly.profile.socials.v1";

type Profile = {
  bio: string;
  createdAt: string | Date;
  diamonds: number;
  emoji: string;
  level: number;
  pseudo: string;
  streak: number;
  xp: number;
};

type SocialLinks = {
  discord: string;
  tiktok: string;
};

export default function QuizzlyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pseudo, setPseudo] = useState("");
  const [bio, setBio] = useState("");
  const [emoji, setEmoji] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ discord: "", tiktok: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getQuizzlyProfile().then((p) => {
      setProfile(p as Profile);
      setPseudo(p.pseudo);
      setBio(p.bio);
      setEmoji(p.emoji);
    });

    try {
      const raw = window.localStorage.getItem(PROFILE_SOCIALS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SocialLinks>;
      setSocialLinks({ discord: parsed.discord ?? "", tiktok: parsed.tiktok ?? "" });
    } catch {
      // noop
    }
  }, []);

  const handleSave = async () => {
    if (!pseudo.trim() || !emoji.trim()) return toast.error("Le pseudo et l'emoji sont requis.");

    setSaving(true);
    try {
      await updateQuizzlyProfile({ pseudo, bio, emoji });
      window.localStorage.setItem(PROFILE_SOCIALS_KEY, JSON.stringify(socialLinks));
      toast.success("Profil mis à jour !");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="p-10 text-center animate-pulse">Chargement...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-black text-slate-800">Mon Profil</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center"><p className="text-sm text-slate-500">Niveau</p><p className="font-black text-2xl">{profile.level}</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center"><p className="text-sm text-slate-500">Streak</p><p className="font-black text-2xl">🔥 {profile.streak}</p></div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center"><p className="text-sm text-slate-500">Diamants</p><p className="font-black text-2xl">💎 {profile.diamonds}</p></div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-4xl border-4 border-violet-100">{emoji}</div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{pseudo}</h2>
            <div className="flex items-center gap-2 text-slate-500 mt-1"><Calendar className="w-4 h-4" /><span>Inscrit(e) le {format(new Date(profile.createdAt), "dd MMMM yyyy", { locale: fr })}</span></div>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Emoji / Avatar</label>
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200" maxLength={2} />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Pseudo</label>
            <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Biographie</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 resize-none" />
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-3">
            <p className="font-bold text-slate-800 flex items-center gap-2"><Link2 className="w-4 h-4" /> Liens sociaux</p>
            <input placeholder="Discord (@pseudo)" value={socialLinks.discord} onChange={(e) => setSocialLinks({ ...socialLinks, discord: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
            <input placeholder="TikTok (@pseudo)" value={socialLinks.tiktok} onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>

          <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
            <p className="font-bold text-amber-800 flex items-center gap-2"><Medal className="w-4 h-4" /> Astuce profil</p>
            <p className="text-sm text-amber-700 mt-1">Ajoute une bio claire + tes liens pour faciliter les interactions dans la section Social.</p>
          </div>
        </div>

        <div className="pt-4">
          <button onClick={handleSave} disabled={saving} className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition disabled:opacity-50">
            {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
          </button>
        </div>
      </div>
    </div>
  );
}
