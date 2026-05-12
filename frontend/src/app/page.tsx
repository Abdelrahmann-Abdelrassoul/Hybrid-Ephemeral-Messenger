import LoginWithMfaFlow from "@/src/features/auth/components/LoginWithMfaFlow";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      {/* Base wash */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-50 via-zinc-100 to-zinc-200/90 dark:from-black dark:via-zinc-950 dark:to-zinc-950"
        aria-hidden
      />
      {/* Soft glow orbs */}
      <div
        className="pointer-events-none absolute -left-1/4 top-0 h-[min(85vw,520px)] w-[min(85vw,520px)] rounded-full bg-emerald-400/22 blur-3xl dark:bg-emerald-500/14 dark:blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[min(70vw,440px)] w-[min(70vw,440px)] rounded-full bg-teal-500/18 blur-3xl dark:bg-teal-500/12 dark:blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-zinc-400/15 blur-2xl dark:bg-zinc-100/5"
        aria-hidden
      />
      {/* Top radial highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[45vh] bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(16,185,129,0.16),transparent)] dark:bg-[radial-gradient(ellipse_65%_55%_at_50%_0%,rgba(16,185,129,0.09),transparent)]"
        aria-hidden
      />
      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.07)_1px,transparent_1px)] bg-[length:48px_48px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)]"
        aria-hidden
      />
      {/* Diagonal sheen */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.35)_50%,transparent_60%)] opacity-40 dark:bg-[linear-gradient(115deg,transparent_42%,rgba(255,255,255,0.04)_50%,transparent_58%)] dark:opacity-100"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col justify-center p-6">
        <div className="mx-auto flex w-full max-w-md flex-col justify-center">
          <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white/90 shadow-lg shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-950/80 dark:shadow-black/40">
            <header className="border-b border-zinc-200/90 bg-zinc-50/90 px-6 py-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-emerald-600/95 dark:text-emerald-400/90">
                Hybrid ephemeral
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Messenger
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Sign in with Google, confirm SMS (Twilio Verify), then open the Ghost console—ephemeral
                chat, presence, and system pulse.
              </p>
            </header>

            <div className="px-6 py-8">
              <LoginWithMfaFlow />
            </div>

            <footer className="border-t border-zinc-200/90 bg-zinc-50/70 px-6 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/35">
              <p className="font-mono text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                Session via Firebase · Same zinc / mono visual language as the console
              </p>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
