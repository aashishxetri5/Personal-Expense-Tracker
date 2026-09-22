import {
  ArrowLeftRight,
  ChartPie,
  History,
  LayoutDashboard,
  PiggyBank,
  Scale,
  Settings,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
  /** Shown in the mobile bottom bar. */
  primary?: boolean;
};

export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard, primary: true },
      {
        href: "/transactions",
        label: "Transactions",
        shortLabel: "Activity",
        icon: ArrowLeftRight,
        primary: true,
      },
      { href: "/budget", label: "Budget", shortLabel: "Budget", icon: Wallet, primary: true },
    ],
  },
  {
    label: "Plan",
    items: [
      { href: "/future-funds", label: "Future Funds", shortLabel: "Funds", icon: PiggyBank },
      { href: "/savings", label: "Savings Goals", shortLabel: "Goals", icon: Target },
      { href: "/investments", label: "Investments", shortLabel: "Invest", icon: TrendingUp },
    ],
  },
  {
    label: "Track",
    items: [
      { href: "/net-worth", label: "Net Worth", shortLabel: "Worth", icon: Scale },
      { href: "/history", label: "Monthly History", shortLabel: "History", icon: History },
      { href: "/reports", label: "Reports", shortLabel: "Reports", icon: ChartPie, primary: true },
    ],
  },
  {
    label: "Workspace",
    items: [{ href: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings }],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

export const MOBILE_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => item.primary);

/** Pages whose content depends on the selected month. */
export const MONTH_AWARE_ROUTES = new Set([
  "/",
  "/transactions",
  "/budget",
  "/future-funds",
  "/savings",
  "/investments",
  "/net-worth",
  "/reports",
]);

export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
