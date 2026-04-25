import { getClient } from "./ratelimit";
import { type UsageFeature, type UsagePeriod, getNextResetDate } from "./usage-limits";
import postgres from "postgres";

let quotaSqlClient: ReturnType<typeof postgres> | null | undefined;
let quotaTableInitPromise: Promise<void> | null = null;

function getPeriodKey(period: UsagePeriod, now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  if (period === "hour") return `${year}-${month}-${day}-${hour}`;
  if (period === "month") return `${year}-${month}`;
  if (period === "week") {
    const currentDate = new Date(Date.UTC(year, now.getUTCMonth(), now.getUTCDate()));
    const dayOfWeek = currentDate.getUTCDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    currentDate.setUTCDate(currentDate.getUTCDate() - distanceToMonday);
    return `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, "0")}-${String(currentDate.getUTCDate()).padStart(2, "0")}`;
  }
  return `${year}-${month}-${day}`;
}

async function getQuotaSqlClient() {
  if (quotaSqlClient !== undefined) {
    return quotaSqlClient;
  }
  const quotaDbUrl = process.env.QUOTA_POSTGRES_URL;
  if (!quotaDbUrl) {
    quotaSqlClient = null;
    return quotaSqlClient;
  }
  quotaSqlClient = postgres(quotaDbUrl, { max: 1 });
  if (!quotaTableInitPromise) {
    quotaTableInitPromise = quotaSqlClient`
      CREATE TABLE IF NOT EXISTS "QuotaUsage" (
        "id" BIGSERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "feature" TEXT NOT NULL,
        "period" TEXT NOT NULL,
        "periodKey" TEXT NOT NULL,
        "count" INTEGER NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("userId", "feature", "period", "periodKey")
      );
    `.then(() => undefined);
  }
  await quotaTableInitPromise;
  return quotaSqlClient;
}

export async function checkServerUsageLimit(
  userId: string,
  feature: UsageFeature,
  period: UsagePeriod,
  limit: number
): Promise<boolean> {
  const quotaSql = await getQuotaSqlClient();
  if (quotaSql) {
    try {
      const periodKey = getPeriodKey(period);
      const rows = await quotaSql<{ count: number }[]>`
        INSERT INTO "QuotaUsage" ("userId", "feature", "period", "periodKey", "count", "updatedAt")
        VALUES (${userId}, ${feature}, ${period}, ${periodKey}, 1, NOW())
        ON CONFLICT ("userId", "feature", "period", "periodKey")
        DO UPDATE SET "count" = "QuotaUsage"."count" + 1, "updatedAt" = NOW()
        RETURNING "count";
      `;
      const count = rows[0]?.count ?? 0;
      return count <= limit;
    } catch {
      return true;
    }
  }

  const redis = await getClient();
  if (!redis?.isReady) return true; // Fallback to allowing if Redis is down

  try {
    const key = `mai.usage.${userId}.${feature}.${period}`;

    // Get time until next reset in seconds
    const now = new Date();
    const resetDate = getNextResetDate(period, now);
    const ttlSeconds = Math.max(1, Math.floor((resetDate.getTime() - now.getTime()) / 1000));

    const luaScript = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current;
`;
    const count = await redis.eval(luaScript, {
      keys: [key],
      arguments: [ttlSeconds.toString()],
    });

    return typeof count === "number" && count <= limit;
  } catch (error) {
    return true; // Fallback
  }
}
