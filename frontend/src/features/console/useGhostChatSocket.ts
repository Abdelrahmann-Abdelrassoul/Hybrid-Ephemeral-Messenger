import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { auth } from "@/src/lib/firebase";
import { parseGhostMessagePayload } from "@/src/lib/parseGhostMessage";
import { createAuthenticatedSocket } from "@/src/lib/sockets";
import type { GhostChatMessage } from "@/src/components/GhostChat";
import type { SystemPulseLog } from "@/src/components/SystemPulseMonitor";

type UseGhostChatSocketOptions = {
  enabled: boolean;
};

export function useGhostChatSocket({ enabled }: UseGhostChatSocketOptions) {
  const [peerUid, setPeerUid] = useState("");
  const [messages, setMessages] = useState<GhostChatMessage[]>([]);
  const [logs, setLogs] = useState<SystemPulseLog[]>([]);
  const [socketReady, setSocketReady] = useState(false);
  const [presenceByUid, setPresenceByUid] = useState<Record<string, boolean>>({});
  const [presenceLabelByUid, setPresenceLabelByUid] = useState<Record<string, string>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setMessages([]);
  }, [peerUid]);

  useEffect(() => {
    if (!enabled) return;
    const user = auth.currentUser;
    if (!user) return;

    let cancelled = false;
    const socketPromise = createAuthenticatedSocket();

    void socketPromise.then((socket) => {
      if (cancelled) {
        socket.disconnect();
        return;
      }
      socketRef.current = socket;

      const seedSelfLabel = () => {
        const selfName =
          user.displayName?.trim() ||
          user.email?.trim() ||
          (user.uid.length > 10 ? `${user.uid.slice(0, 8)}…` : user.uid);
        setPresenceLabelByUid((prev) => ({ ...prev, [user.uid]: selfName }));
      };

      const onConnect = () => {
        setSocketReady(true);
        seedSelfLabel();
        socket.emit("presence:online", user.uid);
      };
      const onDisconnect = () => {
        setSocketReady(false);
        setPresenceByUid((prev) => ({ ...prev, [user.uid]: false }));
      };
      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      if (socket.connected) {
        setSocketReady(true);
        seedSelfLabel();
        socket.emit("presence:online", user.uid);
      }

      const peer = peerUid.trim();
      if (peer) {
        socket.emit("room:join", { uid1: user.uid, uid2: peer });
      }

      socket.on("message:new", (msg: unknown) => {
        const parsed = parseGhostMessagePayload(msg);
        if (!parsed) return;
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), author: parsed.author, body: parsed.body },
        ]);
      });

      socket.on("chat:wipe", () => {
        setMessages([]);
      });

      socket.on("system:pulse", (log: unknown) => {
        setLogs((prev) => [...prev, log as SystemPulseLog]);
      });

      socket.on("presence:update", (raw: unknown) => {
        const p = raw as { uid?: string; status?: string; displayName?: string };
        if (
          typeof p.uid !== "string" ||
          (p.status !== "online" && p.status !== "offline")
        ) {
          return;
        }
        const uid = p.uid;
        const status = p.status;
        const displayName =
          typeof p.displayName === "string" && p.displayName.trim().length > 0
            ? p.displayName.trim()
            : uid.length > 10
              ? `${uid.slice(0, 8)}…`
              : uid;

        setPresenceByUid((prev) => ({
          ...prev,
          [uid]: status === "online",
        }));
        setPresenceLabelByUid((prev) => ({ ...prev, [uid]: displayName }));
        const pulseWho = displayName === uid ? uid : `${displayName} [${uid}]`;
        setLogs((prev) => [
          ...prev,
          {
            at: Date.now(),
            line: `[PRESENCE]: ${pulseWho} → ${status}`,
          },
        ]);
      });
    });

    return () => {
      cancelled = true;
      setSocketReady(false);
      setLogs([]);
      setPresenceByUid({});
      setPresenceLabelByUid({});
      void socketPromise.then((s) => {
        s.removeAllListeners();
        s.disconnect();
      });
      socketRef.current = null;
    };
  }, [enabled, peerUid]);

  const sendMessage = useCallback(
    (text: string) => {
      const user = auth.currentUser;
      const peer = peerUid.trim();
      const socket = socketRef.current;
      if (!user || !peer || !socket?.connected) return;

      const author = user.displayName || user.email || user.uid.slice(0, 8);
      socket.emit("message:send", {
        senderUid: user.uid,
        receiverUid: peer,
        message: { author, text },
      });
    },
    [peerUid]
  );

  const peerOk = peerUid.trim().length > 0;
  const selfUid = auth.currentUser?.uid ?? "";

  return {
    peerUid,
    setPeerUid,
    messages,
    socketReady,
    sendMessage,
    peerOk,
    logs,
    presenceByUid,
    presenceLabelByUid,
    selfUid,
  };
}
