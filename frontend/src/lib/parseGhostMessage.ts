export function parseGhostMessagePayload(msg: unknown): { author: string; body: string } | null {
  if (typeof msg === "string") {
    return { author: "?", body: msg };
  }
  if (msg && typeof msg === "object") {
    const o = msg as Record<string, unknown>;
    const body = String(o.text ?? o.body ?? "");
    if (!body) return null;
    const author = String(o.author ?? o.from ?? o.displayName ?? "?");
    return { author, body };
  }
  return null;
}
