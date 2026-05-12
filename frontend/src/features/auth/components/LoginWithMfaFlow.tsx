"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getIdToken, signInWithPopup, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";
import { auth, googleProvider } from "@/src/lib/firebase";
import { createAuthenticatedSocket } from "@/src/lib/sockets";
import { loginWithFirebaseToken } from "@/src/features/auth/api/loginWithFirebaseToken";
import { postMfaStart, postMfaVerify } from "@/src/features/auth/api/mfaApi";
import { GoogleMark } from "@/src/features/auth/components/GoogleLoginButton";

const E164_RE = /^\+[1-9]\d{6,14}$/;

function pulseLine(log: unknown): string {
  if (log && typeof log === "object") {
    const o = log as { line?: string; message?: string; type?: string };
    if (typeof o.line === "string" && o.line.length > 0) return o.line;
    if (typeof o.message === "string" && o.message.length > 0) {
      const tag = typeof o.type === "string" && o.type.length > 0 ? `[${o.type}] ` : "";
      return `${tag}${o.message}`;
    }
  }
  return JSON.stringify(log);
}

export default function LoginWithMfaFlow() {
  const router = useRouter();
  const [step, setStep] = useState<"google" | "mfa">("google");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sendSmsLoading, setSendSmsLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [mfaLogs, setMfaLogs] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (step !== "mfa") return;

    let cancelled = false;
    void createAuthenticatedSocket().then((socket) => {
      if (cancelled) {
        socket.disconnect();
        return;
      }
      socketRef.current = socket;
      socket.on("system:pulse", (log: unknown) => {
        const line = pulseLine(log);
        setMfaLogs((prev) => [...prev.slice(-12), line]);
      });
    });

    return () => {
      cancelled = true;
      const s = socketRef.current;
      socketRef.current = null;
      if (s) {
        s.removeAllListeners();
        s.disconnect();
      }
    };
  }, [step]);

  const disconnectSocket = useCallback(() => {
    const s = socketRef.current;
    socketRef.current = null;
    if (s) {
      s.removeAllListeners();
      s.disconnect();
    }
  }, []);

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage(null);
      const result = await signInWithPopup(auth, googleProvider);
      const token = await getIdToken(result.user);
      await loginWithFirebaseToken(token);
      setStep("mfa");
      setMfaLogs([]);
    } catch {
      setErrorMessage("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSendSms = async () => {
    const user = auth.currentUser;
    if (!user) {
      setErrorMessage("Session lost. Sign in with Google again.");
      setStep("google");
      return;
    }
    const phone = phoneNumber.trim();
    if (!E164_RE.test(phone)) {
      setErrorMessage("Use E.164 format, e.g. +20101234567");
      return;
    }
    try {
      setSendSmsLoading(true);
      setErrorMessage(null);
      const token = await getIdToken(user);
      await postMfaStart(token, phone);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not send SMS code.");
    } finally {
      setSendSmsLoading(false);
    }
  };

  const handleVerify = async () => {
    const user = auth.currentUser;
    if (!user) {
      setErrorMessage("Session lost. Sign in with Google again.");
      setStep("google");
      return;
    }
    const phone = phoneNumber.trim();
    const c = code.trim();
    if (!E164_RE.test(phone)) {
      setErrorMessage("Use E.164 format for the phone number.");
      return;
    }
    if (!/^\d{4,10}$/.test(c)) {
      setErrorMessage("Enter the 4–10 digit code from your SMS.");
      return;
    }
    try {
      setVerifyLoading(true);
      setErrorMessage(null);
      const token = await getIdToken(user);
      await postMfaVerify(token, phone, c);
      disconnectSocket();
      router.push("/console");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleUseDifferentAccount = async () => {
    disconnectSocket();
    await signOut(auth);
    setStep("google");
    setPhoneNumber("");
    setCode("");
    setMfaLogs([]);
    setErrorMessage(null);
  };

  const mfaBusy = sendSmsLoading || verifyLoading;

  if (step === "google") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 font-mono text-sm font-medium text-zinc-900 shadow-sm outline-none transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400/60 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500/50"
        >
          <GoogleMark className="h-5 w-5 shrink-0" />
          {googleLoading ? (
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-600 dark:border-t-zinc-200"
                aria-hidden
              />
              Signing in…
            </span>
          ) : (
            "Continue with Google"
          )}
        </button>
        {errorMessage ? (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-800 dark:border-red-900/80 dark:bg-red-950/50 dark:text-red-300"
          >
            {errorMessage}
          </div>
        ) : null}
        <p className="text-center font-mono text-[10px] text-zinc-500 dark:text-zinc-500">
          Next: SMS verification (Twilio) before opening the Ghost console.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
        Step 2 — verify your phone. Use the same number you will receive codes on.
      </p>

      <div className="flex flex-col gap-2">
        <label className="font-mono text-xs text-zinc-600 dark:text-zinc-400" htmlFor="mfa-phone">
          Phone (E.164)
        </label>
        <input
          id="mfa-phone"
          type="tel"
          autoComplete="tel"
          placeholder="+20101234567"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => void handleSendSms()}
          disabled={mfaBusy}
          className="rounded-lg border border-zinc-300 bg-zinc-900 px-3 py-2 font-mono text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          {sendSmsLoading ? "Sending…" : "Send verification SMS"}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-mono text-xs text-zinc-600 dark:text-zinc-400" htmlFor="mfa-code">
          SMS code
        </label>
        <input
          id="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => void handleVerify()}
          disabled={mfaBusy}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          {verifyLoading ? "Verifying…" : "Verify & open console"}
        </button>
      </div>

      {mfaLogs.length > 0 ? (
        <div
          aria-label="MFA system pulses"
          className="max-h-32 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900/60"
        >
          <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Live pulses
          </p>
          <ul className="flex flex-col gap-0.5 font-mono text-[10px] leading-snug text-zinc-700 dark:text-zinc-300">
            {mfaLogs.map((line, i) => (
              <li key={`${i}-${line.slice(0, 24)}`} className="list-none break-all">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-mono text-xs text-red-800 dark:border-red-900/80 dark:bg-red-950/50 dark:text-red-300"
        >
          {errorMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void handleUseDifferentAccount()}
        className="text-center font-mono text-xs text-zinc-500 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        Use a different Google account
      </button>
    </div>
  );
}
