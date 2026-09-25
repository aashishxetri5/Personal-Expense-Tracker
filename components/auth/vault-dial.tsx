import type { CSSProperties } from "react";
import { Lock, LockOpen, ShieldAlert } from "lucide-react";

import styles from "@/components/auth/lock-screen.module.css";
import { cn } from "@/lib/utils";

export type DialState = "idle" | "pending" | "error" | "success" | "jammed";

const PIN_COUNT = 10;
const TICKS = Array.from({ length: 60 }, (_, i) => i);
const KNURLS = Array.from({ length: 90 }, (_, i) => i);
const NUMERALS = Array.from({ length: 12 }, (_, i) => i);
const PINS = Array.from({ length: PIN_COUNT }, (_, i) => i);

/**
 * Where the dial rests after a number of keystrokes: three clicks one way,
 * three the other, like working a real combination. Driven by length only, so
 * the dial never reveals anything about the characters themselves.
 *
 * @param turns - How many characters have been typed.
 * @returns The rotation in degrees.
 */
function dialAngle(turns: number): number {
  let angle = 0;
  for (let i = 1; i <= turns; i += 1) {
    const direction = Math.floor((i - 1) / 3) % 2 === 0 ? 1 : -1;
    angle += direction * (24 + ((i * 7) % 4) * 9);
  }
  return angle;
}

/**
 * A brass combination dial that mirrors the password field: it turns with each
 * keystroke, hunts while the password is checked, rattles when it is wrong and
 * spins open when it is right. Purely decorative.
 *
 * @param props - Characters typed so far, the lock state, and sizing classes.
 * @returns The dial.
 */
export function VaultDial({
  turns = 0,
  state = "idle",
  className,
}: {
  turns?: number;
  state?: DialState;
  className?: string;
}) {
  const angle = dialAngle(turns) + (state === "success" ? 720 : 0);
  const lit = state === "idle" || state === "pending" ? Math.min(turns, PIN_COUNT) : PIN_COUNT;
  const Icon = state === "success" ? LockOpen : state === "jammed" ? ShieldAlert : Lock;

  return (
    <div className={cn(styles.dial, className)} data-state={state} aria-hidden>
      <span className={styles.halo} />
      {state === "success" ? <span className={styles.burst} /> : null}

      {/* Fixed brass bezel. */}
      <svg className={styles.layer} viewBox="0 0 200 200">
        <defs>
          <linearGradient id="vault-bezel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--gold-bright)" }} />
            <stop offset="0.5" style={{ stopColor: "var(--gold)" }} />
            <stop offset="1" style={{ stopColor: "var(--gold-deep)" }} />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="99.5" fill="url(#vault-bezel)" />
        <circle cx="100" cy="100" r="96" style={{ fill: "var(--ink-deep)" }} />
      </svg>

      {/* The turning face: knurled grip, ticks and numerals. */}
      <div className={styles.face} style={{ transform: `rotate(${angle}deg)` }}>
        <div className={styles.faceSpin}>
          <svg className={styles.layer} viewBox="0 0 200 200">
            <defs>
              <radialGradient id="vault-face" cx="0.36" cy="0.28" r="0.85">
                <stop offset="0" style={{ stopColor: "var(--ink-lift)" }} />
                <stop offset="1" style={{ stopColor: "var(--ink-deep)" }} />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="95" style={{ fill: "var(--ink)" }} />
            {KNURLS.map((i) => (
              <line
                key={i}
                x1="100"
                y1="5.5"
                x2="100"
                y2="11"
                transform={`rotate(${i * 4} 100 100)`}
                style={{ stroke: "var(--gold)", strokeOpacity: 0.28, strokeWidth: 1.2 }}
              />
            ))}
            <circle cx="100" cy="100" r="88" fill="url(#vault-face)" />
            {TICKS.map((i) => {
              const major = i % 5 === 0;
              return (
                <line
                  key={i}
                  x1="100"
                  y1="15"
                  x2="100"
                  y2={major ? 26 : 21}
                  transform={`rotate(${i * 6} 100 100)`}
                  style={{
                    stroke: major ? "var(--gold-bright)" : "var(--gold)",
                    strokeOpacity: major ? 0.95 : 0.45,
                    strokeWidth: major ? 1.8 : 1,
                    strokeLinecap: "round",
                  }}
                />
              );
            })}
            {NUMERALS.map((i) => (
              <text
                key={i}
                x="100"
                y="37"
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${i * 30} 100 100)`}
                className={cn(styles.numeral, i === 0 && styles.numeralZero)}
              >
                {i * 5}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Fixed centre plate with the tumbler pins. */}
      <svg className={styles.layer} viewBox="0 0 200 200">
        <defs>
          <radialGradient id="vault-plate" cx="0.4" cy="0.3" r="0.9">
            <stop offset="0" style={{ stopColor: "var(--ink-lift)" }} />
            <stop offset="1" style={{ stopColor: "var(--ink-deep)" }} />
          </radialGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r="48"
          fill="url(#vault-plate)"
          style={{ stroke: "var(--gold)", strokeOpacity: 0.5, strokeWidth: 1 }}
        />
        {PINS.map((i) => (
          <circle
            key={i}
            cx="100"
            cy="61"
            r="3.2"
            transform={`rotate(${i * 36} 100 100)`}
            className={styles.pin}
            data-on={i < lit}
            style={{ "--i": i } as CSSProperties}
          />
        ))}
        <circle
          cx="100"
          cy="100"
          r="27"
          style={{ fill: "var(--ink-deep)", stroke: "var(--gold)", strokeOpacity: 0.3, strokeWidth: 1 }}
        />
      </svg>

      <span className={styles.hub}>
        <Icon key={state === "success" ? "open" : "shut"} />
      </span>

      {/* Remounts per keystroke so the pointer nudges each time. */}
      <span key={turns} className={styles.indicator} />
    </div>
  );
}
