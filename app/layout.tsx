import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

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
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f11" },
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
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans antialiased">
        <Providers currency={currency} locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
