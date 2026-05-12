"use client";

export type SystemPulseLog = {
  at?: number;
  timestamp?: number;
} & Record<string, unknown>;

type SystemPulseMonitorProps = {
  logs: SystemPulseLog[];
};

function formatLine(pulse: SystemPulseLog): string {
  const p = pulse as SystemPulseLog & {
    line?: string;
    message?: string;
    type?: string;
  };
  const t =
    typeof p.timestamp === "number"
      ? p.timestamp
      : typeof p.at === "number"
        ? p.at
        : Date.now();
  const stamp = new Date(t).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  if (typeof p.message === "string" && p.message.length > 0) {
    const tag = typeof p.type === "string" && p.type.length > 0 ? `[${p.type}] ` : "";
    return `[${stamp}] ${tag}${p.message}`;
  }
  if (typeof p.line === "string") {
    return `[${stamp}] ${p.line}`;
  }
  const { timestamp: _ts, at: _at, line: _ln, message: _m, type: _ty, ...rest } = p;
  const tail = Object.keys(rest).length ? JSON.stringify(rest) : "{}";
  return `[${stamp}] ${tail}`;
}

export default function SystemPulseMonitor({ logs }: SystemPulseMonitorProps) {
  return (
    <section
      aria-label="System pulse monitor"
      className="flex h-[80vh] flex-col overflow-hidden rounded-xl border border-zinc-300 bg-zinc-950 text-zinc-100 shadow-sm dark:border-zinc-700"
    >
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-amber-400/90">
          System pulse
        </h2>
        <p className="font-mono text-[10px] text-zinc-500">backend lifecycle · broadcast stream</p>
      </header>
      <div
        className="min-h-0 flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-zinc-300"
        style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
      >
        {logs.length === 0 ? (
          <p className="text-zinc-500">No pulses yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {logs.map((pulse, index) => (
              <li
                key={`${(pulse as { timestamp?: number }).timestamp ?? pulse.at ?? index}-${index}`}
                className="list-none whitespace-pre-wrap break-all"
              >
                {formatLine(pulse)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
