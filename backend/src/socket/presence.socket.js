import { redis } from "../config/redis.js";

const activeUsers = new Set();

export function registerPresenceSocket(io, socket) {
  socket.on("presence:online", async (_userId) => {
    const uid = socket.user && socket.user.uid;
    if (!uid) return;

    try {
      await redis.set(`presence:${uid}`, "active");
    } catch (err) {
      console.error("presence redis set failed:", err);
    }

    activeUsers.add(uid);

    io.emit("presence:update", {
      uid,
      status: "online",
    });
  });

  socket.on("disconnect", async () => {
    const uid = socket.user && socket.user.uid;
    if (!uid) return;

    try {
      await redis.del(`presence:${uid}`);
    } catch (err) {
      console.error("presence redis del failed:", err);
    }

    activeUsers.delete(uid);

    io.emit("presence:update", {
      uid,
      status: "offline",
    });
  });
}
