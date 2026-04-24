import { getClient } from "./ratelimit";
import {
  getNextResetDate,
  type UsageFeature,
  type UsagePeriod,
} from "./usage-limits";

export async function checkServerUsageLimit(
  userId: string,
  feature: UsageFeature,
  period: UsagePeriod,
  limit: number
): Promise<boolean> {
  const redis = await getClient();
  if (!redis?.isReady) {
    return true; // Fallback to allowing if Redis is down
  }

  try {
    const key = `mai.usage.${userId}.${feature}.${period}`;

    // Get time until next reset in seconds
    const now = new Date();
    const resetDate = getNextResetDate(period, now);
    const ttlSeconds = Math.max(
      1,
      Math.floor((resetDate.getTime() - now.getTime()) / 1000)
    );

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
