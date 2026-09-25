import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";

import "./globals.css";

import { Providers } from "@/components/providers";
import { getCurrentUser } from "@/lib/db/user";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/lib/format";

/** The interface face — crisp at small sizes, with even-width figures for money. */
const sans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

/**
 * The display face for headings and hero figures, exposed as `font-display`.
 * Variable, with optical sizing, so it stays sturdy small and refined large.
 */
const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Finance — personal money manager",
    template: "%s · Finance",
  },
  description:
    "Budgets, sinking funds, savings goals, investments and net worth — one persistent history you can browse month by month.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e19" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A failure here means the database is unreachable; fall back to defaults so
  // the error page renders in the right currency instead of crashing twice.
  let currency = DEFAULT_CURRENCY;
  let locale = DEFAULT_LOCALE;

  try {
    const user = await getCurrentUser();
    currency = user.currency;
    locale = user.locale;
  } catch {
    // Handled by the route-level error boundary.
  }

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans antialiased">
        <Providers currency={currency} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
