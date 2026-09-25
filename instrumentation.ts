/**
 * Runs once when the server starts. Opening the database pool and loading the
 * query engine here means the first visitor does not pay for it — cold, that
 * first query costs several hundred milliseconds on its own.
 *
 * Deliberately not awaited: `register` must finish before the server accepts
 * requests, and an unreachable database must never hold up startup.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;

  void import("@/lib/db/prisma")
    .then(({ prisma }) => prisma.user.findFirst({ select: { id: true } }))
    .catch((error: Error) => {
      // The first request simply retries.
      console.warn("Database warm-up skipped:", error.message);
    });
}
