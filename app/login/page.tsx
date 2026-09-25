import type { Metadata } from "next";
import { AlertTriangle, Wallet } from "lucide-react";

import styles from "@/components/auth/lock-screen.module.css";
import { LoginForm } from "@/components/auth/login-form";
import { VaultDial } from "@/components/brand/vault-dial";
import { VaultScene } from "@/components/auth/vault-scene";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { isAuthConfigured } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

/** What sits behind the lock, as a row of chips beside the headline. */
const FEATURES = NAV_ITEMS.filter((item) => item.href !== "/" && item.href !== "/settings");

/**
 * Shown instead of the form when no password is configured, so an unprotected
 * deployment explains itself rather than serving data.
 *
 * @returns The jammed dial and setup instructions.
 */
function UnprotectedNotice() {
  return (
    <div className="flex flex-col items-center text-center">
      <VaultDial state="jammed" className="-mt-[82px] size-[164px] sm:-mt-[92px] sm:size-[184px]" />

      <h1 className={cn(styles.display, "mt-6 text-[2.15rem] leading-[1.08] sm:text-[2.5rem]")}>
        This vault has <em className="text-destructive">no lock.</em>
      </h1>

      <div className="mt-6 flex gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-left">
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
    </div>
  );
}

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
    <main className={cn(styles.screen, "relative flex min-h-dvh flex-col overflow-hidden")}>
      <VaultScene />

      <header className="relative z-20 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Wallet className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Finance</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 pt-6 pb-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-20 lg:pb-24">
        <div className="hidden pl-10 lg:block">
          <p
            className={cn(
              styles.enter,
              "flex items-center gap-3 text-[11px] font-semibold tracking-[0.24em] text-muted-foreground uppercase",
            )}
          >
            <span className={cn(styles.goldRule, "h-px w-8")} />
            Personal ledger
          </p>
          <p
            className={cn(styles.display, styles.enter, "mt-6 text-6xl leading-[1.02] xl:text-7xl")}
            style={{ "--i": 1 } as React.CSSProperties}
          >
            Every coin counted.
            <br />
            <em className={styles.goldInk}>Every month remembered.</em>
          </p>
          <p
            className={cn(styles.enter, "mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground")}
            style={{ "--i": 2 } as React.CSSProperties}
          >
            Budgets, sinking funds, savings goals, investments and net worth — one persistent
            history you can browse month by month.
          </p>
          <ul className="mt-8 flex max-w-lg flex-wrap gap-2">
            {FEATURES.map((feature, i) => (
              <li
                key={feature.href}
                className={cn(
                  styles.enter,
                  "inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground/80 backdrop-blur-sm",
                )}
                style={{ "--i": 3 + i * 0.5 } as React.CSSProperties}
              >
                <feature.icon className={cn(styles.goldInk, "size-3.5")} />
                {feature.label}
              </li>
            ))}
          </ul>
        </div>

        <section
          className={cn(
            styles.card,
            styles.enter,
            "relative mt-[82px] w-full max-w-[400px] justify-self-center rounded-[1.75rem] bg-card/75 px-6 pb-6 backdrop-blur-xl sm:mt-[92px] sm:px-8 sm:pb-7 dark:bg-card/60",
          )}
          style={{ "--i": 1 } as React.CSSProperties}
        >
          {configured ? <LoginForm next={next} /> : <UnprotectedNotice />}
        </section>
      </div>
    </main>
  );
}
