"use client";

import { Check } from "lucide-react";

import { CATEGORICAL_SLOTS } from "@/lib/chart-colors";
import { cn } from "@/lib/utils";

/**
 * Colours are chosen from the validated categorical palette rather than a free
 * colour wheel — an arbitrary hex can easily be invisible on one of the two
 * surfaces, or indistinguishable from a neighbour for a colour-blind reader.
 */
export function ColorPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} role="radiogroup" aria-label="Colour">
      {CATEGORICAL_SLOTS.map((slot) => {
        const selected = value.toLowerCase() === slot.light.toLowerCase();
        return (
          <button
            key={slot.name}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={slot.name}
            onClick={() => onChange(slot.light)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full transition-transform",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              selected ? "scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background" : "hover:scale-105",
            )}
            style={{ backgroundColor: slot.light }}
          >
            {selected ? <Check className="size-3.5 text-white drop-shadow" /> : null}
          </button>
        );
      })}
    </div>
  );
}
