"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Money } from "@/components/money";
import { AccountDialog } from "@/components/settings/account-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EntityActions } from "@/components/ui/entity-actions";
import { archiveAccount } from "@/lib/actions/accounts";
import { ACCOUNT_KIND_LABELS } from "@/lib/labels";
import type { AccountDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * One payment method row. Accounts are only ever archived, never deleted, so
 * past transactions keep the method they were paid with.
 *
 * @param props - The account to render.
 * @returns The list row.
 */
function AccountRow({ account }: { account: AccountDTO }) {
  const [editing, setEditing] = React.useState(false);

  return (
    <li
      className={cn(
        "flex items-center gap-3 border-b border-border py-2.5 last:border-0",
        account.archived && "opacity-55",
      )}
    >
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{account.name}</span>

      {account.openingBalance !== 0 ? (
        <span className="text-xs text-muted-foreground">
          opening <Money value={account.openingBalance} />
        </span>
      ) : null}

      {account.archived ? <Badge variant="outline">Archived</Badge> : null}
      <Badge>{ACCOUNT_KIND_LABELS[account.kind]}</Badge>

      <EntityActions
        name={account.name}
        archived={account.archived}
        onEdit={() => setEditing(true)}
        archive={(archived) => archiveAccount({ id: account.id, archived })}
      />

      <AccountDialog account={editing ? account : null} open={editing} onOpenChange={setEditing} />
    </li>
  );
}

/**
 * Lists and manages the payment methods offered when recording a transaction.
 *
 * @param props - Every account belonging to the user.
 * @returns The payment methods card.
 */
export function AccountManager({ accounts }: { accounts: AccountDTO[] }) {
  const [creating, setCreating] = React.useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Payment methods</CardTitle>
          <CardDescription>Where money comes from when you record a transaction.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus /> Add
        </Button>
      </CardHeader>

      <CardContent>
        <ul>
          {accounts.map((account) => (
            <AccountRow key={account.id} account={account} />
          ))}
        </ul>
      </CardContent>

      <AccountDialog account={null} open={creating} onOpenChange={setCreating} />
    </Card>
  );
}
