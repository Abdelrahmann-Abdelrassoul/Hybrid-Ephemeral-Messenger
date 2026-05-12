const activeUsers = new Set();

export function registerPresenceSocket(io, socket) {
  socket.on("presence:online", (_userId) => {
    const userId = socket.user && socket.user.uid;
    if (!userId) return;

    activeUsers.add(userId);

    io.emit("presence:update", {
      userId,
      status: "online",
    });
  });
}
