import { decryptMessage } from "@/src/lib/ghostMessageCrypto";

export type GhostDecryptContext = { selfUid: string; peerUid: string };

export function parseGhostMessagePayload(
  msg: unknown,
  decryptContext?: GhostDecryptContext
): { author: string; body: string } | null {
  if (typeof msg === "string") {
    return { author: "?", body: msg };
  }
  if (msg && typeof msg === "object") {
    const o = msg as Record<string, unknown>;
    const hasLegacyPlain =
      (typeof o.text === "string" && o.text.length > 0) ||
      (typeof o.body === "string" && o.body.length > 0);

    if (
      decryptContext &&
      typeof o.content === "string" &&
      o.content.length > 0 &&
      !hasLegacyPlain
    ) {
      try {
        const plain = decryptMessage(
          o.content,
          decryptContext.selfUid,
          decryptContext.peerUid
        );
        const inner = JSON.parse(plain) as { author?: unknown; text?: unknown };
        const body = String(inner.text ?? "");
        if (!body) return null;
        const author = String(inner.author ?? "?");
        return { author, body };
      } catch {
        return null;
      }
    }

    const body = String(o.text ?? o.body ?? "");
    if (!body) return null;
    const author = String(o.author ?? o.from ?? o.displayName ?? "?");
    return { author, body };
  }
  return null;
}
