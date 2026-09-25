import type { Metadata } from "next";
import { Suspense } from "react";

import { AccountManager } from "@/components/settings/account-manager";
import { CategoryManager } from "@/components/settings/category-manager";
import { DataSection } from "@/components/settings/data-section";
import { ProfileForm } from "@/components/settings/profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { CardSkeleton } from "@/components/ui/skeletons";
import { getAccounts, getCategories } from "@/lib/db/queries/reference";
import { getCurrentUser } from "@/lib/db/user";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Your workspace, your categories, your data."
      />

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}

/** The page body, streamed in behind its skeleton once the data is ready. */
async function SettingsContent() {
  const user = await getCurrentUser();
  const [categories, accounts] = await Promise.all([getCategories(user.id), getAccounts(user.id)]);

  return (
    <>
      <ProfileForm
        name={user.name}
        currency={user.currency}
        locale={user.locale}
        defaultMonthlyIncome={user.defaultMonthlyIncome}
      />

      <CategoryManager categories={categories} />

      <AccountManager accounts={accounts} />

      <DataSection demoDataLoaded={user.demoDataLoaded} />
    </>
  );
}

/** Stands in for the page body while its data loads; the header is already on screen. */
function SettingsSkeleton() {
  return (
    <>
      <CardSkeleton rows={3} />
    <CardSkeleton rows={8} />
    <CardSkeleton rows={5} />
    </>
  );
}
