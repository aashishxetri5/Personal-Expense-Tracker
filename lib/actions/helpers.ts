import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, flattenIssues, type ActionResult } from "@/lib/validations/common";

/**
 * Refreshes every screen after a mutation. Financial data is cross-cutting, so
 * one transaction changes the dashboard, budget, funds and reports at once.
 *
 * @returns Nothing; failures outside a request scope are ignored.
 */
export function revalidateFinance(): void {
  try {
    // `refresh` re-renders the route the user is on; `revalidatePath` clears
    // cached data beneath the layout, which the export handlers read.
    refresh();
    revalidatePath("/", "layout");
  } catch (error) {
    // Both need a request scope. Scripts have none, and without this guard an
    // already-committed write would be reported as a failure.
    if (process.env.NODE_ENV !== "production") {
      console.warn("Skipped revalidation outside a request scope.", (error as Error).message);
    }
  }
}

type ParseOutcome<T> = { ok: true; data: T } | { ok: false; result: ActionResult<never> };

/**
 * Validates untrusted input and shapes failures into per-field errors.
 *
 * @param schema - Zod schema describing the expected input.
 * @param input - The unvalidated value received from the client.
 * @returns The parsed data, or a ready-to-return error result.
 */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): ParseOutcome<z.infer<T>> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data };

  return {
    ok: false,
    result: actionError("Please fix the highlighted fields.", flattenIssues(parsed.error)),
  };
}

/**
 * Translates a thrown database error into a message worth showing a person,
 * rather than leaking a Prisma error code.
 *
 * @param error - The caught error.
 * @param fallback - Message used when the cause is not recognised.
 * @returns A failed action result.
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

/**
 * Computes the sort position for a newly created row.
 *
 * @param findLast - Returns the highest-sorted existing row, or null.
 * @returns One past the current maximum, or 0 when there are none.
 */
export async function nextSortOrder(
  findLast: () => Promise<{ sortOrder: number } | null>,
): Promise<number> {
  const last = await findLast();
  return (last?.sortOrder ?? -1) + 1;
}
