import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { auth } from "@/src/lib/firebase";
import type { GhostDirectoryUser } from "@/src/components/UserList";
import { parseGhostMessagePayload } from "@/src/lib/parseGhostMessage";
import { createAuthenticatedSocket } from "@/src/lib/sockets";
import type { GhostChatMessage } from "@/src/components/GhostChat";
import type { SystemPulseLog } from "@/src/components/SystemPulseMonitor";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type UseGhostChatSocketOptions = {
  enabled: boolean;
};

export const GHOST_CONSOLE_TTL_OPTIONS = [10, 30, 60, 120] as const;
export type GhostConsoleTtlChoice = (typeof GHOST_CONSOLE_TTL_OPTIONS)[number];

export function useGhostChatSocket({ enabled }: UseGhostChatSocketOptions) {
  const [peerUid, setPeerUidInternal] = useState("");
  const [selectedUser, setSelectedUser] = useState<GhostDirectoryUser | null>(null);
  const [messageTtlSeconds, setMessageTtlSeconds] = useState<GhostConsoleTtlChoice>(120);
  const [messages, setMessages] = useState<GhostChatMessage[]>([]);
  const [logs, setLogs] = useState<SystemPulseLog[]>([]);
  const [socketReady, setSocketReady] = useState(false);
  const [presenceByUid, setPresenceByUid] = useState<Record<string, boolean>>({});
  const [presenceLabelByUid, setPresenceLabelByUid] = useState<Record<string, string>>({});
  const socketRef = useRef<Socket | null>(null);

  const fetchMessages = useCallback(async (receiverUid: string, init?: { signal?: AbortSignal }) => {
    const peer = receiverUid.trim();
    if (!peer) {
      setMessages([]);
      return;
    }
    const me = auth.currentUser;
    if (!me) {
      setMessages([]);
      return;
    }
    try {
      const token = await me.getIdToken();
      const res = await fetch(`${API_URL}/messages/${encodeURIComponent(peer)}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: init?.signal,
      });
      if (!res.ok) {
        setMessages([]);
        return;
      }
      const data = (await res.json()) as { messages?: unknown[] };
      const raw = Array.isArray(data.messages) ? data.messages : [];
      const mapped: GhostChatMessage[] = [];
      for (const m of raw) {
        const p = parseGhostMessagePayload(m);
        if (p) mapped.push({ id: crypto.randomUUID(), author: p.author, body: p.body });
      }
      setMessages(mapped);
    } catch (e) {
      if (init?.signal?.aborted) return;
      if (e instanceof DOMException && e.name === "AbortError") return;
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const peer = peerUid.trim();
    if (!peer) {
      setMessages([]);
      return;
    }
    if (selectedUser?.uid === peer) {
      return;
    }
    const ac = new AbortController();
    setMessages([]);
    void fetchMessages(peer, { signal: ac.signal });
    return () => ac.abort();
  }, [peerUid, enabled, fetchMessages, selectedUser]);

  const selectContact = useCallback(
    (user: GhostDirectoryUser) => {
      setSelectedUser(user);
      setPeerUidInternal(user.uid);
      void fetchMessages(user.uid);
    },
    [fetchMessages]
  );

  const setPeerUid = useCallback((v: string) => {
    setPeerUidInternal(v);
    setSelectedUser((prev) => {
      if (!prev) return null;
      return prev.uid === v.trim() ? prev : null;
    });
  }, []);

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
        ttlSeconds: messageTtlSeconds,
      });
    },
    [peerUid, messageTtlSeconds]
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
    messageTtlSeconds,
    setMessageTtlSeconds,
    selectedUser,
    selectContact,
    fetchMessages,
  };
}
