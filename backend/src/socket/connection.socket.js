export function registerConnectionSocket(socket) {
  socket.join(`user:${socket.user.uid}`);

  socket.on("disconnect", () => {
    // Presence offlining can be tied to session/user mapping as needed.
  });
}
