/**
 * Categorical palette, validated as a set for lightness, chroma, contrast and
 * colour-vision separation. The slot order is the safety mechanism, so hues are
 * assigned in this fixed order and never cycled by rank. Each slot carries a
 * dark step chosen for the dark surface, not an automatic inversion.
 */
export const CATEGORICAL_SLOTS = [
  { name: "blue", light: "#2a78d6", dark: "#3987e5" },
  { name: "orange", light: "#eb6834", dark: "#d95926" },
  { name: "aqua", light: "#1baf7a", dark: "#199e70" },
  { name: "yellow", light: "#eda100", dark: "#c98500" },
  { name: "magenta", light: "#e87ba4", dark: "#d55181" },
  { name: "green", light: "#008300", dark: "#008300" },
  { name: "violet", light: "#4a3aa7", dark: "#9085e9" },
  { name: "red", light: "#e34948", dark: "#e66767" },
] as const;

export const SLOT = {
  blue: CATEGORICAL_SLOTS[0].light,
  orange: CATEGORICAL_SLOTS[1].light,
  aqua: CATEGORICAL_SLOTS[2].light,
  yellow: CATEGORICAL_SLOTS[3].light,
  magenta: CATEGORICAL_SLOTS[4].light,
  green: CATEGORICAL_SLOTS[5].light,
  violet: CATEGORICAL_SLOTS[6].light,
  red: CATEGORICAL_SLOTS[7].light,
} as const;

const LIGHT_TO_DARK = new Map(
  CATEGORICAL_SLOTS.map((slot) => [slot.light.toLowerCase(), slot.dark]),
);

/**
 * Re-steps a stored colour for the current surface. A custom colour the user
 * chose is returned untouched.
 *
 * @param hex - The category's stored light-mode colour.
 * @param isDark - Whether the chart is rendering on the dark surface.
 * @returns The colour to paint with.
 */
export function resolveSeriesColor(hex: string, isDark: boolean): string {
  if (!isDark) return hex;
  return LIGHT_TO_DARK.get(hex.toLowerCase()) ?? hex;
}

/** Neutral used for the folded "Other" slice and for zero-value marks. */
export const OTHER_COLOR = { light: "#8a8a8a", dark: "#6f7378" };

/** Semantic colours for money states. Reserved — never used as a series hue. */
export const STATUS = {
  positive: { light: "#008300", dark: "#39b54a" },
  negative: { light: "#c0392b", dark: "#e66767" },
  neutral: { light: "#52514e", dark: "#c3c2b7" },
} as const;

/**
 * A donut with more than a handful of arcs stops being readable, so the tail is
 * folded into a single "Other" slice. The full ranked list is always shown
 * beside the chart, which is where the long tail can be read precisely.
 */
export const MAX_DONUT_SLICES = 6;
