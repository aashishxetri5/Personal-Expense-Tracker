import Link from "next/link";

import { VaultDial } from "@/components/brand/vault-dial";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-ledger [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />
      <VaultDial turns={4} className="size-32" />
      <div className="space-y-2">
        <h1 className="font-display text-4xl leading-tight">
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
