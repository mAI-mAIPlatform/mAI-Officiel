export type Quest = {
  id: string;
  label: string;
  target: number;
  type: "daily" | "weekly";
  xp: number;
};

const dailyBase = Array.from({ length: 200 }, (_, index) => ({
  id: `daily-${index + 1}`,
  label: index % 2 === 0 ? `Terminer ${1 + (index % 5)} quiz` : `Réussir ${3 + (index % 7)} bonnes réponses`,
  target: index % 2 === 0 ? 1 + (index % 5) : 3 + (index % 7),
  type: "daily" as const,
  xp: 20 + (index % 6) * 10,
}));

const weeklyBase = Array.from({ length: 200 }, (_, index) => ({
  id: `weekly-${index + 1}`,
  label: index % 2 === 0 ? `Cumuler ${10 + (index % 40)} bonnes réponses` : `Terminer ${5 + (index % 12)} quiz cette semaine`,
  target: index % 2 === 0 ? 10 + (index % 40) : 5 + (index % 12),
  type: "weekly" as const,
  xp: 120 + (index % 8) * 20,
}));

export function getDailyQuests(seedDate = new Date(), take = 5): Quest[] {
  const daySeed = Math.floor(seedDate.getTime() / 86_400_000);
  const start = daySeed % dailyBase.length;
  return Array.from({ length: take }, (_, offset) => dailyBase[(start + offset) % dailyBase.length]);
}

export function getWeeklyQuests(seedDate = new Date(), take = 5): Quest[] {
  const monday = new Date(seedDate);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);
  const weekSeed = Math.floor(monday.getTime() / 86_400_000 / 7);
  const start = weekSeed % weeklyBase.length;
  return Array.from({ length: take }, (_, offset) => weeklyBase[(start + offset) % weeklyBase.length]);
}
