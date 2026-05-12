export function registerSystemSocket(io, socket) {
  socket.on("system:pulse", (payload) => {
    io.emit("system:pulse", {
      at: Date.now(),
      ...payload,
    });
  });
}
