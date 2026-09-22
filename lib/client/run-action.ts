"use client";

import { toast } from "sonner";

import type { ActionResult } from "@/lib/validations/common";

type Messages<T> = {
  /** Shown on success. A function receives the action's payload. */
  success?: string | ((data: T) => string);
  description?: string;
};

/**
 * Runs a server action and surfaces its outcome as a toast, so every call site
 * reports failure the same way instead of inventing its own handling.
 *
 * @param run - Thunk invoking the server action.
 * @param messages - Optional success text; errors use the action's own message.
 * @returns The action payload on success, or null when it failed.
 */
export async function runAction<T>(
  run: () => Promise<ActionResult<T>>,
  messages: Messages<T> = {},
): Promise<T | null> {
  const result = await run();

  if (!result.ok) {
    toast.error(result.error);
    return null;
  }

  if (messages.success) {
    const text =
      typeof messages.success === "function" ? messages.success(result.data) : messages.success;
    toast.success(text, messages.description ? { description: messages.description } : undefined);
  }

  return result.data;
}
