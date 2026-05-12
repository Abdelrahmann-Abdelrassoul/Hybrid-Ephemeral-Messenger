import { getChatKey } from "../../services/message.service.js";

export function resolveChatRoom(payload) {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "object" && payload.uid1 && payload.uid2) {
    return getChatKey(payload.uid1, payload.uid2);
  }

  return typeof payload === "object" ? payload.roomId ?? null : null;
}
