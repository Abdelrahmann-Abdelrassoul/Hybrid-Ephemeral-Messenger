import { dequeueReadOnce } from "../services/readonce.service.js";

export function registerReadOnceSocket(io, socket) {
  socket.on("readonce:consume", async () => {
    const uid = socket.user.uid;
    try {
      const consumed = await dequeueReadOnce(uid);
      if (consumed == null) {
        return;
      }
      io.to(`user:${uid}`).emit("system:pulse", {
        at: Date.now(),
        line: "[GHOST]: Message burned after read.",
      });
    } catch (err) {
      console.error("readonce:consume:", err);
    }
  });
}
