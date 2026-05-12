"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/src/lib/firebase";

export default function GhostConsolePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [label, setLabel] = useState<string | null>(null);

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
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
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
          aria-label="Chat area placeholder"
          className="rounded-xl border border-dashed border-zinc-300 bg-white/60 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-400"
        >
          Chat UI will live here.
        </section>
      </div>
    </main>
  );
}
