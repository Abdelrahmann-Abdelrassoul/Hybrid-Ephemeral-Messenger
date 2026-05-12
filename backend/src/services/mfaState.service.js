import { redis } from "../config/redis.js";

const PENDING_TTL_SECONDS = 300;

export function getMfaPendingKey(uid) {
  return `mfa:${uid}`;
}

export async function setPendingMfa(uid) {
  await redis.set(getMfaPendingKey(uid), "PENDING_MFA", { EX: PENDING_TTL_SECONDS });
}
