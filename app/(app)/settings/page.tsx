import type { Metadata } from "next";

import { AccountManager } from "@/components/settings/account-manager";
import { CategoryManager } from "@/components/settings/category-manager";
import { DataSection } from "@/components/settings/data-section";
import { ProfileForm } from "@/components/settings/profile-form";
import { PageHeader } from "@/components/ui/display";
import { getAccounts, getCategories } from "@/lib/db/queries/reference";
import { getCurrentUser } from "@/lib/db/user";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const [categories, accounts] = await Promise.all([getCategories(user.id), getAccounts(user.id)]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        description="Your workspace, your categories, your data."
      />

      <ProfileForm
        name={user.name}
        currency={user.currency}
        locale={user.locale}
        defaultMonthlyIncome={user.defaultMonthlyIncome}
      />

      <CategoryManager categories={categories} />

      <AccountManager accounts={accounts} />

      <DataSection demoDataLoaded={user.demoDataLoaded} />
    </div>
  );
}
