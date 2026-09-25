"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { VaultDial } from "@/components/brand/vault-dial";
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
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 text-center">
      <VaultDial state="jammed" className="size-28" />

      <div className="space-y-2">
        <h1 className="font-display text-4xl leading-tight">
          Something <em className="text-destructive">jammed</em>
        </h1>
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
