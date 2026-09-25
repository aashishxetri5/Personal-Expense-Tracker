"use client";

import * as React from "react";

import styles from "@/components/auth/lock-screen.module.css";
import { useMoney } from "@/components/providers";

type Coin = {
  left: string;
  top: string;
  size: number;
  bob: number;
  spin: number;
  delay: number;
  blur?: number;
  opacity?: number;
};

/** Scattered around the edges so the card and headline stay clear. */
const COINS: Coin[] = [
  { left: "6%", top: "14%", size: 58, bob: 11, spin: 9, delay: -3 },
  { left: "3%", top: "50%", size: 34, bob: 9, spin: 7, delay: -6, blur: 1 },
  { left: "35%", top: "7%", size: 20, bob: 8, spin: 6, delay: -1, blur: 2.5, opacity: 0.7 },
  { left: "87%", top: "17%", size: 46, bob: 12, spin: 10, delay: -8 },
  { left: "79%", top: "68%", size: 64, bob: 13, spin: 11, delay: -4 },
  { left: "65%", top: "6%", size: 22, bob: 9, spin: 8, delay: -2, blur: 2, opacity: 0.75 },
  { left: "4%", top: "82%", size: 26, bob: 10, spin: 7, delay: -5, blur: 1.5 },
  { left: "94%", top: "47%", size: 30, bob: 8, spin: 9, delay: -7, blur: 1 },
  { left: "50%", top: "90%", size: 18, bob: 9, spin: 6, delay: -9, blur: 3, opacity: 0.6 },
];

/** A year of net worth: mostly up, with one bad month, closing on the goal. */
const TREND = [
  262, 255, 266, 240, 246, 228, 236, 214, 220, 196, 204, 182, 190, 200, 176, 160, 170, 146, 152,
  128, 136, 112, 118, 96, 84,
];
const LINE = `M${TREND.map((y, i) => `${i * 40},${y}`).join(" L")}`;
const AREA = `${LINE} L${(TREND.length - 1) * 40},300 L0,300 Z`;

/**
 * The user's currency sign, stamped on the coins.
 *
 * @returns A short symbol such as "$" or "Rs", or "¤" when none fits.
 */
function useCurrencySymbol(): string {
  const { currency, locale } = useMoney();

  return React.useMemo(() => {
    try {
      const part = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      })
        .formatToParts(0)
        .find((p) => p.type === "currency");
      return part?.value ?? "¤";
    } catch {
      return "¤";
    }
  }, [currency, locale]);
}

function CoinMark({ symbol }: { symbol: string }) {
  const fontSize = symbol.length === 1 ? 27 : symbol.length === 2 ? 19 : 13;

  return (
    <svg viewBox="0 0 64 64" className={styles.coinFace}>
      <circle cx="32" cy="32" r="31" fill="url(#lock-coin)" />
      <circle
        cx="32"
        cy="32"
        r="28.5"
        style={{
          fill: "none",
          stroke: "var(--gold-deep)",
          strokeOpacity: 0.55,
          strokeWidth: 1.4,
          strokeDasharray: "1.2 2",
        }}
      />
      <circle
        cx="32"
        cy="32"
        r="24"
        style={{ fill: "none", stroke: "var(--gold-deep)", strokeOpacity: 0.4, strokeWidth: 1 }}
      />
      {/* Highlight then shadow, for a stamped look. */}
      <text
        x="32.7"
        y="33.7"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fill: "var(--gold-bright)", fontSize, fontWeight: 700 }}
        suppressHydrationWarning
      >
        {symbol}
      </text>
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fill: "var(--gold-deep)", fontSize, fontWeight: 700 }}
        suppressHydrationWarning
      >
        {symbol}
      </text>
    </svg>
  );
}

/**
 * The lock screen backdrop: ruled ledger paper, drifting coins stamped with the
 * user's currency, and a growth line drawing itself up toward a goal.
 *
 * @returns The decorative scene, hidden from assistive technology.
 */
export function VaultScene() {
  const symbol = useCurrencySymbol();

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className={`${styles.glow} ${styles.glowA}`} />
      <div className={`${styles.glow} ${styles.glowB}`} />
      <div className={styles.ledger} />
      <div className={`${styles.marginRule} hidden lg:block`} />

      <div className={styles.chart}>
        <svg className={styles.chartSvg} viewBox="0 0 1000 300" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lock-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--primary)", stopOpacity: 0.18 }} />
              <stop offset="1" style={{ stopColor: "var(--primary)", stopOpacity: 0 }} />
            </linearGradient>
            {/* Fades the fill out before the line ends, so it has no hard right edge. */}
            <linearGradient id="lock-area-fade" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0.72" stopColor="#fff" />
              <stop offset="0.96" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="lock-area-mask">
              <rect width="1000" height="300" fill="url(#lock-area-fade)" />
            </mask>
            <linearGradient id="lock-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" style={{ stopColor: "var(--primary)", stopOpacity: 0.5 }} />
              <stop offset="0.7" style={{ stopColor: "var(--primary)" }} />
              <stop offset="1" style={{ stopColor: "var(--gold)" }} />
            </linearGradient>
          </defs>
          <line x1="0" y1="70" x2="1000" y2="70" className={styles.goalLine} />
          <path d={AREA} fill="url(#lock-area)" mask="url(#lock-area-mask)" className={styles.chartArea} />
          <path d={LINE} stroke="url(#lock-line)" pathLength={1} className={styles.chartLine} />
        </svg>
        {/* Between lg and xl the card sits over the end of the line. */}
        <span className={`${styles.goalLabel} lg:max-xl:hidden`}>Goal</span>
        <span className={`${styles.chartDot} lg:max-xl:hidden`} />
      </div>

      <svg width="0" height="0" className="absolute">
        <defs>
          <radialGradient id="lock-coin" cx="0.34" cy="0.28" r="0.8">
            <stop offset="0" style={{ stopColor: "var(--gold-bright)" }} />
            <stop offset="0.55" style={{ stopColor: "var(--gold)" }} />
            <stop offset="1" style={{ stopColor: "var(--gold-deep)" }} />
          </radialGradient>
        </defs>
      </svg>

      {COINS.map((coin, i) => (
        <div
          key={i}
          className={styles.coin}
          style={
            {
              left: coin.left,
              top: coin.top,
              opacity: coin.opacity ?? 1,
              "--size": `${coin.size}px`,
              "--bob": `${coin.bob}s`,
              "--spin": `${coin.spin}s`,
              "--delay": `${coin.delay}s`,
              "--blur": `${coin.blur ?? 0}px`,
            } as React.CSSProperties
          }
        >
          <CoinMark symbol={symbol} />
        </div>
      ))}
    </div>
  );
}
