import { redis } from "../config/redis.js";

const activeUsers = new Set();

export function registerPresenceSocket(io, socket) {
  socket.on("presence:online", async (_userId) => {
    const userId = socket.user && socket.user.uid;
    if (!userId) return;

    try {
      await redis.set(`presence:${userId}`, "active");
    } catch (err) {
      console.error("presence redis set failed:", err);
    }

    activeUsers.add(userId);

    io.emit("presence:update", {
      userId,
      status: "online",
    });
  });

  socket.on("disconnect", async () => {
    const userId = socket.user && socket.user.uid;
    if (!userId) return;

    try {
      await redis.del(`presence:${userId}`);
    } catch (err) {
      console.error("presence redis del failed:", err);
    }

    activeUsers.delete(userId);
  });
}
