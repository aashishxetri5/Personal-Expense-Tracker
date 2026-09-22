import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names, letting a later Tailwind utility win over an earlier one.
 *
 * @param inputs - Class values, including conditionals and arrays.
 * @returns The merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Constrains a number to a range.
 *
 * @param value - The number to constrain.
 * @param min - Lower bound.
 * @param max - Upper bound.
 * @returns The value, clamped to [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Expresses one number as a percentage of another.
 *
 * @param part - The portion.
 * @param total - The whole.
 * @returns The percentage, or 0 when `total` is zero.
 */
export function percent(part: number, total: number): number {
  if (!total) return 0;
  return (part / total) * 100;
}

/**
 * Generates a throwaway id for list rows that exist only in the browser.
 *
 * @param prefix - Optional prefix to make the id readable while debugging.
 * @returns A short unique-enough string.
 */
export function localId(prefix = "tmp"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
