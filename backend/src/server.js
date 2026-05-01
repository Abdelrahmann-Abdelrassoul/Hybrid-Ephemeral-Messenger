require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

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

const activeUsers = new Set();

io.on("connection", (socket) => {
  socket.on("presence:online", (userId) => {
    if (!userId) return;
    activeUsers.add(userId);
    io.emit("presence:update", { userId, status: "online" });
  });

  socket.on("room:join", (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
  });

  socket.on("room:leave", (roomId) => {
    if (!roomId) return;
    socket.leave(roomId);
  });

  socket.on("chat:message", ({ roomId, message }) => {
    if (!roomId || !message) return;
    io.to(roomId).emit("chat:message", message);
  });

  socket.on("chat:wipe", ({ roomId, initiatedBy }) => {
    if (!roomId) return;
    io.to(roomId).emit("chat:wipe", { roomId, initiatedBy, at: Date.now() });
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
server.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
