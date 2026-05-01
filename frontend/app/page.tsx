"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/src/lib/firebase";

export default function Home() {
  const handleGoogleLogin = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    console.log("Firebase ID token acquired:", token);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <button
        onClick={handleGoogleLogin}
        className="rounded-lg bg-black px-6 py-3 text-white transition hover:opacity-90 dark:bg-white dark:text-black"
      >
        Continue with Google
      </button>
    </main>
  );
}
