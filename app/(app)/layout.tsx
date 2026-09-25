import { Suspense } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import {
  AddTransactionFab,
  TransactionDialogProvider,
} from "@/components/transactions/transaction-dialog";
import { getFormOptions } from "@/lib/db/queries/reference";
import { getCurrentUser } from "@/lib/db/user";

/** Ruled ledger paper behind every page, lit faintly in indigo and brass. */
function PaperBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-ledger [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
      {/* Gradients, not blur filters: they cost nothing to repaint while scrolling. */}
      <div className="absolute inset-0 bg-[radial-gradient(44rem_32rem_at_100%_0%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent_70%),radial-gradient(34rem_28rem_at_100%_45%,color-mix(in_oklch,var(--gold)_9%,transparent),transparent_70%)]" />
      {/* The double margin rule of an accounting book, along the sidebar's edge. */}
      <div className="absolute inset-y-0 left-64 ml-1.5 hidden w-[5px] border-x border-[var(--margin-rule)] lg:block" />
    </div>
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const options = await getFormOptions(user.id);

  return (
    // `Suspense` is required because the shell reads search params (the selected
    // month) on the client.
    <Suspense fallback={null}>
      <TransactionDialogProvider options={options}>
        <div className="relative isolate min-h-dvh lg:pl-64">
          <PaperBackdrop />
          <Sidebar name={user.name} />
          <Topbar name={user.name} />

          <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-36 sm:px-6 lg:pt-8 lg:pb-14">{children}</main>

          <MobileNav />
          <AddTransactionFab />
        </div>
      </TransactionDialogProvider>
    </Suspense>
  );
}
