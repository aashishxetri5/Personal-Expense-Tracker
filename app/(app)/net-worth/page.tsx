import type { Metadata } from "next";

import { NetWorthChart } from "@/components/charts/trend-charts";
import { Money } from "@/components/money";
import { StatTile } from "@/components/stat-tile";
import { NetWorthEditor } from "@/components/networth/net-worth-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getNetWorthSnapshots } from "@/lib/db/queries/history";
import { getMonthSnapshot } from "@/lib/db/queries/month";
import { getCurrentUser } from "@/lib/db/user";
import { formatMonthLabel, formatMonthShort, parseMonthKey, toMonthKey } from "@/lib/month";

export const metadata: Metadata = { title: "Net Worth" };
export const dynamic = "force-dynamic";

export default async function NetWorthPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const params = await searchParams;
  const month = parseMonthKey(params.m);
  const monthKey = toMonthKey(month);

  const user = await getCurrentUser();
  const [snapshots, snapshot] = await Promise.all([
    getNetWorthSnapshots(user.id),
    getMonthSnapshot(user.id, month),
  ]);

  const current = snapshots.find((item) => item.month === monthKey) ?? null;
  const latest = snapshots[snapshots.length - 1] ?? null;
  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const change = latest && previous ? latest.netWorth - previous.netWorth : null;

  // Balances the app already knows, offered as a starting point for a new snapshot.
  const suggested: Record<string, number> = {
    "Emergency fund":
      snapshot.goals
        .filter((goal) => goal.kind === "EMERGENCY")
        .reduce((sum, goal) => sum + goal.current, 0) || 0,
    Investments: snapshot.investments.reduce((sum, item) => sum + item.totalInvested, 0),
  };

  const chartData = snapshots.map((item) => ({
    label: formatMonthShort(parseMonthKey(item.month)),
    assets: item.assets,
    liabilities: item.liabilities,
    netWorth: item.netWorth,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Net worth"
        description="What you own minus what you owe, recorded once a month so the trend is real."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Latest net worth" value={latest?.netWorth ?? 0} />
        <StatTile label="Assets" value={latest?.assets ?? 0} />
        <StatTile label="Liabilities" value={latest?.liabilities ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Net worth over time</CardTitle>
          <CardDescription>
            {latest
              ? `Latest snapshot: ${formatMonthLabel(parseMonthKey(latest.month))}${
                  change !== null
                    ? change >= 0
                      ? ` · up on the month before`
                      : ` · down on the month before`
                    : ""
                }`
              : "Record your first snapshot below to start the trend."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 1 ? (
            <NetWorthChart data={chartData} />
          ) : (
            <EmptyState
              compact
              title="Not enough snapshots yet"
              description="Record at least two months to see a trend line."
            />
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{formatMonthLabel(month)} snapshot</h2>
        <NetWorthEditor monthKey={monthKey} snapshot={current} suggested={suggested} />
      </section>

      {snapshots.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All snapshots</CardTitle>
            <CardDescription>Every month you have recorded, newest first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Assets</TableHead>
                  <TableHead className="text-right">Liabilities</TableHead>
                  <TableHead className="text-right">Net worth</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...snapshots].reverse().map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {formatMonthLabel(parseMonthKey(item.month))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={item.assets} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={item.liabilities} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <Money value={item.netWorth} tone={item.netWorth < 0 ? "negative" : "none"} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.note ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
