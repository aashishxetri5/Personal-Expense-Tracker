"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

/** Fired by code that navigates without a link, such as the month stepper. */
export const NAV_START_EVENT = "finance:navigation-start";

/** Navigations that finish sooner than this never show the bar, so it cannot flicker. */
const SHOW_AFTER_MS = 120;
/** Give up if a navigation never lands (an error page, a cancelled click). */
const GIVE_UP_AFTER_MS = 12_000;

type Phase = "idle" | "running" | "done";

/**
 * A thin brass bar across the top of the page while a page or month loads. It
 * creeps toward the end while waiting and snaps to full when the new URL lands.
 *
 * @returns The progress bar, hidden from assistive technology.
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const timers = React.useRef<number[]>([]);
  const pending = React.useRef(false);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const start = React.useCallback(() => {
    clearTimers();
    pending.current = true;
    timers.current.push(
      window.setTimeout(() => pending.current && setPhase("running"), SHOW_AFTER_MS),
      window.setTimeout(() => {
        pending.current = false;
        setPhase("idle");
      }, GIVE_UP_AFTER_MS),
    );
  }, []);

  // Start on any same-origin link click that goes somewhere new.
  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      start();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener(NAV_START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(NAV_START_EVENT, start);
    };
  }, [start]);

  // The URL changed: the navigation has landed.
  const location = `${pathname}?${searchParams.toString()}`;
  React.useEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    clearTimers();
    setPhase((current) => (current === "running" ? "done" : "idle"));
  }, [location]);

  React.useEffect(() => {
    if (phase !== "done") return;
    const id = window.setTimeout(() => setPhase("idle"), 450);
    return () => window.clearTimeout(id);
  }, [phase]);

  React.useEffect(() => clearTimers, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        className={cn(
          "h-full origin-left bg-linear-to-r from-gold-deep via-gold to-gold-bright shadow-[0_0_10px_var(--gold)]",
          phase === "idle" && "scale-x-0 opacity-0 transition-none",
          // A long ease-out: fast at first, then creeping, never quite finishing.
          phase === "running" && "scale-x-[0.85] opacity-100 transition-transform duration-[6000ms] ease-[cubic-bezier(0.1,0.7,0.2,1)]",
          phase === "done" && "scale-x-100 opacity-0 transition-[transform,opacity] duration-300 [transition-delay:0ms,150ms]",
        )}
      />
    </div>
  );
}
