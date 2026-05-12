import dotenv from "dotenv";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import { attachRedisExpirePulses } from "./config/redisExpirePulse.js";
import authRoutes from "./routes/auth.routes.js";
import messagesRoutes from "./routes/messages.routes.js";
import usersRoutes from "./routes/users.routes.js";
import { attachSocketHandlers } from "./socket/index.js";

dotenv.config();

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/messages", messagesRoutes);
app.use("/users", usersRoutes);

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

app.set("io", io);

attachSocketHandlers(io);

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await connectRedis();
  await attachRedisExpirePulses(io);

  server.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
