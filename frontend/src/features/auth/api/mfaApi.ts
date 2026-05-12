const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function readJson(res: Response): Promise<{ message?: string } & Record<string, unknown>> {
  try {
    return (await res.json()) as { message?: string } & Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function postMfaStart(idToken: string, phoneNumber: string): Promise<unknown> {
  const res = await fetch(`${API_URL}/auth/mfa/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phoneNumber }),
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(typeof data.message === "string" ? data.message : "MFA start failed");
  }
  return data;
}

export async function postMfaVerify(
  idToken: string,
  phoneNumber: string,
  code: string
): Promise<unknown> {
  const res = await fetch(`${API_URL}/auth/mfa/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phoneNumber, code }),
  });
  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(typeof data.message === "string" ? data.message : "MFA verify failed");
  }
  return data;
}
