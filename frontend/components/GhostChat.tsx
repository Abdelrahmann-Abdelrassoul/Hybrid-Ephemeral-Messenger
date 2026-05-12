export type GhostChatMessage = {
  id: string;
  body: string;
  sentAt?: number;
};

type GhostChatProps = {
  messages?: GhostChatMessage[];
};

export default function GhostChat({ messages = [] }: GhostChatProps) {
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
          volatile · not persisted in UI state across refresh
        </p>
      </header>
      <div className="flex flex-1 flex-col overflow-hidden">
        <ul
          className="font-mono flex flex-1 flex-col gap-1 overflow-y-auto p-3 text-sm leading-relaxed"
          style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
        >
          {messages.length === 0 ? (
            <li className="list-none text-zinc-500">
              <span className="text-emerald-600/80 dark:text-emerald-500/80">$</span>{" "}
              Waiting for signals…
            </li>
          ) : (
            messages.map((m) => (
              <li key={m.id} className="list-none break-words border-l-2 border-emerald-600/40 pl-2">
                <span className="text-zinc-500">
                  {m.sentAt != null
                    ? new Date(m.sentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "—"}
                </span>{" "}
                <span className="text-zinc-100">{m.body}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
