export type UsageFeature =
  | "news"
  | "health"
  | "meals"
  | "studio"
  | "websearch"
  | "files"
  | "tier1"
  | "tier2"
  | "tier3";
export type UsagePeriod = "hour" | "day" | "week" | "month";

const USAGE_PREFIX = "mai.usage";
const serverUsageStore = new Map<string, UsageSnapshot>();

type UsageSnapshot = {
  count: number;
  periodKey: string;
};

function getPeriodKey(period: UsagePeriod, now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");

  if (period === "hour") {
    return `${year}-${month}-${day}-${hour}`;
  }

  if (period === "week") {
    const currentDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const dayOfWeek = currentDate.getUTCDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    currentDate.setUTCDate(currentDate.getUTCDate() - distanceToMonday);

    const weekMonth = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
    const weekDay = String(currentDate.getUTCDate()).padStart(2, "0");
    return `${currentDate.getUTCFullYear()}-${weekMonth}-${weekDay}`;
  }

  return period === "month" ? `${year}-${month}` : `${year}-${month}-${day}`;
}

export function getNextResetDate(period: UsagePeriod, now = new Date()): Date {
  const resetDate = new Date(now);

  if (period === "hour") {
    resetDate.setUTCMinutes(0, 0, 0);
    resetDate.setUTCHours(resetDate.getUTCHours() + 1);
    return resetDate;
  }

  if (period === "day") {
    resetDate.setUTCHours(0, 0, 0, 0);
    resetDate.setUTCDate(resetDate.getUTCDate() + 1);
    return resetDate;
  }

  if (period === "week") {
    resetDate.setUTCHours(0, 0, 0, 0);
    const dayOfWeek = resetDate.getUTCDay();
    const daysToNextMonday = (8 - dayOfWeek) % 7 || 7;
    resetDate.setUTCDate(resetDate.getUTCDate() + daysToNextMonday);
    return resetDate;
  }

  resetDate.setUTCHours(0, 0, 0, 0);
  resetDate.setUTCMonth(resetDate.getUTCMonth() + 1, 1);
  return resetDate;
}

function getStorageKey(feature: UsageFeature): string {
  return `${USAGE_PREFIX}.${feature}`;
}

function readSnapshot(feature: UsageFeature): UsageSnapshot {
  const key = getStorageKey(feature);

  if (typeof window === "undefined") {
    return serverUsageStore.get(key) ?? { count: 0, periodKey: "" };
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return { count: 0, periodKey: "" };
    }

    const parsed = JSON.parse(raw) as Partial<UsageSnapshot>;
    if (
      typeof parsed.count !== "number" ||
      typeof parsed.periodKey !== "string"
    ) {
      return { count: 0, periodKey: "" };
    }

    return {
      count: Math.max(0, Math.floor(parsed.count)),
      periodKey: parsed.periodKey,
    };
  } catch {
    return { count: 0, periodKey: "" };
  }
}

function writeSnapshot(feature: UsageFeature, snapshot: UsageSnapshot) {
  const key = getStorageKey(feature);

  if (typeof window === "undefined") {
    serverUsageStore.set(key, snapshot);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(snapshot));
  window.dispatchEvent(
    new CustomEvent("mai:usage-updated", {
      detail: { feature },
    })
  );
}

export function getUsageCount(
  feature: UsageFeature,
  period: UsagePeriod
): number {
  const snapshot = readSnapshot(feature);
  const currentPeriod = getPeriodKey(period);

  return snapshot.periodKey === currentPeriod ? snapshot.count : 0;
}

export function canConsumeUsage(
  feature: UsageFeature,
  period: UsagePeriod,
  limit: number
): boolean {
  return getUsageCount(feature, period) < limit;
}

export function consumeUsage(
  feature: UsageFeature,
  period: UsagePeriod
): { count: number; remaining: number | null } {
  const snapshot = readSnapshot(feature);
  const currentPeriod = getPeriodKey(period);
  const baseCount = snapshot.periodKey === currentPeriod ? snapshot.count : 0;

  const nextCount = baseCount + 1;
  writeSnapshot(feature, { count: nextCount, periodKey: currentPeriod });

  return { count: nextCount, remaining: null };
}
