"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

/**
 * Password form for the single shared login.
 *
 * @param props - Where to navigate after a successful sign-in.
 * @returns The login form.
 */
export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const [capsLock, setCapsLock] = React.useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    // An empty submit is caught here, so it never counts as a failed attempt.
    if (password.length === 0) {
      setError("Enter your password");
      inputRef.current?.focus();
      return;
    }

    setPending(true);
    setError(null);

    const result = await signIn({ password, next });

    if (!result.ok) {
      setError(result.error);
      setPassword("");
      setPending(false);
      inputRef.current?.focus();
      return;
    }

    // Replace, so the back button does not return to the login screen.
    router.replace(result.data.redirectTo);
    router.refresh();
  };

  const onKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState("CapsLock"));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Password"
        htmlFor="password"
        error={error ?? undefined}
        hint={capsLock ? "Caps Lock is on" : undefined}
      >
        <div className="relative">
          <Input
            ref={inputRef}
            id="password"
            type={revealed ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={onKey}
            onKeyUp={onKey}
            onBlur={() => setCapsLock(false)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "password-error" : capsLock ? "password-hint" : undefined}
            className="h-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Button
        type="submit"
        loading={pending}
        className={cn(
          "group h-11 w-full rounded-lg text-[15px]",
          "bg-linear-to-b from-primary/80 to-primary",
          "shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.16),0_6px_16px_-6px_rgb(0_0_0/0.35)]",
          "transition-[transform,box-shadow] duration-200 hover:-translate-y-px",
          "hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_2px_4px_rgb(0_0_0/0.16),0_10px_24px_-8px_rgb(0_0_0/0.4)]",
          "active:translate-y-0",
        )}
      >
        Continue
        <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
      </Button>
    </form>
  );
}
