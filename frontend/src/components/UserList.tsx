"use client";

import { useEffect, useState } from "react";
import { auth } from "@/src/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type GhostDirectoryUser = {
  uid: string;
  displayName?: string;
  photoURL?: string;
};

type UserListProps = {
  selectedUid: string;
  onSelect: (uid: string) => void;
};

export default function UserList({ selectedUid, onSelect }: UserListProps) {
  const [users, setUsers] = useState<GhostDirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          setUsers([]);
          return;
        }
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(
            res.status === 401 || res.status === 403 ? "Unauthorized" : "Failed to load users"
          );
        }
        const data = (await res.json()) as { users?: GhostDirectoryUser[] };
        const list = Array.isArray(data.users) ? data.users : [];
        if (!cancelled) setUsers(list);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load users");
          setUsers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      aria-label="Contacts"
      className="flex max-h-[min(80vh,560px)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="shrink-0 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-amber-600/90 dark:text-amber-400/90">
          Contacts
        </h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-2 py-1 font-mono text-xs text-zinc-500">Loading…</p>
        ) : error ? (
          <p className="px-2 py-1 font-mono text-xs text-red-600 dark:text-red-400">{error}</p>
        ) : users.length === 0 ? (
          <p className="px-2 py-1 font-mono text-xs text-zinc-500">No other users yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {users.map((u) => {
              const active = selectedUid.trim() === u.uid;
              const title = u.displayName?.trim() || u.uid;
              return (
                <li key={u.uid}>
                  <button
                    type="button"
                    onClick={() => onSelect(u.uid)}
                    className={
                      active
                        ? "w-full rounded-lg bg-amber-500/15 px-2 py-2 text-left font-mono text-xs text-zinc-900 ring-1 ring-amber-500/40 transition dark:text-zinc-100"
                        : "w-full rounded-lg px-2 py-2 text-left font-mono text-xs text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }
                  >
                    <span className="block truncate font-medium">{title}</span>
                    <span className="mt-0.5 block truncate text-[10px] text-zinc-500">{u.uid}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
