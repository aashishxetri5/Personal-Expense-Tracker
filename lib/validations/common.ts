import { z } from "zod";

/** `YYYY-MM-DD`, validated as a real calendar date. */
export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((value) => {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return (
      date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
    );
  }, "That date does not exist");

/** `YYYY-MM`. */
export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use the format YYYY-MM");

/**
 * Money input. Accepts strings from forms, rejects NaN/Infinity, and caps at a
 * value that comfortably fits Decimal(14,2) so the database never rejects a row
 * the UI happily accepted.
 */
export const amountSchema = z
  .coerce.number({ message: "Enter an amount" })
  .refine(Number.isFinite, "Enter a valid number")
  .min(0.01, "Amount must be greater than zero")
  .max(999_999_999_999, "That amount is too large");

/** Like `amountSchema` but allows zero — for targets and planned figures. */
export const nonNegativeAmountSchema = z
  .coerce.number({ message: "Enter an amount" })
  .refine(Number.isFinite, "Enter a valid number")
  .min(0, "Amount cannot be negative")
  .max(999_999_999_999, "That amount is too large");

/** Allows negative values — liabilities and adjustments. */
export const signedAmountSchema = z
  .coerce.number({ message: "Enter an amount" })
  .refine(Number.isFinite, "Enter a valid number")
  .min(-999_999_999_999)
  .max(999_999_999_999);

export const cuidSchema = z.string().min(1, "Required");

/**
 * An optional foreign key.
 *
 * A missing key, an empty string and an explicit null all normalise to null, so
 * callers never have to spell out every link they are not using. `.nullish()`
 * has to come before `.transform()` — a transform wraps the schema in a pipe,
 * and a pipe is treated as a required object key even when its input accepts
 * undefined.
 */
export const optionalId = z
  .string()
  .nullish()
  .transform((value) => (value && value.length > 0 ? value : null));

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex colour like #6366f1");

export const shortTextSchema = z.string().trim().max(120, "Keep this under 120 characters");

/** Optional free text: missing, empty and null all normalise to null. */
export function optionalText(max: number, message?: string) {
  return z
    .string()
    .trim()
    .max(max, message ?? `Keep this under ${max} characters`)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null));
}

export const longTextSchema = optionalText(2000);

/** An optional `YYYY-MM-DD`, where a cleared date input sends an empty string. */
export const optionalDateKey = z
  .union([dateKeySchema, z.literal("")])
  .nullish()
  .transform((value) => (value ? value : null));

/** The result shape every server action returns. */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** Turn a ZodError into the flat field-error map the forms consume. */
export function flattenIssues(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
}
