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

export const MESSAGE_TTL_CHOICES = Object.freeze([10, 30, 60, 120]);

function resolveTtlForSave(requested) {
  if (requested === undefined || requested === null) {
    return getTTL();
  }
  const n = Number(requested);
  if (!Number.isInteger(n) || !MESSAGE_TTL_CHOICES.includes(n)) {
    return getTTL();
  }
  return n;
}

export function getChatKey(uid1, uid2) {
  if (!uid1 || !uid2) {
    throw new Error("uid1 and uid2 are required to build a chat key");
  }

  return `chat:${[uid1, uid2].sort().join("_")}`;
}

function getMessageText(message) {
  if (message == null) return "";
  if (typeof message === "string") return message.trim();
  if (typeof message === "object") {
    const raw = message.text ?? message.body ?? message.content;
    if (typeof raw === "string") return raw.trim();
  }
  return "";
}

export function assertValidMessageBody(message) {
  const content = getMessageText(message);
  if (!content || content.length === 0) {
    throw new Error("Message cannot be empty");
  }
}

export async function saveMessage(uid1, uid2, message, ttlSecondsRequested) {
  assertValidMessageBody(message);
  const chatKey = getChatKey(uid1, uid2);
  const serializedMessage = JSON.stringify(message);
  const ttlSeconds = resolveTtlForSave(ttlSecondsRequested);

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
