import admin from "../../config/firebaseAdmin.js";

export async function firebaseSocketAuth(socket, next) {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token || typeof token !== "string") {
      return next(new Error("Unauthorized"));
    }
    const decoded = await admin.auth().verifyIdToken(token);
    socket.user = decoded;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
}
