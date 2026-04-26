"use client";

import { useEffect, useState } from "react";
import { getQuizzlyProfile, updateQuizzlyProfile } from "@/lib/quizzly/actions";
import { toast } from "sonner";
import { Calendar, Link2, Medal } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getUserStatsSnapshot } from "@/lib/user-stats";

const PROFILE_SOCIALS_KEY = "mai.quizzly.profile.socials.v1";
const PROFILE_TITLE_KEY = "mai.quizzly.profile.title.v1";
const UNIQUE_QUEST_KEY = "mai.quizzly.unique-quest.title.v1";

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

type SocialLink = { label: string; url: string };

export default function QuizzlyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pseudo, setPseudo] = useState("");
  const [bio, setBio] = useState("");
  const [emoji, setEmoji] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("Joueur");
  const [unlockedTitles, setUnlockedTitles] = useState<string[]>(["Joueur"]);
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
      const parsed = JSON.parse(raw) as SocialLink[];
      if (Array.isArray(parsed)) {
        setSocialLinks(parsed.slice(0, 5));
      }
    } catch {
      // noop
    }

    const savedTitle = window.localStorage.getItem(PROFILE_TITLE_KEY);
    if (savedTitle) setSelectedTitle(savedTitle);

    const stats = getUserStatsSnapshot();
    const dynamicTitles = ["Joueur"];
    if (stats.badgesUnlocked.includes("b64")) dynamicTitles.push("Apprenti Quiz");
    if (stats.badgesUnlocked.includes("b66")) dynamicTitles.push("Sans Faute");
    if (stats.badgesUnlocked.includes("b68")) dynamicTitles.push("Légende Quizzly");
    if (window.localStorage.getItem(UNIQUE_QUEST_KEY) === "1") {
      dynamicTitles.push("Pionnier Quizzly");
    }
    setUnlockedTitles(Array.from(new Set(dynamicTitles)));
  }, []);

  const handleSave = async () => {
    if (!pseudo.trim() || !emoji.trim()) return toast.error("Le pseudo et l'emoji sont requis.");

    setSaving(true);
    try {
      await updateQuizzlyProfile({ pseudo, bio, emoji });
      window.localStorage.setItem(PROFILE_SOCIALS_KEY, JSON.stringify(socialLinks));
      window.localStorage.setItem(PROFILE_TITLE_KEY, selectedTitle);
      toast.success("Profil mis à jour !");
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return <div className="p-10 text-center animate-pulse">Chargement...</div>;

  const claimUniqueQuest = () => {
    if (profile.level < 5) {
      toast.error("Atteins le niveau 5 pour débloquer cette quête unique.");
      return;
    }
    window.localStorage.setItem(UNIQUE_QUEST_KEY, "1");
    setUnlockedTitles((prev) => Array.from(new Set([...prev, "Pionnier Quizzly"])));
    toast.success("Titre unique débloqué: Pionnier Quizzly");
  };

  const addSocialLink = () => {
    if (socialLinks.length >= 5) {
      toast.error("Maximum 5 liens sociaux.");
      return;
    }
    setSocialLinks((prev) => [...prev, { label: "Nouveau lien", url: "" }]);
  };

  const updateSocialLink = (index: number, patch: Partial<SocialLink>) => {
    setSocialLinks((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const moveSocialLink = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= socialLinks.length) return;
    const copy = [...socialLinks];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setSocialLinks(copy);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

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
            <p className="text-sm font-semibold text-violet-700">{selectedTitle}</p>
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
            <label className="block text-sm font-bold text-slate-700 mb-2">Titre de joueur</label>
            <select value={selectedTitle} onChange={(e) => setSelectedTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200">
              {unlockedTitles.map((title) => <option key={title} value={title}>{title}</option>)}
            </select>
            <button type="button" onClick={claimUniqueQuest} className="mt-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800">
              Quête unique: débloquer “Pionnier Quizzly”
            </button>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Biographie</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 resize-none" />
          </div>

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-3">
            <p className="font-bold text-slate-800 flex items-center gap-2"><Link2 className="w-4 h-4" /> Liens sociaux</p>
            {socialLinks.map((link, index) => (
              <div key={`${index}-${link.label}`} className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-center">
                <input value={link.label} onChange={(e) => updateSocialLink(index, { label: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200" />
                <input value={link.url} onChange={(e) => updateSocialLink(index, { url: e.target.value })} className="px-3 py-2 rounded-lg border border-slate-200" />
                <button type="button" onClick={() => moveSocialLink(index, -1)} className="text-xs px-2 py-1 rounded bg-slate-100">↑</button>
                <button type="button" onClick={() => moveSocialLink(index, 1)} className="text-xs px-2 py-1 rounded bg-slate-100">↓</button>
                <button type="button" onClick={() => removeSocialLink(index)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Suppr.</button>
              </div>
            ))}
            <button type="button" onClick={addSocialLink} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-200">
              Ajouter un lien ({socialLinks.length}/5)
            </button>
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
