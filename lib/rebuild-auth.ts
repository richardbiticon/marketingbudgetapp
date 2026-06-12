// MMC Rebuild gate. This is a thin shared-password gate for an internal tool,
// not real security. Per-user auth (Auth.js) is the upgrade path. The signed
// cookie just proves the holder typed the password once in the last 30 days.
// Uses Web Crypto so it runs in both Node route handlers and edge middleware.

const COOKIE = "mmc_session";
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

function secret(): string {
  // Derive the signing secret from the password itself. Acceptable for a thin
  // gate; a dedicated secret comes with real auth.
  return "mmc:" + (process.env.REBUILD_PASSWORD ?? "");
}

async function hmac(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  // Hex encoding: works identically in Node and edge runtimes.
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function makeToken(): Promise<string> {
  const exp = Date.now() + THIRTY_DAYS_S * 1000;
  return `${exp}.${await hmac(String(exp))}`;
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.REBUILD_PASSWORD) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  return (await hmac(exp)) === sig;
}

export const REBUILD_COOKIE = COOKIE;
export const REBUILD_COOKIE_MAX_AGE = THIRTY_DAYS_S;
