"use server";

import { z } from "zod";

import { endSession, isAuthConfigured, passwordMatches, startSession } from "@/lib/auth/server";
import { parseInput } from "@/lib/actions/helpers";
import { actionError, actionOk, type ActionResult } from "@/lib/validations/common";

const signInSchema = z.object({
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

/**
 * Attempts to throttle brute force. This lives in memory, so it resets on
 * redeploy and is per-instance on serverless — a strong password is the real
 * defence; this only slows a casual attempt.
 */
const attempts = new Map<string, { count: number; blockedUntil: number }>();

const MAX_ATTEMPTS = 8;
const BLOCK_MS = 5 * 60 * 1000;

/**
 * Records a failed attempt and reports whether the caller is now blocked.
 *
 * @param key - Identifier for the caller, typically their IP address.
 * @returns Milliseconds remaining in the block, or 0 when not blocked.
 */
function registerFailure(key: string): number {
  const now = Date.now();
  const entry = attempts.get(key) ?? { count: 0, blockedUntil: 0 };

  if (entry.blockedUntil > now) return entry.blockedUntil - now;

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
    entry.count = 0;
  }

  attempts.set(key, entry);
  return entry.blockedUntil > now ? entry.blockedUntil - now : 0;
}

/**
 * Signs in with the shared password and starts a session.
 *
 * @param input - The submitted password and optional post-login destination.
 * @returns Where to navigate on success, or a failure to show on the form.
 */
export async function signIn(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = parseInput(signInSchema, input);
  if (!parsed.ok) return parsed.result;

  if (!isAuthConfigured()) {
    return actionError("This deployment has no APP_PASSWORD set. Add one and redeploy.");
  }

  const { headers } = await import("next/headers");
  const headerList = await headers();
  const caller = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const blocked = attempts.get(caller);
  if (blocked && blocked.blockedUntil > Date.now()) {
    const minutes = Math.ceil((blocked.blockedUntil - Date.now()) / 60_000);
    return actionError(`Too many attempts. Try again in ${minutes} minute(s).`);
  }

  if (!passwordMatches(parsed.data.password)) {
    const remaining = registerFailure(caller);
    if (remaining > 0) {
      return actionError(`Too many attempts. Try again in ${Math.ceil(remaining / 60_000)} minute(s).`);
    }
    return actionError("That password is not right.");
  }

  attempts.delete(caller);
  await startSession();

  // Only same-origin paths, so a crafted ?next= cannot bounce elsewhere.
  const next = parsed.data.next;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return actionOk({ redirectTo: safeNext });
}

/**
 * Signs the current visitor out.
 *
 * @returns A successful result once the session cookie is cleared.
 */
export async function signOut(): Promise<ActionResult<{ ok: true }>> {
  await endSession();
  return actionOk({ ok: true } as const);
}
