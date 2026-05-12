import { io, Socket } from "socket.io-client";
import { auth } from "@/src/lib/firebase";
import { getIdToken } from "firebase/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function createAuthenticatedSocket(): Promise<Socket> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in");
  }

  const token = await getIdToken(user);

  return io(API_URL, {
    auth: { token },
  });
}