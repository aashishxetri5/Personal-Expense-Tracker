import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  timingSafeEqual,
  verifySessionToken,
} from "@/lib/auth/session";

/**
 * Reports whether the app is password protected at all. Deploying without
 * APP_PASSWORD leaves every route open, so this is checked before serving.
 *
 * @returns True when APP_PASSWORD is configured.
 */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

/**
 * Reads the session cookie and validates its signature.
 *
 * @returns True when the caller holds a valid session.
 */
export async function hasSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/**
 * Enforces authentication. Throws rather than redirecting, so a caller that
 * wraps it in try/catch cannot accidentally swallow a Next redirect.
 *
 * @returns Nothing when signed in; throws otherwise.
 */
export async function requireSession(): Promise<void> {
  if (!isAuthConfigured()) {
    throw new Error(
      "APP_PASSWORD is not set. Refusing to serve data on an unprotected deployment.",
    );
  }

  if (!(await hasSession())) {
    throw new Error("Not signed in.");
  }
}

/**
 * Checks a submitted password against the configured one, in constant time.
 *
 * @param password - The password the visitor typed.
 * @returns True when it matches.
 */
export function passwordMatches(password: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(password, expected);
}

/**
 * Signs the visitor in by setting the session cookie.
 *
 * @returns Nothing; the cookie is written to the response.
 */
export async function startSession(): Promise<void> {
  const store = await cookies();

  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Signs the visitor out by clearing the session cookie.
 *
 * @returns Nothing; the cookie is expired on the response.
 */
export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
