"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/actions/auth";

/**
 * Ends the session and returns to the lock screen.
 *
 * @param props - Button size and whether to show the label beside the icon.
 * @returns The sign-out control.
 */
export function SignOutButton({
  withLabel = false,
  size = "icon-sm",
}: {
  withLabel?: boolean;
  size?: "icon-sm" | "sm";
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const handleSignOut = async () => {
    setPending(true);
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleSignOut}
      loading={pending}
      aria-label="Sign out"
      title="Sign out"
    >
      <LogOut />
      {withLabel ? "Sign out" : null}
    </Button>
  );
}
