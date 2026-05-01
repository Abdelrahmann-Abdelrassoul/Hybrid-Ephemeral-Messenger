const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function loginWithFirebaseToken(token: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Backend login failed.");
  }
}
