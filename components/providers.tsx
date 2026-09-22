"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/primitives";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE, formatCompact, formatCurrency, formatNumber } from "@/lib/format";

type MoneyContextValue = {
  currency: string;
  locale: string;
  format: (value: number, options?: { signed?: boolean; decimals?: boolean }) => string;
  formatPlain: (value: number) => string;
  formatAxis: (value: number) => string;
};

const MoneyContext = React.createContext<MoneyContextValue | null>(null);

/**
 * Currency is a user setting, so every client component formats money through
 * this context instead of importing a hardcoded currency.
 */
export function MoneyProvider({
  currency,
  locale,
  children,
}: {
  currency: string;
  locale: string;
  children: React.ReactNode;
}) {
  const value = React.useMemo<MoneyContextValue>(
    () => ({
      currency,
      locale,
      format: (amount, options) => formatCurrency(amount, { currency, locale, ...options }),
      formatPlain: (amount) => formatNumber(amount, { locale }),
      formatAxis: (amount) => formatCompact(amount),
    }),
    [currency, locale],
  );

  return <MoneyContext.Provider value={value}>{children}</MoneyContext.Provider>;
}

export function useMoney(): MoneyContextValue {
  const context = React.useContext(MoneyContext);
  if (context) return context;

  // Safe fallback so a component can never crash because it rendered outside
  // the provider (e.g. inside a portal during a transition).
  return {
    currency: DEFAULT_CURRENCY,
    locale: DEFAULT_LOCALE,
    format: (amount, options) => formatCurrency(amount, options),
    formatPlain: (amount) => formatNumber(amount),
    formatAxis: (amount) => formatCompact(amount),
  };
}

export function Providers({
  currency,
  locale,
  children,
}: {
  currency: string;
  locale: string;
  children: React.ReactNode;
}) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MoneyProvider currency={currency} locale={locale}>
        <TooltipProvider delayDuration={200} skipDelayDuration={300}>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  "!rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-lg",
              },
            }}
          />
        </TooltipProvider>
      </MoneyProvider>
    </NextThemesProvider>
  );
}
