import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-ledger [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <p aria-hidden className="font-display text-[6rem] leading-none font-semibold tracking-[-0.05em] text-gold-ink italic">
        404
      </p>
      <div className="space-y-2">
        <h1 className="font-display text-3xl leading-tight font-medium tracking-[-0.02em]">
          Not in the <em className="text-gold-ink">ledger</em>
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          That page does not exist. Your data is untouched.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to the dashboard</Link>
      </Button>
    </div>
  );
}
