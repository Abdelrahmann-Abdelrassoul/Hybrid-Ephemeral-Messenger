import { saveMessage } from "../services/message.service.js";
import { resolveChatRoom } from "./utils/resolveChatRoom.js";

export function registerMessagingSocket(io, socket) {
  socket.on("message:send", async (payload) => {
    if (!payload || typeof payload !== "object") return;

    const senderUid = socket.user.uid;
    const { receiverUid, ttlSeconds, content, message } = payload;

    if (typeof receiverUid !== "string" || typeof senderUid !== "string") {
      return;
    }
    if (senderUid === receiverUid) return;

    let messageToSave;
    if (typeof content === "string" && content.trim().length > 0) {
      messageToSave = { content: content.trim() };
    } else if (message != null) {
      messageToSave = message;
    } else {
      return;
    }

    try {
      await saveMessage(senderUid, receiverUid, messageToSave, ttlSeconds);
      io.emit("system:pulse", {
        at: Date.now(),
        line: "[REDIS]: Encrypted message stored.",
      });
      io.to(`user:${receiverUid}`).emit("message:new", messageToSave);
      io.to(`user:${senderUid}`).emit("message:new", messageToSave);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : typeof error === "string" ? error : "unknown";
      console.error("Failed to save message:", msg);
    }
  });

  socket.on("chat:message", async ({ roomId, uid1, uid2, message, ttlSeconds }) => {
    const resolvedRoomId = resolveChatRoom({ roomId, uid1, uid2 });
    if (!resolvedRoomId || !uid1 || !uid2 || !message) return;
    if (uid1 === uid2) return;

    try {
      await saveMessage(uid1, uid2, message, ttlSeconds);
      io.emit("system:pulse", {
        at: Date.now(),
        line: "[REDIS]: Encrypted message stored.",
      });
      io.to(resolvedRoomId).emit("chat:message", message);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : typeof error === "string" ? error : "unknown";
      console.error("Failed to save chat message:", msg);
    }
  });

  socket.on("chat:wipe", ({ roomId, uid1, uid2, initiatedBy }) => {
    const resolvedRoomId = resolveChatRoom({ roomId, uid1, uid2 });
    if (!resolvedRoomId) return;

    io.to(resolvedRoomId).emit("chat:wipe", {
      roomId: resolvedRoomId,
      initiatedBy,
      at: Date.now(),
    });
  });
}
