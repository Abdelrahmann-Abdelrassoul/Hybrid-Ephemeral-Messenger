import CryptoJS from "crypto-js";

function secret(): string {
  const raw = process.env.NEXT_PUBLIC_GHOST_MESSAGE_SECRET;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }
  return "ghost-dev-secret-change-me";
}

function deriveKey(uidA: string, uidB: string): string {
  const pair = [uidA, uidB].sort().join("|");
  return CryptoJS.SHA256(`${pair}:${secret()}`).toString();
}

export function encryptMessage(message: string, uidA: string, uidB: string): string {
  const key = deriveKey(uidA, uidB);
  return CryptoJS.AES.encrypt(message, key).toString();
}

export function decryptMessage(ciphertext: string, uidA: string, uidB: string): string {
  const key = deriveKey(uidA, uidB);
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const out = bytes.toString(CryptoJS.enc.Utf8);
  if (!out) {
    throw new Error("decrypt failed");
  }
  return out;
}
