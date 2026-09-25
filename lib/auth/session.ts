/**
 * Stateless session tokens, signed with HMAC-SHA256. There is no session table:
 * the cookie carries its own expiry and a signature only this server can make.
 * Uses Web Crypto so it runs unchanged in the Node and proxy runtimes.
 */

export const SESSION_COOKIE = "finance_session";

/** How long a sign-in lasts before the password is needed again. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const TOKEN_VERSION = "v1";

/**
 * Loads the signing secret, failing loudly rather than signing with a default.
 *
 * @returns The configured session secret.
 */
function getSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set it to at least 32 random characters.",
    );
  }

  return secret;
}

/**
 * Signs a payload with the session secret.
 *
 * @param payload - The string to authenticate.
 * @returns The signature, base64url encoded.
 */
async function sign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Compares two strings without leaking their difference through timing.
 *
 * @param a - First string.
 * @param b - Second string.
 * @returns True when the strings are identical.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Comparing lengths first would leak length, so fold it into the accumulator.
  let mismatch = a.length ^ b.length;

  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    mismatch |= a.charCodeAt(i % a.length || 0) ^ b.charCodeAt(i % b.length || 0);
  }

  return mismatch === 0;
}

/**
 * Mints a signed token that expires after `SESSION_MAX_AGE_SECONDS`.
 *
 * @returns The cookie value to set.
 */
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${TOKEN_VERSION}.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

/**
 * Checks a token's signature and expiry.
 *
 * @param token - The cookie value, or undefined when absent.
 * @returns True when the token is authentic and still valid.
 */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [version, expiresAt, signature] = parts;
  if (version !== TOKEN_VERSION) return false;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  const expected = await sign(`${version}.${expiresAt}`);
  return timingSafeEqual(signature, expected);
}
