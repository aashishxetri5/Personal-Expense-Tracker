"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  formatCompact,
  formatCurrency,
  formatNumber,
} from "@/lib/format";

export type MoneyFormatOptions = { signed?: boolean; decimals?: boolean };

export type MoneyContextValue = {
  currency: string;
  locale: string;
  format: (value: number, options?: MoneyFormatOptions) => string;
  formatPlain: (value: number) => string;
  formatAxis: (value: number) => string;
};

const MoneyContext = React.createContext<MoneyContextValue | null>(null);

/**
 * Supplies the user's currency to every client component, so no component
 * formats money against a hardcoded currency.
 *
 * @param props - The currency code, locale, and the tree to provide to.
 * @returns The provider wrapping its children.
 */
function MoneyProvider({
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

/**
 * Reads the active currency formatters.
 *
 * @returns The money context, falling back to defaults outside the provider so
 *          a component rendered in a portal can never crash.
 */
export function useMoney(): MoneyContextValue {
  const context = React.useContext(MoneyContext);
  if (context) return context;

  return {
    currency: DEFAULT_CURRENCY,
    locale: DEFAULT_LOCALE,
    format: (amount, options) => formatCurrency(amount, options),
    formatPlain: (amount) => formatNumber(amount),
    formatAxis: (amount) => formatCompact(amount),
  };
}

/**
 * Wraps the app in theme, currency and toast providers.
 *
 * @param props - The user's currency and locale, plus the app tree.
 * @returns The provider stack.
 */
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
      </MoneyProvider>
    </NextThemesProvider>
  );
}
