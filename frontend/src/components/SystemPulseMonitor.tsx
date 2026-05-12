"use client";

export type SystemPulseLog = {
  at: number;
} & Record<string, unknown>;

type SystemPulseMonitorProps = {
  pulses: SystemPulseLog[];
};

function formatLine(pulse: SystemPulseLog): string {
  const { at, ...rest } = pulse;
  const stamp = new Date(at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const tail = Object.keys(rest).length ? JSON.stringify(rest) : "{}";
  return `[${stamp}] ${tail}`;
}

export default function SystemPulseMonitor({ pulses }: SystemPulseMonitorProps) {
  return (
    <section
      aria-label="System pulse monitor"
      className="flex max-h-64 flex-col overflow-hidden rounded-xl border border-zinc-300 bg-zinc-950 text-zinc-100 shadow-sm dark:border-zinc-700"
    >
      <header className="border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-amber-400/90">
          System pulse
        </h2>
        <p className="font-mono text-[10px] text-zinc-500">backend lifecycle · broadcast stream</p>
      </header>
      <div
        className="overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-zinc-300"
        style={{ fontFamily: "var(--font-geist-mono), ui-monospace, monospace" }}
      >
        {pulses.length === 0 ? (
          <p className="text-zinc-500">No pulses yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {pulses.map((pulse, index) => (
              <li key={`${pulse.at}-${index}`} className="list-none whitespace-pre-wrap break-all">
                {formatLine(pulse)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
