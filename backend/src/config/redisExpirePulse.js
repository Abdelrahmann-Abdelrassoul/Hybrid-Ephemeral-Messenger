import { redis } from "./redis.js";

/**
 * Subscribes to Redis expired-key events; emits system pulse and chat:wipe for chat:* keys.
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

    await subscriber.pSubscribe("__keyevent@0__:expired", async (key, _channel) => {
      if (typeof key !== "string" || !key.startsWith("chat:")) {
        return;
      }

      const chatRoom = key;
      const ts = Date.now();

      io.to(chatRoom).emit("system:pulse", {
        type: "GHOST",
        message: "TTL reached 0. Redis memory purged.",
        timestamp: ts,
      });

      io.to(chatRoom).emit("chat:wipe", { chatKey: chatRoom });
    });
  } catch (err) {
    console.warn("[pulse] Redis expire subscription failed:", err?.message ?? err);
  }
}
