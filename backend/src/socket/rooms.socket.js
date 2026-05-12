import { getMessages } from "../services/message.service.js";
import { resolveChatRoom } from "./utils/resolveChatRoom.js";

export function registerRoomsSocket(io, socket) {
  socket.on("room:join", async (payload) => {
    if (payload && typeof payload === "object" && payload.uid1 && payload.uid2) {
      const me = socket.user.uid;
      if (me !== payload.uid1 && me !== payload.uid2) return;

      const room = `chat:${[payload.uid1, payload.uid2].sort().join("_")}`;
      socket.join(room);

      const label = socket.user.name || socket.user.email || socket.user.uid;
      io.emit("system:pulse", {
        at: Date.now(),
        line: `[SOCKET]: User ${label} joined private room.`,
      });

      try {
        const messages = await getMessages(payload.uid1, payload.uid2);
        socket.emit("chat:history", {
          roomId: room,
          messages,
        });
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
      return;
    }

    const roomId = resolveChatRoom(payload);
    if (!roomId) return;

    socket.join(roomId);

    const label = socket.user.name || socket.user.email || socket.user.uid;
    io.emit("system:pulse", {
      at: Date.now(),
      line: `[SOCKET]: User ${label} joined room ${roomId}.`,
    });
  });

  socket.on("room:leave", (payload) => {
    if (payload && typeof payload === "object" && payload.uid1 && payload.uid2) {
      const me = socket.user.uid;
      if (me !== payload.uid1 && me !== payload.uid2) return;

      const room = `chat:${[payload.uid1, payload.uid2].sort().join("_")}`;
      socket.leave(room);
      return;
    }

    const roomId = resolveChatRoom(payload);
    if (!roomId) return;

    socket.leave(roomId);
  });
}
