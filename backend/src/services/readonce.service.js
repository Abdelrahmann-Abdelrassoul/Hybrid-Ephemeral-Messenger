import { redis } from "../config/redis.js";
import { getTTL } from "./message.service.js";

export function getReadOnceKey(receiverUid) {
  if (!receiverUid || typeof receiverUid !== "string") {
    throw new Error("receiverUid is required");
  }
  return `readonce:${receiverUid}`;
}

export async function enqueueReadOnce(receiverUid, payload) {
  const key = getReadOnceKey(receiverUid);
  await redis.rPush(key, JSON.stringify(payload));
  await redis.expire(key, getTTL());
}

export async function dequeueReadOnce(receiverUid) {
  const readOnceKey = getReadOnceKey(receiverUid);
  const result = await redis.multi().lPop(readOnceKey).exec();
  const raw = Array.isArray(result) ? result[0] : null;
  if (raw == null || raw === "") {
    return null;
  }
  return JSON.parse(raw);
}
