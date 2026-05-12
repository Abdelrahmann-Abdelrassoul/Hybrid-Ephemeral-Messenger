"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/src/lib/firebase";
import {
  useGhostChatSocket,
  GHOST_CONSOLE_TTL_OPTIONS,
  type GhostConsoleTtlChoice,
} from "@/src/features/console/useGhostChatSocket";
import GhostChat from "@/src/components/GhostChat";
import SystemPulseMonitor from "@/src/components/SystemPulseMonitor";

export default function GhostConsolePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

  const {
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
  } = useGhostChatSocket({
    enabled: ready,
  });

  const presenceRoster = useMemo(() => {
    const peer = peerUid.trim();
    const rows: { uid: string; label: string; isActive: boolean }[] = [];
    if (selfUid) {
      rows.push({
        uid: selfUid,
        label: "You",
        isActive: presenceByUid[selfUid] ?? false,
      });
    }
    if (peer && peer !== selfUid) {
      rows.push({
        uid: peer,
        label: "Peer",
        isActive: presenceByUid[peer] ?? false,
      });
    }
    return rows;
  }, [selfUid, peerUid, presenceByUid]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/");
        return;
      }
      setLabel(user.email ?? user.displayName ?? user.uid);
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Ghost Console
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
          </div>
          <button
            type="button"
            onClick={() => void signOut(auth).then(() => router.replace("/"))}
            className="self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Sign out
          </button>
        </header>

        <section
          aria-label="Presence roster"
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Presence
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {presenceRoster.length === 0 ? (
              <li className="font-mono text-xs text-zinc-500">No users in roster.</li>
            ) : (
              presenceRoster.map((user) => (
                <li
                  key={user.uid}
                  className="flex items-center justify-between gap-4 font-mono text-sm text-zinc-800 dark:text-zinc-200"
                >
                  <span className="min-w-0 shrink text-zinc-600 dark:text-zinc-400" title={user.uid}>
                    <span className="text-zinc-900 dark:text-zinc-100">{user.label}</span>
                    {presenceLabelByUid[user.uid] ? (
                      <span className="ml-2 text-zinc-700 dark:text-zinc-300">
                        {presenceLabelByUid[user.uid]}
                      </span>
                    ) : null}
                    <span className="ml-2 break-all font-mono text-[11px] text-zinc-500">{user.uid}</span>
                  </span>
                  <span
                    className={
                      user.isActive
                        ? "shrink-0 text-emerald-600 dark:text-emerald-400"
                        : "shrink-0 text-zinc-500 dark:text-zinc-500"
                    }
                  >
                    {user.isActive ? "Active" : "Offline"}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label className="font-mono text-xs text-zinc-600 dark:text-zinc-400" htmlFor="peer-uid">
              Peer Firebase UID
            </label>
            <input
              id="peer-uid"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="other-user-uid"
              value={peerUid}
              onChange={(e) => setPeerUid(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-52">
            <label
              className="font-mono text-xs text-zinc-600 dark:text-zinc-400"
              htmlFor="message-ttl"
            >
              Message TTL
            </label>
            <select
              id="message-ttl"
              value={messageTtlSeconds}
              onChange={(e) =>
                setMessageTtlSeconds(Number(e.target.value) as GhostConsoleTtlChoice)
              }
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {GHOST_CONSOLE_TTL_OPTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec} seconds
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <GhostChat
            messages={messages}
            onSend={sendMessage}
            disabled={!peerOk || !socketReady}
          />
          <SystemPulseMonitor logs={logs} />
        </div>
      </div>
    </main>
  );
}
