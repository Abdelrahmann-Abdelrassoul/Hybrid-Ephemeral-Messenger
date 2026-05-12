import { redis } from "../config/redis.js";

const DEFAULT_MESSAGE_TTL_SECONDS = 120;

export function getTTL() {
  const raw = process.env.MESSAGE_TTL_SECONDS;

  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return DEFAULT_MESSAGE_TTL_SECONDS;
  }

  const ttl = Number(raw);
  if (!Number.isFinite(ttl) || ttl <= 0) {
    console.warn(
      `[config] Invalid MESSAGE_TTL_SECONDS (${JSON.stringify(raw)}). Using default ${DEFAULT_MESSAGE_TTL_SECONDS}s.`
    );
    return DEFAULT_MESSAGE_TTL_SECONDS;
  }

  return ttl;
}

export function getChatKey(uid1, uid2) {
  if (!uid1 || !uid2) {
    throw new Error("uid1 and uid2 are required to build a chat key");
  }

  return `chat:${[uid1, uid2].sort().join("_")}`;
}

export async function saveMessage(uid1, uid2, message) {
  const chatKey = getChatKey(uid1, uid2);
  const serializedMessage = JSON.stringify(message);
  const ttlSeconds = getTTL();

  await redis.rPush(chatKey, serializedMessage);
  await redis.expire(chatKey, ttlSeconds);

  return {
    key: chatKey,
    ttl: ttlSeconds,
    message,
  };
}

export async function getMessages(uid1, uid2) {
  const chatKey = getChatKey(uid1, uid2);
  const storedMessages = await redis.lRange(chatKey, 0, -1);

  return storedMessages.map((storedMessage) => JSON.parse(storedMessage));
}

export async function getMessagesWithTTL(uid1, uid2) {
  const chatKey = getChatKey(uid1, uid2);
  const [storedMessages, ttl] = await Promise.all([
    redis.lRange(chatKey, 0, -1),
    redis.ttl(chatKey),
  ]);

  return {
    messages: storedMessages.map((storedMessage) => JSON.parse(storedMessage)),
    ttl,
  };
}
