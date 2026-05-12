import { saveMessage } from "../services/message.service.js";
import { resolveChatRoom } from "./utils/resolveChatRoom.js";

export function registerMessagingSocket(io, socket) {
  socket.on("message:send", async (payload) => {
    if (!payload || typeof payload !== "object") return;

    const { senderUid, receiverUid, message } = payload;
    if (
      typeof senderUid !== "string" ||
      typeof receiverUid !== "string" ||
      message == null
    ) {
      return;
    }

    if (senderUid !== socket.user.uid) return;

    try {
      await saveMessage(senderUid, receiverUid, message);
      io.to(`user:${receiverUid}`).emit("message:new", message);
      io.to(`user:${senderUid}`).emit("message:new", message);
    } catch (error) {
      console.error("Failed to save message:", error);
    }
  });

  socket.on("chat:message", async ({ roomId, uid1, uid2, message }) => {
    const resolvedRoomId = resolveChatRoom({ roomId, uid1, uid2 });
    if (!resolvedRoomId || !uid1 || !uid2 || !message) return;

    try {
      await saveMessage(uid1, uid2, message);
      io.to(resolvedRoomId).emit("chat:message", message);
    } catch (error) {
      console.error("Failed to save chat message:", error);
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
