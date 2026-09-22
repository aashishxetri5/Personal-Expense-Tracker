"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * A missing or unreachable DATABASE_URL is by far the most likely cause here,
 * so the copy points at it rather than showing a bare stack trace.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const looksLikeDatabase =
    /DATABASE_URL|connect|ECONNREFUSED|P1001|P1000|prisma/i.test(error.message);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </span>

      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {looksLikeDatabase
            ? "The app could not reach the database. Check that DATABASE_URL is set and that migrations have been applied."
            : "That page could not be loaded. Trying again usually helps."}
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>
        ) : null}
      </div>

      <Button onClick={reset}>
        <RotateCcw /> Try again
      </Button>
    </div>
  );
}
