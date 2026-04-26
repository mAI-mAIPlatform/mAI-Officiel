"use server";

import { db } from "@/lib/db/queries";
import { auth } from "@/app/(auth)/auth";
import {
  quizzlyProfile,
  quizzlyInventory,
  quizzlyUserQuest,
} from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";
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

  const xpGain = Math.max(10, Math.floor(meta.rewardDiamonds * 2));
  const profile = await getQuizzlyProfile();

  await db
    .update(quizzlyUserQuest)
    .set({ isCompleted: true })
    .where(eq(quizzlyUserQuest.id, quest.id));

  await updateQuizzlyProfile({
    diamonds: profile.diamonds + meta.rewardDiamonds,
    xp: profile.xp + xpGain,
  });

  return { diamonds: meta.rewardDiamonds, xp: xpGain, success: true };
}

export async function finishQuiz(correctAnswers: number, activeBooster: string | null) {
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

  return { xpGain, newLevel, levelUps, bonusDiamonds, shieldsUsed, streak };
}
