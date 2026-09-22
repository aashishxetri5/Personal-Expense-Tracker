import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, flattenIssues, type ActionResult } from "@/lib/validations/common";

/**
 * Financial data is cross-cutting: one transaction changes the dashboard, the
 * budget, the fund balances, the reports and the net-worth page at once. Rather
 * than sprinkle ad-hoc revalidation calls, every mutation refreshes the whole
 * authenticated tree. The pages are server-rendered and cheap, and this removes
 * an entire class of "the number did not update" bugs.
 *
 * `refresh()` re-renders the route the user is looking at, so the new figures
 * appear without a page reload. `revalidatePath` additionally clears cached
 * data beneath the app layout, which is what the export route handlers read.
 */
export function revalidateFinance() {
  try {
    refresh();
    revalidatePath("/", "layout");
  } catch (error) {
    // Both need a request scope. When an action is called from a script (the
    // seed, the verification harness) there is none, and the throw would
    // otherwise turn an already-committed write into a reported failure.
    // Inside the app this branch is unreachable.
    if (process.env.NODE_ENV !== "production") {
      console.warn("Skipped revalidation outside a request scope.", (error as Error).message);
    }
  }
}

/** Parse input with Zod, returning the flat field errors forms expect. */
export function parseInput<T extends z.ZodType>(
  schema: T,
  input: unknown,
): { ok: true; data: z.infer<T> } | { ok: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };

  return {
    ok: false,
    result: actionError("Please fix the highlighted fields.", flattenIssues(parsed.error)),
  };
}

/**
 * Convert a thrown database error into a message worth showing a human.
 * Prisma error codes are deliberately translated rather than leaked.
 */
export function toActionError(error: unknown, fallback: string): ActionResult<never> {
  const code = (error as { code?: string } | null)?.code;

  if (code === "P2002") {
    return actionError("Something with that name already exists. Pick another name.");
  }
  if (code === "P2003" || code === "P2025") {
    return actionError("That record no longer exists. Refresh and try again.");
  }

  console.error(fallback, error);
  return actionError(fallback);
}
