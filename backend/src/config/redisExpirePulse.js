import { redis } from "./redis.js";

/**
 * Broadcasts [GHOST] pulses when chat:* keys expire (requires notify-keyspace-events).
 */
export async function attachRedisExpirePulses(io) {
  if (!redis.isOpen) {
    return;
  }

  try {
    await redis.configSet("notify-keyspace-events", "Ex");
  } catch (err) {
    console.warn("[pulse] notify-keyspace-events not configured:", err?.message ?? err);
  }

  try {
    const subscriber = redis.duplicate();
    await subscriber.connect();

    await subscriber.subscribe("__keyevent@0__:expired", (expiredKey) => {
      if (typeof expiredKey !== "string" || !expiredKey.startsWith("chat:")) {
        return;
      }
      io.emit("system:pulse", {
        at: Date.now(),
        line: "[GHOST]: TTL reached 0. Redis memory purged.",
        key: expiredKey,
      });
    });
  } catch (err) {
    console.warn("[pulse] Redis expire subscription failed:", err?.message ?? err);
  }
}
