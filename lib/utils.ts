import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, with later Tailwind utilities winning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into a range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Percentage of `part` out of `total`, guarded against divide-by-zero. */
export function percent(part: number, total: number) {
  if (!total) return 0;
  return (part / total) * 100;
}

/** Stable, dependency-free id for optimistic UI rows. */
export function localId(prefix = "tmp") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
