import { createClient } from "redis";

import { isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";

const TTL_SECONDS = 60 * 60;

let client: ReturnType<typeof createClient> | null = null;
let clientConnectionPromise: Promise<void> | null = null;

export async function getClient() {
  if (!client && process.env.REDIS_URL) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", () => undefined);
    clientConnectionPromise = client
      .connect()
      .then(() => undefined)
      .catch(() => {
        client = null;
      });
  }

  if (clientConnectionPromise) {
    await clientConnectionPromise;
    clientConnectionPromise = null;
  }

  return client;
}

export async function checkIpRateLimit(
  ip: string | undefined,
  maxMessages = 10
) {
  if (!isProductionEnvironment || !ip) {
    return;
  }

  const redis = await getClient();
  if (!redis?.isReady) {
    return;
  }

  try {
    const key = `ip-rate-limit:${ip}`;
    const luaScript = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current;
`;
    const count = await redis.eval(luaScript, {
      keys: [key],
      arguments: [TTL_SECONDS.toString()],
    });

    if (typeof count === "number" && count > maxMessages) {
      throw new ChatbotError("rate_limit:chat");
    }
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
  }
}

export async function checkScopedRateLimit({
  key,
  maxAttempts,
  ttlSeconds,
}: {
  key: string;
  maxAttempts: number;
  ttlSeconds: number;
}) {
  if (!isProductionEnvironment) {
    return { allowed: true, count: 0 };
  }

  const redis = await getClient();
  if (!redis?.isReady) {
    return { allowed: true, count: 0 };
  }

  try {
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
    const numericCount = typeof count === "number" ? count : 0;
    return {
      allowed: numericCount <= maxAttempts,
      count: numericCount,
    };
  } catch {
    return { allowed: true, count: 0 };
  }
}
