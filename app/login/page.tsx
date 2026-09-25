import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { isAuthConfigured } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

/**
 * The lock screen guarding every other route.
 *
 * @param props - Search params carrying the post-login destination.
 * @returns The sign-in page.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const configured = isAuthConfigured();

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <BrandMark className="size-10" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Sign in to Finance</h1>
            <p className="text-sm text-muted-foreground">Enter your password to continue.</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          {configured ? (
            <LoginForm next={next} />
          ) : (
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">This deployment is not protected</p>
                <p className="text-muted-foreground">
                  Set <code className="font-mono text-xs">APP_PASSWORD</code> and{" "}
                  <code className="font-mono text-xs">SESSION_SECRET</code> in your environment
                  variables, then redeploy. Until then the app will not serve any data.
                </p>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          You stay signed in for 30 days on this device.
        </p>
      </div>
    </main>
  );
}
