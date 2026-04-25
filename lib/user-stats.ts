export type BadgeRarity = "common" | "uncommon" | "rare" | "legendary";

export type BadgeDefinition = {
  id: string;
  category: string;
  name: string;
  emoji: string;
  condition: string;
  rarity: BadgeRarity;
};

export type UserStatsSnapshot = {
  createdAt: string;
  xp: number;
  messagesSent: number;
  votesSubmitted: number;
  imagesGenerated: number;
  musicsGenerated: number;
  webSearches: number;
  projectsCreated: number;
  conversationsCreated: number;
  streakDays: number;
  lastLoginDate: string;
  loginCount: number;
  badgesUnlocked: string[];
};

export const USER_STATS_STORAGE_KEY = "mai.user.stats.v1";
export const USER_STATS_XP_HISTORY_STORAGE_KEY = "mai.user.stats.xp-history.v1";
const MAX_XP_HISTORY_EVENTS = 200;

export type XpHistoryEntry = {
  createdAt: string;
  id: string;
  reason: string;
  xp: number;
};

const toDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const defaultSnapshot = (): UserStatsSnapshot => ({
  createdAt: new Date().toISOString(),
  xp: 0,
  messagesSent: 0,
  votesSubmitted: 0,
  imagesGenerated: 0,
  musicsGenerated: 0,
  webSearches: 0,
  projectsCreated: 0,
  conversationsCreated: 0,
  streakDays: 0,
  lastLoginDate: "",
  loginCount: 0,
  badgesUnlocked: [],
});

export const badgesCatalog: BadgeDefinition[] = [
  { id: "b01", category: "💬 Conversation & Chat", name: "Premier Mot", emoji: "🐣", condition: "Envoyer son tout premier message", rarity: "common" },
  { id: "b02", category: "💬 Conversation & Chat", name: "Bavard", emoji: "💬", condition: "Envoyer 100 messages au total", rarity: "uncommon" },
  { id: "b03", category: "💬 Conversation & Chat", name: "Marathonien", emoji: "🏃", condition: "Envoyer 1 000 messages au total", rarity: "rare" },
  { id: "b04", category: "💬 Conversation & Chat", name: "Légende Vivante", emoji: "👑", condition: "Envoyer 10 000 messages au total", rarity: "legendary" },
  { id: "b05", category: "💬 Conversation & Chat", name: "Romancier", emoji: "📖", condition: "Envoyer un prompt de plus de 500 mots", rarity: "uncommon" },
  { id: "b06", category: "💬 Conversation & Chat", name: "Feedback King", emoji: "⭐", condition: "Donner 50 avis IA", rarity: "uncommon" },
  { id: "b07", category: "🤖 Modèles IA", name: "Curieux", emoji: "🔬", condition: "Essayer 3 modèles IA différents", rarity: "common" },
  { id: "b08", category: "🤖 Modèles IA", name: "Collectionneur", emoji: "🃏", condition: "Utiliser tous les modèles IA", rarity: "rare" },
  { id: "b09", category: "🤖 Modèles IA", name: "Fidèle", emoji: "💎", condition: "500 messages avec le même modèle", rarity: "rare" },
  { id: "b10", category: "🤖 Modèles IA", name: "Penseur Profond", emoji: "🧠", condition: "Utiliser réflexion approfondie", rarity: "uncommon" },
  { id: "b11", category: "🎨 Création — Studio / Images", name: "Artiste en Herbe", emoji: "🎨", condition: "Première image Studio", rarity: "common" },
  { id: "b12", category: "🎨 Création — Studio / Images", name: "Galerie Perso", emoji: "🖼️", condition: "50 images Studio", rarity: "uncommon" },
  { id: "b13", category: "🎨 Création — Studio / Images", name: "Visionnaire", emoji: "👁️", condition: "200 images Studio", rarity: "rare" },
  { id: "b14", category: "🎨 Création — Studio / Images", name: "Architecte", emoji: "🏗️", condition: "Premier artifact", rarity: "common" },
  { id: "b15", category: "🎨 Création — Studio / Images", name: "Usine à Artifacts", emoji: "🏭", condition: "100 artifacts", rarity: "rare" },
  { id: "b16", category: "📁 Projets & Organisation", name: "Chef de Projet", emoji: "📋", condition: "Créer son premier projet", rarity: "common" },
  { id: "b17", category: "📁 Projets & Organisation", name: "Empire", emoji: "🏰", condition: "10 projets actifs", rarity: "uncommon" },
  { id: "b18", category: "📁 Projets & Organisation", name: "Bibliothécaire", emoji: "📚", condition: "Ajouter 20 fichiers", rarity: "uncommon" },
  { id: "b19", category: "📁 Projets & Organisation", name: "Archiviste", emoji: "🗂️", condition: "10 favoris bibliothèque", rarity: "uncommon" },
  { id: "b20", category: "🔥 Streaks & Fidélité", name: "Flamme Naissante", emoji: "🔥", condition: "Streak 7 jours", rarity: "common" },
  { id: "b21", category: "🔥 Streaks & Fidélité", name: "Inarrêtable", emoji: "☄️", condition: "Streak 30 jours", rarity: "rare" },
  { id: "b22", category: "🔥 Streaks & Fidélité", name: "Machine", emoji: "🤖", condition: "Streak 100 jours", rarity: "legendary" },
  { id: "b23", category: "🔥 Streaks & Fidélité", name: "Vétéran", emoji: "🎖️", condition: "Compte actif 6 mois", rarity: "uncommon" },
  { id: "b24", category: "🔥 Streaks & Fidélité", name: "OG", emoji: "🏅", condition: "Compte créé avant v2.0", rarity: "legendary" },
  { id: "b25", category: "🔍 Recherche & Extensions", name: "Détective", emoji: "🔍", condition: "Première recherche web", rarity: "common" },
  { id: "b26", category: "🔍 Recherche & Extensions", name: "Chercheur Pro", emoji: "🧪", condition: "100 recherches web", rarity: "rare" },
  { id: "b27", category: "🔍 Recherche & Extensions", name: "Extensionneur", emoji: "🧩", condition: "3 extensions différentes", rarity: "uncommon" },
  { id: "b28", category: "🌙 Secrets & Easter Eggs", name: "Noctambule", emoji: "🦉", condition: "Message entre 2h et 5h", rarity: "rare" },
  { id: "b29", category: "🌙 Secrets & Easter Eggs", name: "Fantôme", emoji: "👻", condition: "Mode Ghost 20 fois", rarity: "uncommon" },
  { id: "b30", category: "🌙 Secrets & Easter Eggs", name: "Hello World", emoji: "👋", condition: "Dire Hello World / Bonjour mAI", rarity: "rare" },
  { id: "b31", category: "🧠 Prompts & Qualité", name: "Prompt Clair", emoji: "✍️", condition: "Prompt avec 3 consignes", rarity: "common" },
  { id: "b32", category: "🧠 Prompts & Qualité", name: "Ingénieur de Prompt", emoji: "🛠️", condition: "25 prompts >100 mots", rarity: "uncommon" },
  { id: "b33", category: "🧠 Prompts & Qualité", name: "Maître du Contexte", emoji: "🧵", condition: "Conversation >50 messages", rarity: "uncommon" },
  { id: "b34", category: "🧠 Prompts & Qualité", name: "Nouveau Départ", emoji: "🔄", condition: "20 nouvelles conversations", rarity: "common" },
  { id: "b35", category: "🧠 Prompts & Qualité", name: "Perfectionniste", emoji: "🧽", condition: "50 reformulations", rarity: "uncommon" },
  { id: "b36", category: "🧠 Prompts & Qualité", name: "Sensei du Prompt", emoji: "🥋", condition: "100 prompts longs", rarity: "rare" },
  { id: "b37", category: "📄 Travail & Productivité", name: "Résumeur", emoji: "📌", condition: "Premier résumé", rarity: "common" },
  { id: "b38", category: "📄 Travail & Productivité", name: "Synthèse Express", emoji: "⚡", condition: "50 résumés", rarity: "uncommon" },
  { id: "b39", category: "📄 Travail & Productivité", name: "Tableur Magique", emoji: "📊", condition: "Premier sheet", rarity: "rare" },
  { id: "b40", category: "📄 Travail & Productivité", name: "Codeur Junior", emoji: "💻", condition: "Premier code généré", rarity: "common" },
  { id: "b41", category: "📄 Travail & Productivité", name: "Debugger", emoji: "🐞", condition: "25 corrections de code", rarity: "uncommon" },
  { id: "b42", category: "📄 Travail & Productivité", name: "Full Stack mAI", emoji: "🧱", condition: "Code dans 5 langages", rarity: "rare" },
  { id: "b43", category: "📄 Travail & Productivité", name: "Assistant Personnel", emoji: "🗓️", condition: "10 plannings/todo/plans", rarity: "rare" },
  { id: "b44", category: "🌊 Wave / Voix / Audio", name: "Première Onde", emoji: "🌊", condition: "Utiliser Wave une fois", rarity: "common" },
  { id: "b45", category: "🌊 Wave / Voix / Audio", name: "Voix Active", emoji: "🎙️", condition: "50 messages vocaux", rarity: "uncommon" },
  { id: "b46", category: "🌊 Wave / Voix / Audio", name: "Transcripteur", emoji: "📝", condition: "10 transcriptions audio", rarity: "uncommon" },
  { id: "b47", category: "🌊 Wave / Voix / Audio", name: "Podcast Maker", emoji: "🎧", condition: "10 scripts audio", rarity: "rare" },
  { id: "b48", category: "🎭 Humanizy & Personnalisation", name: "Caméléon", emoji: "🦎", condition: "5 tons/styles", rarity: "uncommon" },
  { id: "b49", category: "🎭 Humanizy & Personnalisation", name: "Humanizer", emoji: "✨", condition: "Première utilisation Humanizy", rarity: "common" },
  { id: "b50", category: "🎭 Humanizy & Personnalisation", name: "Plume Naturelle", emoji: "🪶", condition: "50 textes humanisés", rarity: "uncommon" },
  { id: "b51", category: "🎭 Humanizy & Personnalisation", name: "Signature Personnelle", emoji: "🖋️", condition: "Premier style personnalisé", rarity: "rare" },
  { id: "b52", category: "🎭 Humanizy & Personnalisation", name: "Persona Master", emoji: "🎭", condition: "10 personas/modes", rarity: "rare" },
  { id: "b53", category: "🧪 Exploration & Outils", name: "Testeur Curieux", emoji: "🧪", condition: "Essayer une nouvelle fonctionnalité", rarity: "common" },
  { id: "b54", category: "🧪 Exploration & Outils", name: "Explorateur", emoji: "🧭", condition: "10 fonctionnalités différentes", rarity: "uncommon" },
  { id: "b55", category: "🧪 Exploration & Outils", name: "Mixeur", emoji: "🔀", condition: "3 outils dans une conversation", rarity: "rare" },
  { id: "b56", category: "🧪 Exploration & Outils", name: "Polyvalent", emoji: "🧰", condition: "Chat+Studio+Web+fichiers+projets sur 7 jours", rarity: "uncommon" },
  { id: "b57", category: "🏆 Challenges & Progression", name: "Week-end Warrior", emoji: "🛡️", condition: "Message samedi et dimanche", rarity: "common" },
  { id: "b58", category: "🏆 Challenges & Progression", name: "Sprint 24h", emoji: "⏱️", condition: "50 messages en 24h", rarity: "uncommon" },
  { id: "b59", category: "🏆 Challenges & Progression", name: "Grand Sage", emoji: "🧙", condition: "1 000 conversations", rarity: "legendary" },
  { id: "b60", category: "🏆 Challenges & Progression", name: "Constellation", emoji: "🌌", condition: "Débloquer 50 badges", rarity: "legendary" },
];

const rarityOrder: BadgeRarity[] = ["common", "uncommon", "rare", "legendary"];

export function getUserStatsSnapshot(): UserStatsSnapshot {
  if (typeof window === "undefined") {
    return defaultSnapshot();
  }
  try {
    const raw = window.localStorage.getItem(USER_STATS_STORAGE_KEY);
    if (!raw) return defaultSnapshot();
    return { ...defaultSnapshot(), ...(JSON.parse(raw) as Partial<UserStatsSnapshot>) };
  } catch {
    return defaultSnapshot();
  }
}

export function saveUserStatsSnapshot(snapshot: UserStatsSnapshot) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(USER_STATS_STORAGE_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new CustomEvent("mai:stats-updated"));
}

export function getXpHistory(): XpHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(USER_STATS_XP_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as XpHistoryEntry[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            typeof item?.id === "string" &&
            typeof item?.createdAt === "string" &&
            typeof item?.reason === "string" &&
            typeof item?.xp === "number"
        )
      : [];
  } catch {
    return [];
  }
}

export function saveXpHistory(entries: XpHistoryEntry[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    USER_STATS_XP_HISTORY_STORAGE_KEY,
    JSON.stringify(entries.slice(0, MAX_XP_HISTORY_EVENTS))
  );
  window.dispatchEvent(new CustomEvent("mai:stats-updated"));
}

function appendXpHistory(reason: string, xp: number, createdAt = new Date().toISOString()) {
  if (xp <= 0) {
    return;
  }
  const history = getXpHistory();
  const entry: XpHistoryEntry = {
    createdAt,
    id: `${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    reason,
    xp,
  };
  saveXpHistory([entry, ...history]);
}

export function getXpForNextLevel(level: number): number {
  if (level <= 10) {
    return 150;
  }
  return 150 + (level - 10) * 10;
}

export function getLevelFromXp(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number } {
  let level = 1;
  let remaining = Math.max(0, xp);
  let requirement = getXpForNextLevel(level);

  while (remaining >= requirement) {
    remaining -= requirement;
    level += 1;
    requirement = getXpForNextLevel(level);
  }

  return { level, currentLevelXp: remaining, nextLevelXp: requirement };
}

function evaluateUnlockedBadgeIds(snapshot: UserStatsSnapshot): string[] {
  const unlocked = new Set(snapshot.badgesUnlocked);

  const unlockIf = (id: string, condition: boolean) => {
    if (condition) unlocked.add(id);
  };

  unlockIf("b01", snapshot.messagesSent >= 1);
  unlockIf("b02", snapshot.messagesSent >= 100);
  unlockIf("b03", snapshot.messagesSent >= 1000);
  unlockIf("b04", snapshot.messagesSent >= 10000);
  unlockIf("b06", snapshot.votesSubmitted >= 50);
  unlockIf("b11", snapshot.imagesGenerated >= 1);
  unlockIf("b12", snapshot.imagesGenerated >= 50);
  unlockIf("b13", snapshot.imagesGenerated >= 200);
  unlockIf("b16", snapshot.projectsCreated >= 1);
  unlockIf("b20", snapshot.streakDays >= 7);
  unlockIf("b21", snapshot.streakDays >= 30);
  unlockIf("b22", snapshot.streakDays >= 100);
  unlockIf("b25", snapshot.webSearches >= 1);
  unlockIf("b26", snapshot.webSearches >= 100);
  unlockIf("b34", snapshot.conversationsCreated >= 20);
  unlockIf("b44", snapshot.musicsGenerated >= 1);

  if (unlocked.size >= 50) {
    unlocked.add("b60");
  }

  return badgesCatalog
    .map((badge) => badge.id)
    .filter((id) => unlocked.has(id));
}

export function syncDailyLoginBonus(snapshot: UserStatsSnapshot): UserStatsSnapshot {
  const today = toDateKey();
  if (snapshot.lastLoginDate === today) {
    return snapshot;
  }

  const next = { ...snapshot };
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  next.streakDays = next.lastLoginDate === yesterdayKey ? next.streakDays + 1 : 1;
  next.loginCount += 1;
  next.lastLoginDate = today;
  const loginXp = 10 + (next.loginCount - 1);
  next.xp += loginXp;
  appendXpHistory("Connexion quotidienne", loginXp);

  return applyBadgeRewards(next);
}

export function applyBadgeRewards(snapshot: UserStatsSnapshot): UserStatsSnapshot {
  const evaluated = evaluateUnlockedBadgeIds(snapshot);
  const previous = new Set(snapshot.badgesUnlocked);
  const newBadges = evaluated.filter((id) => !previous.has(id));
  const badgeXpGain = newBadges.reduce((total, badgeId) => {
    const badge = badgesCatalog.find((item) => item.id === badgeId);
    return total + getBadgeXpByRarity(badge?.rarity ?? "common");
  }, 0);

  for (const badgeId of newBadges) {
    const badge = badgesCatalog.find((item) => item.id === badgeId);
    if (!badge) {
      continue;
    }
    appendXpHistory(
      `Badge débloqué : ${badge.emoji} ${badge.name} (${getBadgeRarityLabel(badge.rarity)})`,
      getBadgeXpByRarity(badge.rarity)
    );
  }

  return {
    ...snapshot,
    badgesUnlocked: evaluated,
    xp: snapshot.xp + badgeXpGain,
  };
}

export function addStatsEvent(
  event: "message" | "vote" | "image" | "music" | "websearch" | "project" | "conversation",
  amount = 1
): UserStatsSnapshot {
  const snapshot = getUserStatsSnapshot();
  const next = { ...snapshot };

  if (event === "message") {
    next.messagesSent += amount;
    const gainedXp = amount * 5;
    next.xp += gainedXp;
    appendXpHistory("Message envoyé", gainedXp);
  }
  if (event === "vote") {
    next.votesSubmitted += amount;
    const gainedXp = amount * 3;
    next.xp += gainedXp;
    appendXpHistory("Vote envoyé", gainedXp);
  }
  if (event === "image") {
    next.imagesGenerated += amount;
    const gainedXp = amount * 10;
    next.xp += gainedXp;
    appendXpHistory("Image générée (Studio)", gainedXp);
  }
  if (event === "music") {
    next.musicsGenerated += amount;
    const gainedXp = amount * 20;
    next.xp += gainedXp;
    appendXpHistory("Musique générée (Wave)", gainedXp);
  }
  if (event === "websearch") {
    next.webSearches += amount;
  }
  if (event === "project") {
    next.projectsCreated += amount;
  }
  if (event === "conversation") {
    next.conversationsCreated += amount;
  }

  const rewarded = applyBadgeRewards(next);
  saveUserStatsSnapshot(rewarded);
  return rewarded;
}

export function getLevelRewards(level: number) {
  return {
    tier3Bonus: level,
    tier2Bonus: Math.floor(level / 5),
    tier3MilestoneBonus: Math.floor(level / 10),
    webSearchBonus: Math.floor(level / 20),
    imageBonus: Math.floor(level / 30),
    musicBonus: Math.floor(level / 50),
  };
}

export function getBadgeRarityLabel(rarity: BadgeRarity) {
  if (rarity === "common") return "⬜ Commun";
  if (rarity === "uncommon") return "🟦 Peu commun";
  if (rarity === "rare") return "🟪 Rare";
  return "🟨 Légendaire";
}

export function getBadgeRarityOrder(rarity: BadgeRarity) {
  return rarityOrder.indexOf(rarity);
}

export function getBadgeXpByRarity(rarity: BadgeRarity): number {
  if (rarity === "common") return 100;
  if (rarity === "uncommon") return 200;
  if (rarity === "rare") return 300;
  return 500;
}
