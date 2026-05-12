import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import admin from "./config/firebaseAdmin.js";
import { connectRedis } from "./config/redis.js";
import authRoutes from "./routes/auth.routes.js";
import { getChatKey, getMessages, saveMessage } from "./services/message.service.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use("/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token || typeof token !== "string") {
      return next(new Error("Unauthorized"));
    }
    const decoded = await admin.auth().verifyIdToken(token);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
});

const activeUsers = new Set();

function resolveChatRoom(payload) {
  if (!payload) {
    return null;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (typeof payload === "object" && payload.uid1 && payload.uid2) {
    return getChatKey(payload.uid1, payload.uid2);
  }

  return typeof payload === "object" ? payload.roomId ?? null : null;
}

io.on("connection", (socket) => {
  socket.join(`user:${socket.user.uid}`);

  socket.on("presence:online", (_userId) => {
    const userId = socket.user && socket.user.uid;
    if (!userId) return;

    activeUsers.add(userId);

    io.emit("presence:update", {
      userId,
      status: "online",
    });
  });

  socket.on("room:join", async (payload) => {
    const roomId = resolveChatRoom(payload);
    if (!roomId) return;

    socket.join(roomId);

    if (!payload || typeof payload !== "object" || !payload.uid1 || !payload.uid2) {
      return;
    }

    try {
      const messages = await getMessages(payload.uid1, payload.uid2);
      socket.emit("chat:history", {
        roomId,
        messages,
      });
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  });

  socket.on("room:leave", (payload) => {
    const roomId = resolveChatRoom(payload);
    if (!roomId) return;

    socket.leave(roomId);
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

  socket.on("system:pulse", (payload) => {
    io.emit("system:pulse", {
      at: Date.now(),
      ...payload,
    });
  });

  socket.on("disconnect", () => {
    // Presence offlining can be tied to session/user mapping as needed.
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectRedis();

  server.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
