"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/src/lib/firebase";
import { loginWithFirebaseToken } from "@/src/features/auth/api/loginWithFirebaseToken";

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
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="rounded-lg bg-black px-6 py-3 text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isLoading ? "Signing in..." : "Continue with Google"}
      </button>
      {errorMessage ? (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      ) : null}
    </div>
  );
}
