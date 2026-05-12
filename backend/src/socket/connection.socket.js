export function registerConnectionSocket(socket) {
  const { uid, name, email } = socket.user;
  socket.join(`user:${uid}`);

  socket.emit("system:pulse", {
    at: Date.now(),
    line: `[AUTH]: Token verified for google_uid_${uid}`,
  });

  const label = name || email || uid;
  socket.emit("system:pulse", {
    at: Date.now(),
    line: `[SOCKET]: User ${label} connected.`,
  });

  socket.on("disconnect", async () => {});
}
