"use client";

import { useState } from "react";

export type GhostChatMessage = {
  id: string;
  author: string;
  body: string;
};

type GhostChatProps = {
  messages: GhostChatMessage[];
  onSend: (text: string) => void;
  disabled?: boolean;
};

export default function GhostChat({ messages, onSend, disabled }: GhostChatProps) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const line = draft.trim();
    if (!line || disabled) return;
    onSend(line);
    setDraft("");
  };

  return (
    <section
      aria-label="Ghost chat"
      className="flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-zinc-300 bg-zinc-950 text-zinc-100 shadow-sm dark:border-zinc-700"
    >
      <header className="border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-emerald-400/90">
          Ghost chat
        </h2>
        <p className="font-mono text-[10px] text-zinc-500">
          volatile · plain lines · no bubbles
        </p>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ul
          className="font-mono flex flex-1 flex-col gap-0 overflow-y-auto p-3 text-sm leading-normal"
          style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
        >
          {messages.length === 0 ? (
            <li className="list-none text-zinc-500">
              <span className="text-emerald-600/80 dark:text-emerald-500/80">$</span>{" "}
              Waiting for signals…
            </li>
          ) : (
            messages.map((m) => (
              <li key={m.id} className="list-none whitespace-pre-wrap break-words text-zinc-100">
                [{m.author}]: {m.body}
              </li>
            ))
          )}
        </ul>
      </div>
      <footer className="flex items-center gap-2 border-t border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm">
        <span className="shrink-0 select-none text-emerald-500">&gt;</span>
        <input
          type="text"
          className="min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-50"
          style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
          placeholder="Type message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          aria-label="Message input"
        />
      </footer>
    </section>
  );
}
