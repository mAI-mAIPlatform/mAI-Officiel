import { createClient } from "redis";

import { isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";

const TTL_SECONDS = 60 * 60;

let client: ReturnType<typeof createClient> | null = null;
let clientConnectionPromise: Promise<void> | null = null;

async function getClient() {
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
    const [count] = await redis
      .multi()
      .incr(key)
      .expire(key, TTL_SECONDS, "NX")
      .exec();

    if (typeof count === "number" && count > maxMessages) {
      throw new ChatbotError("rate_limit:chat");
    }
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
  }
}
