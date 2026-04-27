"use server";

import { db } from "@/lib/db/queries";
import { getSubscriptionPlan } from "@/lib/db/queries";
import { auth } from "@/app/(auth)/auth";
import {
  quizzlyProfile,
  quizzlyFriendship,
  quizzlyInventory,
  quizzlyUserQuest,
} from "@/lib/db/schema";
import { eq, and, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import dailyQuestsRaw from "./quests/daily-quests.json";
import weeklyQuestsRaw from "./quests/weekly-quests.json";

async function getAuthenticatedUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

function buildReferralCodeFromUserId(userId: string) {
  return `QZ-${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

async function ensureReferralCode(userId: string) {
  const code = buildReferralCodeFromUserId(userId);
  await upsertInventoryItem(userId, `referral:code:${code}`, 1);
  return code;
}

const REFERRAL_TIERS = [
  { referrals: 3, key: "tier-3", label: "Palier 3 filleuls", rewardsLabel: "+30💎" },
  { referrals: 5, key: "tier-5", label: "Palier 5 filleuls", rewardsLabel: "Avatar Recruteur + badge bronze Ambassadeur" },
  { referrals: 10, key: "tier-10", label: "Palier 10 filleuls", rewardsLabel: "Titre Ambassadeur Quizzly + badge argent" },
  { referrals: 20, key: "tier-20", label: "Palier 20 filleuls", rewardsLabel: "Thème exclusif Ambassadeur" },
  { referrals: 50, key: "tier-50", label: "Palier 50 filleuls", rewardsLabel: "Badge Grand Ambassadeur +100💎 +3⭐" },
] as const;

function getDateKey(date = new Date()) {
  return date.toISOString().split("T")[0] ?? "";
}

function getDiffInDays(from: string, to: string) {
  if (!from || !to) return 0;
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T00:00:00.000Z`);
  const diffMs = toDate.getTime() - fromDate.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

function getWeekKey(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

async function updateFriendStreaksForUser(userId: string) {
  const today = getDateKey();
  const friendships = await db
    .select()
    .from(quizzlyFriendship)
    .where(
      and(
        eq(quizzlyFriendship.status, "accepted"),
        or(eq(quizzlyFriendship.userId, userId), eq(quizzlyFriendship.friendId, userId))
      )
    );

  const friendIds = friendships.map((item) => (item.userId === userId ? item.friendId : item.userId));
  for (const friendId of friendIds) {
    const myPlayMarker = `friend-play:${friendId}:${today}`;
    const friendPlayMarker = `friend-play:${userId}:${today}`;
    const countedMarker = `friend-streak-counted:${friendId}:${today}`;
    await upsertInventoryItem(userId, myPlayMarker, 1);

    const [friendPlayed] = await db
      .select()
      .from(quizzlyInventory)
      .where(and(eq(quizzlyInventory.userId, friendId), eq(quizzlyInventory.itemKey, friendPlayMarker)));
    if (!friendPlayed) continue;

    const [alreadyCounted] = await db
      .select()
      .from(quizzlyInventory)
      .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, countedMarker)));
    if (alreadyCounted) continue;

    await upsertInventoryItem(userId, `friend-streak:${friendId}`, 1);
    await upsertInventoryItem(friendId, `friend-streak:${userId}`, 1);
    await upsertInventoryItem(userId, countedMarker, 1);
    await upsertInventoryItem(friendId, `friend-streak-counted:${userId}:${today}`, 1);
  }
}

export async function getQuizzlyProfile() {
  const userId = await getAuthenticatedUserId();

  const [profile] = await db
    .select()
    .from(quizzlyProfile)
    .where(eq(quizzlyProfile.userId, userId));

  if (!profile) {
    const [newProfile] = await db.insert(quizzlyProfile).values({ userId }).returning();
    await ensureReferralCode(userId);
    return newProfile;
  }

  await ensureReferralCode(userId);

  return profile;
}

export async function updateQuizzlyProfile(data: Partial<typeof quizzlyProfile.$inferInsert>) {
  const userId = await getAuthenticatedUserId();

  await db
    .update(quizzlyProfile)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(quizzlyProfile.userId, userId));

  revalidatePath("/(chat)/quizzly", "layout");
}

async function upsertInventoryItem(userId: string, itemKey: string, amount: number) {
  if (amount === 0) return;
  const [existingItem] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, itemKey)));

  if (existingItem) {
    await db
      .update(quizzlyInventory)
      .set({ quantity: Math.max(0, existingItem.quantity + amount), updatedAt: new Date() })
      .where(eq(quizzlyInventory.id, existingItem.id));
    return;
  }

  await db.insert(quizzlyInventory).values({
    userId,
    itemKey,
    quantity: Math.max(0, amount),
  });
}

async function setInventoryMax(userId: string, itemKey: string, value: number) {
  const [existingItem] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, itemKey)));

  if (existingItem) {
    if (value <= existingItem.quantity) return;
    await db
      .update(quizzlyInventory)
      .set({ quantity: value, updatedAt: new Date() })
      .where(eq(quizzlyInventory.id, existingItem.id));
    return;
  }

  await db.insert(quizzlyInventory).values({ userId, itemKey, quantity: Math.max(0, value) });
}

async function setInventoryMin(userId: string, itemKey: string, value: number) {
  const [existingItem] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, itemKey)));

  if (existingItem) {
    if (existingItem.quantity > 0 && value >= existingItem.quantity) return;
    await db
      .update(quizzlyInventory)
      .set({ quantity: Math.max(0, value), updatedAt: new Date() })
      .where(eq(quizzlyInventory.id, existingItem.id));
    return;
  }

  await db.insert(quizzlyInventory).values({ userId, itemKey, quantity: Math.max(0, value) });
}

type QuizzlyPassRewardType =
  | "diamonds"
  | "stars"
  | "booster_x1.5"
  | "booster_x2"
  | "shield_1d"
  | "shield_3d"
  | "theme"
  | "effect";

type QuizzlyPassRewardInput = {
  tier: number;
  monthKey: string;
  rewardType: QuizzlyPassRewardType;
  value: number;
};

export async function getClaimedPassRewards(monthKey: string) {
  const userId = await getAuthenticatedUserId();
  const tiers = await db
    .select()
    .from(quizzlyInventory)
    .where(
      and(
        eq(quizzlyInventory.userId, userId),
        like(quizzlyInventory.itemKey, `pass:${monthKey}:tier:%`)
      )
    );

  return tiers
    .map((item) => {
      const match = item.itemKey.match(/pass:[^:]+:tier:(\d+)/);
      return match ? Number(match[1]) : null;
    })
    .filter((tier): tier is number => Number.isInteger(tier))
    .sort((a, b) => a - b);
}

export async function claimQuizzlyPassReward(input: QuizzlyPassRewardInput) {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();
  const claimTierKey = `pass:${input.monthKey}:tier:${input.tier}`;

  const [alreadyClaimed] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, claimTierKey)));
  if (alreadyClaimed) {
    throw new Error("Récompense du Pass déjà réclamée.");
  }

  const isProTier = input.tier >= 100;
  const requiredXp = isProTier ? (input.tier - 100) * 180 : input.tier * 120;
  if (profile.xp < requiredXp) {
    throw new Error("XP insuffisante pour ce palier.");
  }

  if (isProTier) {
    const session = await auth();
    const plan = session?.user?.id ? await getSubscriptionPlan(session.user.id) : "guest";
    const hasProAccess = plan === "max" || (await hasQuizzlyPassProAccess());
    if (!hasProAccess) {
      throw new Error("Pass Pro requis pour ce palier.");
    }
  }

  if (input.rewardType === "diamonds") {
    await updateQuizzlyProfile({ diamonds: profile.diamonds + input.value });
  } else if (input.rewardType === "stars") {
    await updateQuizzlyProfile({ stars: profile.stars + input.value });
  } else if (
    input.rewardType === "booster_x1.5" ||
    input.rewardType === "booster_x2" ||
    input.rewardType === "shield_1d" ||
    input.rewardType === "shield_3d"
  ) {
    await upsertInventoryItem(userId, input.rewardType, Math.max(1, input.value));
  } else if (input.rewardType === "theme") {
    await upsertInventoryItem(userId, `theme:premium:${input.tier}`, 1);
  } else if (input.rewardType === "effect") {
    await upsertInventoryItem(userId, `effect:premium:${input.tier}`, 1);
  }

  await upsertInventoryItem(userId, claimTierKey, 1);

  return { success: true };
}

export async function hasQuizzlyPassProAccess() {
  const userId = await getAuthenticatedUserId();
  const [unlockItem] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, "pass-pro-unlock")));
  return Boolean(unlockItem && unlockItem.quantity > 0);
}

export async function unlockQuizzlyPassProWithDiamonds() {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();
  const hasAccess = await hasQuizzlyPassProAccess();
  if (hasAccess) {
    return { success: true };
  }

  if (profile.diamonds < 500) {
    throw new Error("Diamants insuffisants pour débloquer le Pass Pro.");
  }

  await updateQuizzlyProfile({ diamonds: profile.diamonds - 500 });
  await upsertInventoryItem(userId, "pass-pro-unlock", 1);
  return { success: true };
}

export async function claimDailyReward() {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();
  const today = getDateKey();
  const markerKey = `daily-reward:${today}`;

  const [alreadyClaimed] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, markerKey)));

  if (alreadyClaimed) {
    return {
      success: false,
      message: "Déjà réclamé aujourd'hui !",
      redirectTo: "/quizzly/boutique?focus=daily-free",
    };
  }

  const rewardDiamonds = 10;

  await updateQuizzlyProfile({
    diamonds: profile.diamonds + rewardDiamonds,
  });

  await upsertInventoryItem(userId, markerKey, 1);

  return {
    success: true,
    reward: rewardDiamonds,
    redirectTo: "/quizzly/boutique?focus=daily-free",
  };
}

export async function getQuizzlyInventory() {
  const userId = await getAuthenticatedUserId();

  return await db.select().from(quizzlyInventory).where(eq(quizzlyInventory.userId, userId));
}

export async function getFriendStreaks() {
  const userId = await getAuthenticatedUserId();
  const friendships = await db
    .select()
    .from(quizzlyFriendship)
    .where(
      and(
        eq(quizzlyFriendship.status, "accepted"),
        or(eq(quizzlyFriendship.userId, userId), eq(quizzlyFriendship.friendId, userId))
      )
    );
  const friendIds = friendships.map((item) => (item.userId === userId ? item.friendId : item.userId));
  if (friendIds.length === 0) {
    return [];
  }
  const profiles = await db.select().from(quizzlyProfile).where(or(...friendIds.map((id) => eq(quizzlyProfile.userId, id))));
  const streakItems = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), like(quizzlyInventory.itemKey, "friend-streak:%")));

  const streakByFriendId = Object.fromEntries(
    streakItems.map((item) => [item.itemKey.replace("friend-streak:", ""), item.quantity])
  );
  return profiles.map((profile) => ({
    pseudo: profile.pseudo,
    streak: streakByFriendId[profile.userId] ?? 0,
  }));
}

export async function spinWheelOfFortune() {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();
  const weekKey = getWeekKey();
  const weeklySpinKey = `wheel-spin:${weekKey}`;
  const [alreadySpunThisWeek] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, weeklySpinKey)));
  if (alreadySpunThisWeek) {
    throw new Error("Roue déjà utilisée cette semaine. Reviens la semaine prochaine.");
  }

  const cost = 10;
  if (profile.diamonds < cost) {
    throw new Error("Pas assez de diamants pour tourner la roue.");
  }

  const rewards = [0, 5, 10, 15, 25, 50, 75, 100] as const;
  const result = rewards[Math.floor(Math.random() * rewards.length)] ?? 0;

  await updateQuizzlyProfile({
    diamonds: profile.diamonds - cost + result,
  });
  await upsertInventoryItem(userId, weeklySpinKey, 1);
  await upsertInventoryItem(userId, "stats:diamonds-spent", cost);
  await upsertInventoryItem(userId, "stats:diamonds-earned", result);

  return { cost, isJackpot: result === 100, result, success: true, weekKey };
}

export async function claimComebackReward() {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();
  const today = getDateKey();
  const daysAway = profile.lastClaimDay ? getDiffInDays(profile.lastClaimDay, today) : 0;

  let reward = 0;
  if (daysAway >= 50) reward = 50;
  else if (daysAway >= 25) reward = 30;
  else if (daysAway >= 15) reward = 25;
  else if (daysAway >= 10) reward = 15;

  if (reward <= 0) {
    return { daysAway, reward: 0, success: false };
  }

  const rewardKey = `comeback:${today}`;
  const [alreadyClaimed] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, rewardKey)));

  if (alreadyClaimed) {
    return { daysAway, reward: 0, success: false };
  }

  await updateQuizzlyProfile({ diamonds: profile.diamonds + reward });
  await upsertInventoryItem(userId, rewardKey, 1);
  await upsertInventoryItem(userId, "stats:diamonds-earned", reward);
  return { daysAway, reward, success: true };
}

export async function claimOnboardingWelcomePack() {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();
  const marker = "onboarding:welcome-pack:claimed";

  const [alreadyClaimed] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, marker)));

  if (alreadyClaimed && alreadyClaimed.quantity > 0) {
    await upsertInventoryItem(userId, "onboarding:tutorial-completed", 1);
    return { claimed: false, reward: { diamonds: 0, booster: 0, title: "Nouveau venu" } };
  }

  await updateQuizzlyProfile({ diamonds: profile.diamonds + 50 });
  await upsertInventoryItem(userId, "booster_x1.5", 1);
  await upsertInventoryItem(userId, "title:nouveau-venu", 1);
  await upsertInventoryItem(userId, "stats:diamonds-earned", 50);
  await upsertInventoryItem(userId, marker, 1);
  await upsertInventoryItem(userId, "onboarding:tutorial-completed", 1);

  return { claimed: true, reward: { diamonds: 50, booster: 1, title: "Nouveau venu" } };
}

type LeaderboardEntry = {
  userId: string;
  pseudo: string;
  emoji: string;
  weeklyXp: number;
};

export async function getWeeklyLeaderboard(view: "global" | "friends" = "global") {
  const userId = await getAuthenticatedUserId();
  const weekKey = getWeekKey();
  const marker = `weekly-xp:${weekKey}`;

  const profiles = await db.select().from(quizzlyProfile);
  const xpRows = await db.select().from(quizzlyInventory).where(like(quizzlyInventory.itemKey, `weekly-xp:%`));

  const weeklyXpByUser = new Map<string, number>();
  for (const row of xpRows) {
    if (row.itemKey !== marker) continue;
    weeklyXpByUser.set(row.userId, row.quantity);
  }

  let allowed = new Set<string>(profiles.map((p) => p.userId));
  if (view === "friends") {
    const friendships = await db
      .select()
      .from(quizzlyFriendship)
      .where(and(eq(quizzlyFriendship.status, "accepted"), eq(quizzlyFriendship.userId, userId)));
    allowed = new Set<string>([userId, ...friendships.map((f) => f.friendId)]);
  }

  const entries: LeaderboardEntry[] = profiles
    .filter((profile) => allowed.has(profile.userId))
    .map((profile) => ({
      userId: profile.userId,
      pseudo: profile.pseudo,
      emoji: profile.emoji,
      weeklyXp: weeklyXpByUser.get(profile.userId) ?? 0,
    }))
    .sort((a, b) => b.weeklyXp - a.weeklyXp)
    .slice(0, 50);

  return { entries, weekKey };
}

export async function buyItem(itemKey: string, price: number, amount = 1) {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();

  if (profile.diamonds < price) {
    throw new Error("Pas assez de diamants");
  }

  await updateQuizzlyProfile({ diamonds: profile.diamonds - price });
  await upsertInventoryItem(userId, itemKey, amount);

  revalidatePath("/(chat)/quizzly/boutique");
  return { success: true };
}

export async function spendHintDiamonds(cost: number, hintType: "fifty" | "first_letter" | "contextual") {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();
  const normalizedCost = Math.max(1, Math.floor(cost));

  if (profile.diamonds < normalizedCost) {
    throw new Error("Pas assez de diamants pour utiliser cet indice.");
  }

  await updateQuizzlyProfile({ diamonds: profile.diamonds - normalizedCost });
  await upsertInventoryItem(userId, "stats:diamonds-spent", normalizedCost);
  await upsertInventoryItem(userId, "stats:hints-used", 1);
  await upsertInventoryItem(userId, `stats:hints-used:${hintType}`, 1);

  return {
    cost: normalizedCost,
    diamondsLeft: profile.diamonds - normalizedCost,
    success: true,
  };
}

type LocalMigrationPayload = {
  level?: number;
  diamonds?: number;
  quizzesPlayed?: number;
  badgesCount?: number;
};

export async function migrateLocalQuizzlyProgress(payload: LocalMigrationPayload) {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();

  const level = Math.max(profile.level, Number(payload.level ?? profile.level));
  const diamonds = Math.max(profile.diamonds, Number(payload.diamonds ?? profile.diamonds));
  await updateQuizzlyProfile({ level, diamonds });

  const quizzesPlayed = Math.max(0, Number(payload.quizzesPlayed ?? 0));
  const badgesCount = Math.max(0, Number(payload.badgesCount ?? 0));
  if (quizzesPlayed > 0) await setInventoryMax(userId, "stats:quizzes-played", quizzesPlayed);
  if (badgesCount > 0) await setInventoryMax(userId, "badges:count", badgesCount);
  await upsertInventoryItem(userId, "migration:local-to-cloud:done", 1);

  return { success: true };
}

export async function getOrAssignQuests() {
  const userId = await getAuthenticatedUserId();

  const activeQuests = await db
    .select()
    .from(quizzlyUserQuest)
    .where(and(eq(quizzlyUserQuest.userId, userId), eq(quizzlyUserQuest.isCompleted, false)));

  const now = new Date();

  const activeDaily = activeQuests.filter((q) => q.type === "daily" && new Date(q.expiresAt) > now);
  const activeWeekly = activeQuests.filter((q) => q.type === "weekly" && new Date(q.expiresAt) > now);

  if (activeDaily.length === 0) {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    for (let i = 0; i < 3; i++) {
      const q = dailyQuestsRaw[Math.floor(Math.random() * dailyQuestsRaw.length)];
      await db.insert(quizzlyUserQuest).values({
        userId,
        questId: q.id,
        type: "daily",
        expiresAt: endOfDay,
      });
    }
  }

  if (activeWeekly.length === 0) {
    const endOfWeek = new Date();
    const daysUntilMonday = (1 - endOfWeek.getDay() + 7) % 7 || 7;
    endOfWeek.setDate(endOfWeek.getDate() + daysUntilMonday);
    endOfWeek.setHours(23, 59, 59, 999);

    for (let i = 0; i < 3; i++) {
      const q = weeklyQuestsRaw[Math.floor(Math.random() * weeklyQuestsRaw.length)];
      await db.insert(quizzlyUserQuest).values({
        userId,
        questId: q.id,
        type: "weekly",
        expiresAt: endOfWeek,
      });
    }
  }

  return await db
    .select()
    .from(quizzlyUserQuest)
    .where(and(eq(quizzlyUserQuest.userId, userId), eq(quizzlyUserQuest.isCompleted, false)));
}

export async function claimQuestReward(userQuestId: string) {
  const userId = await getAuthenticatedUserId();
  const [quest] = await db
    .select()
    .from(quizzlyUserQuest)
    .where(and(eq(quizzlyUserQuest.id, userQuestId), eq(quizzlyUserQuest.userId, userId)));

  if (!quest) {
    throw new Error("Quête introuvable.");
  }

  if (quest.isCompleted) {
    throw new Error("Cette quête est déjà récupérée.");
  }

  const pool = quest.type === "daily" ? dailyQuestsRaw : weeklyQuestsRaw;
  const meta = pool.find((item) => item.id === quest.questId);
  if (!meta) {
    throw new Error("Métadonnées de quête introuvables.");
  }

  const isCompletedByProgress = quest.progress >= meta.target;
  if (!isCompletedByProgress) {
    throw new Error("Cette quête n'est pas encore terminée.");
  }

  const xpGain = Math.max(20, Math.floor(meta.rewardDiamonds * 4));
  const profile = await getQuizzlyProfile();

  await db
    .update(quizzlyUserQuest)
    .set({ isCompleted: true })
    .where(eq(quizzlyUserQuest.id, quest.id));

  await updateQuizzlyProfile({
    xp: profile.xp + xpGain,
  });

  return { diamonds: 0, xp: xpGain, success: true };
}

export async function finishQuiz(
  correctAnswers: number,
  activeBooster: string | null,
  completionSeconds?: number | null
) {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();

  let xpGain = correctAnswers * 2;

  if (activeBooster === "booster_x1.5") xpGain = Math.round(xpGain * 1.5);
  else if (activeBooster === "booster_x2") xpGain = Math.round(xpGain * 2);
  else if (activeBooster === "booster_x3") xpGain = Math.round(xpGain * 3);

  let newXp = profile.xp + xpGain;
  let newLevel = profile.level;
  let nextLevelRequirement = newLevel * 100;
  let levelUps = 0;
  let bonusDiamonds = 0;

  while (newXp >= nextLevelRequirement) {
    newXp -= nextLevelRequirement;
    newLevel += 1;
    levelUps += 1;
    bonusDiamonds += 5 + Math.max(0, newLevel - 20);
    nextLevelRequirement = newLevel * 100;
  }

  const today = getDateKey();
  const lastQuizDay = profile.lastClaimDay;
  const gapDays = lastQuizDay ? getDiffInDays(lastQuizDay, today) : 0;
  let streak = profile.streak;
  let shieldsUsed = 0;

  if (!lastQuizDay) {
    streak = 1;
  } else if (gapDays === 0) {
    streak = Math.max(1, profile.streak);
  } else if (gapDays === 1) {
    streak = profile.streak + 1;
  } else {
    const missedDays = gapDays - 1;
    let coverage = 0;
    const [shield7, shield3, shield1] = await Promise.all([
      db
        .select()
        .from(quizzlyInventory)
        .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, "shield_7d"))),
      db
        .select()
        .from(quizzlyInventory)
        .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, "shield_3d"))),
      db
        .select()
        .from(quizzlyInventory)
        .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, "shield_1d"))),
    ]);

    const s7 = shield7[0]?.quantity ?? 0;
    const s3 = shield3[0]?.quantity ?? 0;
    const s1 = shield1[0]?.quantity ?? 0;

    let use7 = 0;
    let use3 = 0;
    let use1 = 0;

    while (coverage < missedDays && use7 < s7) {
      use7 += 1;
      coverage += 7;
    }
    while (coverage < missedDays && use3 < s3) {
      use3 += 1;
      coverage += 3;
    }
    while (coverage < missedDays && use1 < s1) {
      use1 += 1;
      coverage += 1;
    }

    if (coverage >= missedDays) {
      shieldsUsed = use7 + use3 + use1;
      streak = profile.streak + 1;
      if (use7 > 0) await upsertInventoryItem(userId, "shield_7d", -use7);
      if (use3 > 0) await upsertInventoryItem(userId, "shield_3d", -use3);
      if (use1 > 0) await upsertInventoryItem(userId, "shield_1d", -use1);
    } else {
      streak = 1;
    }
  }

  await updateQuizzlyProfile({
    xp: newXp,
    level: newLevel,
    diamonds: profile.diamonds + bonusDiamonds,
    streak,
    lastClaimDay: today,
  });

  if (activeBooster) {
    await upsertInventoryItem(userId, activeBooster, -1);
  }

  const weekKey = getWeekKey();
  await upsertInventoryItem(userId, `weekly-xp:${weekKey}`, xpGain);
  await upsertInventoryItem(userId, "stats:quiz-played", 1);
  await upsertInventoryItem(userId, "stats:total-correct", correctAnswers);
  await setInventoryMax(userId, "stats:best-score", correctAnswers);
  await setInventoryMax(userId, "stats:best-streak", streak);
  if (typeof completionSeconds === "number" && Number.isFinite(completionSeconds) && completionSeconds > 0) {
    await setInventoryMin(userId, "stats:fastest-quiz-sec", Math.floor(completionSeconds));
  }
  if (bonusDiamonds > 0) {
    await upsertInventoryItem(userId, "stats:diamonds-earned", bonusDiamonds);
  }
  await updateFriendStreaksForUser(userId);

  const [pendingReferral] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), like(quizzlyInventory.itemKey, "referral:pending:%")));
  if (pendingReferral && pendingReferral.quantity > 0) {
    const referralCode = pendingReferral.itemKey.replace("referral:pending:", "");
    const [sponsorCodeRow] = await db
      .select()
      .from(quizzlyInventory)
      .where(eq(quizzlyInventory.itemKey, `referral:code:${referralCode}`));
    const sponsorId = sponsorCodeRow?.userId;
    if (sponsorId && sponsorId !== userId) {
      const sponsorProfile = await db.select().from(quizzlyProfile).where(eq(quizzlyProfile.userId, sponsorId));
      const sponsor = sponsorProfile[0];
      if (sponsor) {
        await db
          .update(quizzlyProfile)
          .set({ diamonds: sponsor.diamonds + 50, stars: sponsor.stars + 1, updatedAt: new Date() })
          .where(eq(quizzlyProfile.userId, sponsorId));
      }
      await upsertInventoryItem(sponsorId, `referral:child:${userId}:${today}`, 1);
      await upsertInventoryItem(sponsorId, "stats:diamonds-earned", 50);
      await updateQuizzlyProfile({ diamonds: profile.diamonds + bonusDiamonds + 25 });
      await upsertInventoryItem(userId, "stats:diamonds-earned", 25);
      await upsertInventoryItem(userId, `referral:claimed:${referralCode}`, 1);
      await upsertInventoryItem(userId, pendingReferral.itemKey, -1);
    }
  }

  return { xpGain, newLevel, levelUps, bonusDiamonds, shieldsUsed, streak };
}

export async function registerReferralFromCode(codeRaw: string) {
  const userId = await getAuthenticatedUserId();
  const code = codeRaw.trim().toUpperCase();
  if (!code) return { success: false };
  const myCode = buildReferralCodeFromUserId(userId);
  if (myCode === code) return { success: false };
  const [existingClaim] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), like(quizzlyInventory.itemKey, "referral:claimed:%")));
  if (existingClaim) return { success: false };
  await upsertInventoryItem(userId, `referral:pending:${code}`, 1);
  return { success: true };
}

export async function getReferralProgramData() {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();
  const code = await ensureReferralCode(userId);
  const [baseUrlRow] = [{ url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" }];
  const referralLink = `${baseUrlRow.url}/register?ref=${encodeURIComponent(code)}`;

  const childrenRows = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), like(quizzlyInventory.itemKey, "referral:child:%")));

  const children = await Promise.all(
    childrenRows.map(async (row) => {
      const parts = row.itemKey.split(":");
      const childId = parts[2] ?? "";
      const rewardedAt = parts[3] ?? "";
      const [childProfile] = await db.select().from(quizzlyProfile).where(eq(quizzlyProfile.userId, childId));
      const lastActivity = childProfile?.lastClaimDay ? new Date(`${childProfile.lastClaimDay}T00:00:00.000Z`) : null;
      const active = Boolean(lastActivity && (Date.now() - lastActivity.getTime()) / 86400000 <= 7);
      return {
        pseudo: childProfile?.pseudo ?? "Filleul",
        joinedAt: rewardedAt,
        active,
        rewards: "50💎 + 1⭐",
      };
    })
  );

  const totalReferrals = children.length;
  const activeReferrals = children.filter((child) => child.active).length;
  const nextTierTarget = REFERRAL_TIERS.find((tier) => activeReferrals < tier.referrals)?.referrals ?? 50;
  const currentTierStart = REFERRAL_TIERS.filter((tier) => tier.referrals <= activeReferrals).slice(-1)[0]?.referrals ?? 0;
  const progress = nextTierTarget === currentTierStart ? 100 : Math.round(((activeReferrals - currentTierStart) / Math.max(1, nextTierTarget - currentTierStart)) * 100);

  const tierStatuses = await Promise.all(
    REFERRAL_TIERS.map(async (tier) => {
      const [claimed] = await db
        .select()
        .from(quizzlyInventory)
        .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, `referral:reward:${tier.key}`)));
      return {
        ...tier,
        unlocked: activeReferrals >= tier.referrals,
        claimed: Boolean(claimed && claimed.quantity > 0),
      };
    })
  );

  return {
    code,
    referralLink,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(referralLink)}`,
    totalReferrals,
    activeReferrals,
    children,
    progress,
    nextTierTarget,
    tierStatuses,
    profile: { pseudo: profile.pseudo, diamonds: profile.diamonds, stars: profile.stars },
  };
}

export async function claimReferralTierRewards() {
  const userId = await getAuthenticatedUserId();
  const data = await getReferralProgramData();
  const profile = await getQuizzlyProfile();
  let extraDiamonds = 0;
  let extraStars = 0;
  const unlockedNow: string[] = [];

  for (const tier of data.tierStatuses) {
    if (!tier.unlocked || tier.claimed) continue;
    if (tier.referrals === 3) {
      extraDiamonds += 30;
    } else if (tier.referrals === 5) {
      await upsertInventoryItem(userId, "avatar:recruteur", 1);
      await upsertInventoryItem(userId, "badge:ambassadeur-bronze", 1);
    } else if (tier.referrals === 10) {
      await upsertInventoryItem(userId, "title:ambassadeur-quizzly", 1);
      await upsertInventoryItem(userId, "badge:ambassadeur-argent", 1);
    } else if (tier.referrals === 20) {
      await upsertInventoryItem(userId, "theme:ambassadeur", 1);
    } else if (tier.referrals === 50) {
      await upsertInventoryItem(userId, "badge:grand-ambassadeur", 1);
      extraDiamonds += 100;
      extraStars += 3;
    }
    await upsertInventoryItem(userId, `referral:reward:${tier.key}`, 1);
    unlockedNow.push(tier.label);
  }

  if (extraDiamonds > 0 || extraStars > 0) {
    await updateQuizzlyProfile({
      diamonds: profile.diamonds + extraDiamonds,
      stars: profile.stars + extraStars,
    });
    if (extraDiamonds > 0) await upsertInventoryItem(userId, "stats:diamonds-earned", extraDiamonds);
  }

  return { unlockedNow, extraDiamonds, extraStars };
}

export async function getMonthlyReferralLeaderboard() {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const allReferralRows = await db
    .select()
    .from(quizzlyInventory)
    .where(like(quizzlyInventory.itemKey, "referral:child:%"));

  const scoreBySponsor = new Map<string, number>();
  const pseudoBySponsor = new Map<string, string>();
  for (const row of allReferralRows) {
    const [, , childId, joinedAt] = row.itemKey.split(":");
    if (!joinedAt?.startsWith(monthKey)) continue;
    const [childProfile] = await db.select().from(quizzlyProfile).where(eq(quizzlyProfile.userId, childId ?? ""));
    if (!childProfile?.lastClaimDay) continue;
    const active = getDiffInDays(childProfile.lastClaimDay, getDateKey()) <= 7;
    if (!active) continue;
    scoreBySponsor.set(row.userId, (scoreBySponsor.get(row.userId) ?? 0) + 1);
  }

  const sponsorIds = Array.from(scoreBySponsor.keys());
  if (sponsorIds.length > 0) {
    const sponsors = await db.select().from(quizzlyProfile).where(or(...sponsorIds.map((id) => eq(quizzlyProfile.userId, id))));
    sponsors.forEach((sponsor) => pseudoBySponsor.set(sponsor.userId, sponsor.pseudo));
  }

  const entries = sponsorIds
    .map((userId) => ({ userId, pseudo: pseudoBySponsor.get(userId) ?? "Joueur", activeReferrals: scoreBySponsor.get(userId) ?? 0 }))
    .sort((a, b) => b.activeReferrals - a.activeReferrals)
    .slice(0, 10);

  return { monthKey, entries };
}

export async function claimMonthlyReferralTopBonus() {
  const userId = await getAuthenticatedUserId();
  const profile = await getQuizzlyProfile();
  const { monthKey, entries } = await getMonthlyReferralLeaderboard();
  const rank = entries.findIndex((entry) => entry.userId === userId);
  if (rank < 0 || rank > 2) return { granted: false, bonusDiamonds: 0 };
  const rewards = [200, 150, 100] as const;
  const bonusDiamonds = rewards[rank] ?? 0;
  const marker = `referral:monthly-bonus:${monthKey}:rank:${rank + 1}`;
  const [already] = await db.select().from(quizzlyInventory).where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, marker)));
  if (already) return { granted: false, bonusDiamonds: 0 };
  await updateQuizzlyProfile({ diamonds: profile.diamonds + bonusDiamonds });
  await upsertInventoryItem(userId, "stats:diamonds-earned", bonusDiamonds);
  await upsertInventoryItem(userId, marker, 1);
  return { granted: true, bonusDiamonds, rank: rank + 1 };
}
