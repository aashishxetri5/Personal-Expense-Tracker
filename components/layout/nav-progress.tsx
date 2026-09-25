"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

/** Fired by code that navigates without a link, such as the month stepper. */
export const NAV_START_EVENT = "finance:navigation-start";
/** Fired by a loading skeleton as it mounts (+1) and unmounts (−1). */
const LOADING_EVENT = "finance:loading";

/** Loads that finish sooner than this never show the bar, so it cannot flicker. */
const SHOW_AFTER_MS = 120;
/** Give up if a navigation never lands (an error page, a cancelled click). */
const GIVE_UP_AFTER_MS = 12_000;

type Phase = "idle" | "running" | "done";

/**
 * Keeps the progress bar running for as long as a loading skeleton is on
 * screen. Render it inside `loading.tsx`: with a loading boundary, Next changes
 * the URL immediately, so the URL alone cannot say when the page has arrived.
 *
 * @returns Nothing visible.
 */
export function LoadingSignal() {
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent(LOADING_EVENT, { detail: 1 }));
    return () => {
      window.dispatchEvent(new CustomEvent(LOADING_EVENT, { detail: -1 }));
    };
  }, []);
  return null;
}

/**
 * A thin brass bar across the top of the page while a page or month loads. It
 * creeps toward the end while waiting and snaps to full when the page lands.
 *
 * @returns The progress bar, hidden from assistive technology.
 */
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [waiting, setWaiting] = React.useState(false);
  const [loaders, setLoaders] = React.useState(0);
  const [phase, setPhase] = React.useState<Phase>("idle");

  const busy = waiting || loaders > 0;

  // Start on any same-origin link click that goes somewhere new, or on request.
  React.useEffect(() => {
    const start = () => setWaiting(true);
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
    const onLoading = (event: Event) => {
      const delta = (event as CustomEvent<number>).detail;
      setLoaders((count) => Math.max(0, count + delta));
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener(NAV_START_EVENT, start);
    window.addEventListener(LOADING_EVENT, onLoading);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(NAV_START_EVENT, start);
      window.removeEventListener(LOADING_EVENT, onLoading);
    };
  }, []);

  // The URL changed: the navigation itself has landed (a skeleton may remain).
  const location = `${pathname}?${searchParams.toString()}`;
  React.useEffect(() => setWaiting(false), [location]);

  // A click that never navigates must not leave the bar running.
  React.useEffect(() => {
    if (!waiting) return;
    const id = window.setTimeout(() => setWaiting(false), GIVE_UP_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [waiting]);

  React.useEffect(() => {
    if (busy) {
      const id = window.setTimeout(() => setPhase("running"), SHOW_AFTER_MS);
      return () => window.clearTimeout(id);
    }
    setPhase((current) => (current === "running" ? "done" : current));
  }, [busy]);

  React.useEffect(() => {
    if (phase !== "done") return;
    const id = window.setTimeout(() => setPhase("idle"), 450);
    return () => window.clearTimeout(id);
  }, [phase]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-60 h-0.75">
      <div
        className={cn(
          "h-full origin-left bg-linear-to-r from-gold-deep via-gold to-gold-bright shadow-[0_0_10px_var(--gold)]",
          phase === "idle" && "scale-x-0 opacity-0 transition-none",
          // A long ease-out: fast at first, then creeping, never quite finishing.
          phase === "running" &&
            "scale-x-[0.85] opacity-100 transition-transform duration-6000 ease-[cubic-bezier(0.1,0.7,0.2,1)]",
          phase === "done" && "scale-x-100 opacity-0 transition-[transform,opacity] duration-300 [transition-delay:0ms,150ms]",
        )}
      />
    </div>
  );
}
