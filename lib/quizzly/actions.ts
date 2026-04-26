"use server";

import { db } from "@/lib/db/queries";
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
    return newProfile;
  }

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

  const requiredXp = input.tier * 120;
  if (profile.xp < requiredXp) {
    throw new Error("XP insuffisante pour ce palier.");
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

  return { xpGain, newLevel, levelUps, bonusDiamonds, shieldsUsed, streak };
}
