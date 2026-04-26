"use server";

import { db } from "@/lib/db/queries";
import { auth } from "@/app/(auth)/auth";
import {
  quizzlyProfile,
  quizzlyInventory,
  quizzlyUserQuest,
  quizzlyFriendship,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getAuthenticatedUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

export async function getQuizzlyProfile() {
  const userId = await getAuthenticatedUserId();

  const [profile] = await db
    .select()
    .from(quizzlyProfile)
    .where(eq(quizzlyProfile.userId, userId));

  if (!profile) {
    const [newProfile] = await db
      .insert(quizzlyProfile)
      .values({ userId })
      .returning();
    return newProfile;
  }

  return profile;
}

export async function updateQuizzlyProfile(data: Partial<typeof quizzlyProfile.$inferInsert>) {
  const userId = await getAuthenticatedUserId();

  await db
    .update(quizzlyProfile)
    .set(data)
    .where(eq(quizzlyProfile.userId, userId));

  revalidatePath("/(chat)/quizzly", "layout");
}

export async function claimDailyReward() {
  await getAuthenticatedUserId();

  const profile = await getQuizzlyProfile();
  const today = new Date().toISOString().split("T")[0];

  if (profile.lastClaimDay === today) {
    return { success: false, message: "Déjà réclamé aujourd'hui !" };
  }

  // Determine if streak continues
  let newStreak = profile.streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (profile.lastClaimDay === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1; // reset streak
  }

  const rewardDiamonds = 50 + (newStreak * 5); // Base + bonus

  await updateQuizzlyProfile({
    diamonds: profile.diamonds + rewardDiamonds,
    streak: newStreak,
    lastClaimDay: today,
  });

  return { success: true, reward: rewardDiamonds, streak: newStreak };
}

export async function getQuizzlyInventory() {
  const userId = await getAuthenticatedUserId();

  return await db
    .select()
    .from(quizzlyInventory)
    .where(eq(quizzlyInventory.userId, userId));
}

export async function buyItem(itemKey: string, price: number, amount: number = 1) {
  const userId = await getAuthenticatedUserId();

  const profile = await getQuizzlyProfile();

  if (profile.diamonds < price) {
    throw new Error("Pas assez de diamants");
  }

  // Deduct price
  await updateQuizzlyProfile({ diamonds: profile.diamonds - price });

  // Add item to inventory
  const [existingItem] = await db
    .select()
    .from(quizzlyInventory)
    .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, itemKey)));

  if (existingItem) {
    await db
      .update(quizzlyInventory)
      .set({ quantity: existingItem.quantity + amount })
      .where(eq(quizzlyInventory.id, existingItem.id));
  } else {
      await db.insert(quizzlyInventory).values({
      userId,
      itemKey,
      quantity: amount,
    });
  }

  revalidatePath("/(chat)/quizzly/boutique");
  return { success: true };
}

// Very basic quest setup - assigning 3 random daily and 3 weekly quests if not present
import dailyQuestsRaw from "./quests/daily-quests.json";
import weeklyQuestsRaw from "./quests/weekly-quests.json";

export async function getOrAssignQuests() {
  const userId = await getAuthenticatedUserId();

  const activeQuests = await db
    .select()
    .from(quizzlyUserQuest)
    .where(and(eq(quizzlyUserQuest.userId, userId), eq(quizzlyUserQuest.isCompleted, false)));

  const now = new Date();

  const activeDaily = activeQuests.filter(q => q.type === "daily" && new Date(q.expiresAt) > now);
  const activeWeekly = activeQuests.filter(q => q.type === "weekly" && new Date(q.expiresAt) > now);

  if (activeDaily.length === 0) {
    // Assign 3 random daily quests
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    for (let i = 0; i < 3; i++) {
      const q = dailyQuestsRaw[Math.floor(Math.random() * dailyQuestsRaw.length)];
      await db.insert(quizzlyUserQuest).values({
        userId,
        questId: q.id,
        type: "daily",
        expiresAt: endOfDay
      });
    }
  }

  if (activeWeekly.length === 0) {
    // Assign 3 random weekly quests
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
        expiresAt: endOfWeek
      });
    }
  }

  return await db
    .select()
    .from(quizzlyUserQuest)
    .where(and(eq(quizzlyUserQuest.userId, userId), eq(quizzlyUserQuest.isCompleted, false)));
}

export async function finishQuiz(correctAnswers: number, activeBooster: string | null) {
  const userId = await getAuthenticatedUserId();

  const profile = await getQuizzlyProfile();

  let xpGain = correctAnswers * 2;

  if (activeBooster === "booster_x1.5") xpGain = Math.round(xpGain * 1.5);
  else if (activeBooster === "booster_x2") xpGain = Math.round(xpGain * 2);
  else if (activeBooster === "booster_x3") xpGain = Math.round(xpGain * 3);

  const newXp = profile.xp + xpGain;
  const xpForNextLevel = profile.level * 100; // simple curve

  let newLevel = profile.level;
  if (newXp >= xpForNextLevel) {
    newLevel += 1;
    // can add bonus level up rewards
  }

  await updateQuizzlyProfile({
    xp: newXp,
    level: newLevel
  });

  // Also decrease booster if used
  if (activeBooster) {
    const [item] = await db
      .select()
      .from(quizzlyInventory)
      .where(and(eq(quizzlyInventory.userId, userId), eq(quizzlyInventory.itemKey, activeBooster)));

    if (item && item.quantity > 0) {
      await db
        .update(quizzlyInventory)
        .set({ quantity: item.quantity - 1 })
        .where(eq(quizzlyInventory.id, item.id));
    }
  }

  // TODO: Progress quests based on quiz outcome

  return { xpGain, newLevel };
}
