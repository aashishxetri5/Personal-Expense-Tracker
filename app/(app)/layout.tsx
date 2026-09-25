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

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const options = await getFormOptions(user.id);

  return (
    // `Suspense` is required because the shell reads search params (the selected
    // month) on the client.
    <Suspense fallback={null}>
      <TransactionDialogProvider options={options}>
        <div className="min-h-dvh lg:pl-60">
          <Sidebar name={user.name} />
          <Topbar name={user.name} />

          <main className="w-full px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-14">{children}</main>

          <MobileNav />
          <AddTransactionFab />
        </div>
      </TransactionDialogProvider>
    </Suspense>
  );
}
