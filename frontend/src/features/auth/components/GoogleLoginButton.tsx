"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/src/lib/firebase";
import { loginWithFirebaseToken } from "@/src/features/auth/api/loginWithFirebaseToken";

export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function GoogleLoginButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      await loginWithFirebaseToken(token);
      router.push("/console");
    } catch (_error) {
      setErrorMessage("Google login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 font-mono text-sm font-medium text-zinc-900 shadow-sm outline-none transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-400/60 disabled:pointer-events-none disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500/50"
      >
        <GoogleMark className="h-5 w-5 shrink-0" />
        {isLoading ? (
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
        You&apos;ll be redirected to the Ghost console after a successful sign-in.
      </p>
    </div>
  );
}
