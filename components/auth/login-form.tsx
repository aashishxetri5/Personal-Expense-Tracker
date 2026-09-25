"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, KeyRound, LockOpen, ShieldCheck } from "lucide-react";

import styles from "@/components/auth/lock-screen.module.css";
import { VaultDial } from "@/components/auth/vault-dial";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type Status = "idle" | "pending" | "error" | "success";

const COPY: Record<Status, { lead: string; accent: string; sub: string }> = {
  idle: { lead: "Your vault is", accent: "locked.", sub: "Enter your password to open the books." },
  pending: { lead: "Your vault is", accent: "locked.", sub: "Trying the combination…" },
  error: { lead: "Your vault is", accent: "locked.", sub: "Enter your password to open the books." },
  success: { lead: "Welcome", accent: "back.", sub: "Unlocked — opening your ledger…" },
};

/**
 * Password form for the single shared login, fronted by a vault dial that
 * turns as you type and swings open on success.
 *
 * @param props - Where to navigate after a successful sign-in.
 * @returns The dial, heading and form.
 */
export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [revealed, setRevealed] = React.useState(false);
  const [capsLock, setCapsLock] = React.useState(false);

  const copy = COPY[status];

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "pending" || status === "success") return;

    setStatus("pending");
    setError(null);

    const result = await signIn({ password, next });

    if (!result.ok) {
      setError(result.error);
      setPassword("");
      setStatus("error");
      inputRef.current?.focus();
      return;
    }

    setStatus("success");
    // Replace, so the back button does not return to the login screen.
    router.replace(result.data.redirectTo);
    router.refresh();
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (status === "error") setStatus("idle");
  };

  const onKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState("CapsLock"));
  };

  return (
    <div className="flex flex-col items-center text-center">
      <VaultDial
        turns={password.length}
        state={status}
        className="-mt-[82px] size-[164px] sm:-mt-[92px] sm:size-[184px]"
      />

      <h1 className={cn(styles.display, "mt-6 text-[2.15rem] leading-[1.08] sm:text-[2.5rem]")}>
        {copy.lead} <em className={styles.goldInk}>{copy.accent}</em>
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{copy.sub}</p>

      <form onSubmit={onSubmit} className="mt-7 w-full space-y-4 text-left">
        <Field
          label="Password"
          htmlFor="password"
          error={error ?? undefined}
          hint={capsLock ? "Caps Lock is on" : undefined}
          required
        >
          <div className="relative">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              id="password"
              type={revealed ? "text" : "password"}
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={onChange}
              onKeyDown={onKey}
              onKeyUp={onKey}
              onBlur={() => setCapsLock(false)}
              disabled={status === "success"}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "password-error" : capsLock ? "password-hint" : undefined}
              placeholder="••••••••••••"
              className={cn(
                "h-12 rounded-xl bg-background/70 pr-12 pl-10 text-base",
                !revealed && password.length > 0 && "tracking-[0.25em]",
              )}
            />
            <button
              type="button"
              onClick={() => setRevealed((value) => !value)}
              aria-label={revealed ? "Hide password" : "Show password"}
              aria-pressed={revealed}
              className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <Button
          type="submit"
          size="lg"
          loading={status === "pending"}
          disabled={password.length === 0 && status !== "success"}
          className={cn(
            styles.unlock,
            "h-12 w-full",
            status === "success" && "bg-success text-success-foreground hover:bg-success",
          )}
        >
          {status === "success" ? (
            <>
              <LockOpen /> Unlocked
            </>
          ) : (
            <>
              Unlock vault <ArrowRight className={styles.arrow} />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 flex w-full items-center justify-center gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" />
        Stays unlocked for 30 days on this device
      </p>

      <p className="sr-only" aria-live="polite">
        {status === "pending" ? "Checking password" : status === "success" ? "Unlocked. Opening your workspace." : ""}
      </p>
    </div>
  );
}
