import { z } from "zod";

/** The result shape every server action returns. */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** `YYYY-MM-DD`, validated as a real calendar date. */
export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "That date does not exist");

/** `YYYY-MM`. */
export const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use the format YYYY-MM");

/** A money amount that must be greater than zero. Capped to fit Decimal(14,2). */
export const amountSchema = z.coerce
  .number({ message: "Enter an amount" })
  .refine(Number.isFinite, "Enter a valid number")
  .min(0.01, "Amount must be greater than zero")
  .max(999_999_999_999, "That amount is too large");

/** Like `amountSchema`, but zero is allowed — for targets and planned figures. */
export const nonNegativeAmountSchema = z.coerce
  .number({ message: "Enter an amount" })
  .refine(Number.isFinite, "Enter a valid number")
  .min(0, "Amount cannot be negative")
  .max(999_999_999_999, "That amount is too large");

/** Allows negatives — liabilities and balance adjustments. */
export const signedAmountSchema = z.coerce
  .number({ message: "Enter an amount" })
  .refine(Number.isFinite, "Enter a valid number")
  .min(-999_999_999_999)
  .max(999_999_999_999);

export const cuidSchema = z.string().min(1, "Required");

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex colour like #6366f1");

export const shortTextSchema = z.string().trim().max(120, "Keep this under 120 characters");

/**
 * An optional foreign key. A missing key, an empty string and null all become
 * null, so a caller need not spell out every link it is not using.
 *
 * `.nullish()` must precede `.transform()`: a transform wraps the schema in a
 * pipe, and Zod treats a pipe as a required object key.
 */
export const optionalId = z
  .string()
  .nullish()
  .transform((value) => (value && value.length > 0 ? value : null));

/**
 * Builds a schema for optional free text.
 *
 * @param max - Maximum length allowed.
 * @param message - Optional override for the length error.
 * @returns A schema where missing, empty and null all normalise to null.
 */
export function optionalText(max: number, message?: string) {
  return z
    .string()
    .trim()
    .max(max, message ?? `Keep this under ${max} characters`)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null));
}

/** An optional `YYYY-MM-DD`; a cleared date input sends an empty string. */
export const optionalDateKey = z
  .union([dateKeySchema, z.literal("")])
  .nullish()
  .transform((value) => (value ? value : null));

export const longTextSchema = optionalText(2000);

/**
 * Wraps a successful payload in the shared action result.
 *
 * @param data - The value to return to the caller.
 * @returns A successful action result.
 */
export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/**
 * Wraps a failure in the shared action result.
 *
 * @param error - Message safe to show a person.
 * @param fieldErrors - Optional per-field messages for the form.
 * @returns A failed action result.
 */
export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/**
 * Flattens a Zod error into the field-keyed map the forms consume.
 *
 * @param error - The validation error.
 * @returns Messages keyed by field path, with `_form` for top-level issues.
 */
export function flattenIssues(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }

  return fieldErrors;
}
