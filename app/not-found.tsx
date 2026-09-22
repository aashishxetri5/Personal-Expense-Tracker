import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-5" />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">Page not found</h1>
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
