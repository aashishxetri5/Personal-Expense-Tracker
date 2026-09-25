"use client";

import { usePathname } from "next/navigation";

import { NAV_SECTIONS, isActiveRoute } from "@/components/layout/nav-config";

/**
 * The small-caps line above a page title naming the section the page sits in
 * ("Plan", "Track"), read from the navigation so it can never drift.
 *
 * @returns The eyebrow, or nothing on a page outside the navigation.
 */
export function PageEyebrow() {
  const pathname = usePathname();
  const section = NAV_SECTIONS.find((candidate) =>
    candidate.items.some((item) => isActiveRoute(pathname, item.href)),
  );

  if (!section) return null;

  return (
    <p className="flex items-center gap-2.5 text-[10.5px] font-semibold tracking-[0.22em] text-gold-ink uppercase">
      <span aria-hidden className="gold-rule h-px w-7" />
      {section.label}
    </p>
  );
}
