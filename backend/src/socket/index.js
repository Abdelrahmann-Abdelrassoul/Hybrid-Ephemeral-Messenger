import { firebaseSocketAuth } from "./middleware/firebaseSocketAuth.js";
import { registerConnectionSocket } from "./connection.socket.js";
import { registerPresenceSocket } from "./presence.socket.js";
import { registerRoomsSocket } from "./rooms.socket.js";
import { registerMessagingSocket } from "./messaging.socket.js";
import { registerSystemSocket } from "./system.socket.js";

export function attachSocketHandlers(io) {
  io.use(firebaseSocketAuth);

  io.on("connection", (socket) => {
    registerConnectionSocket(socket);
    registerPresenceSocket(io, socket);
    registerRoomsSocket(io, socket);
    registerMessagingSocket(io, socket);
    registerSystemSocket(io, socket);
  });
}
