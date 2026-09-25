import { VaultDial } from "@/components/brand/vault-dial";
import { SummaryExplainer } from "@/components/dashboard/summary-cards";
import { Money } from "@/components/money";
import { AddTransactionButton } from "@/components/transactions/transaction-dialog";
import { AccentTitle } from "@/components/ui/page-header";
import type { MonthlySummary } from "@/lib/calculations/ledger";
import { formatMonthLabel } from "@/lib/month";

/**
 * The dashboard's opening page: the month as a folio in the ledger, with the
 * brass dial reading how much of the budget has gone. Each lit pin is a tenth
 * of the plan; past the plan the dial turns red. The figures beside it say the
 * same thing in words.
 *
 * @param props - The month, its summary, and its planned budget total.
 * @returns The hero panel.
 */
export function MonthHero({
  month,
  summary,
  plannedTotal,
}: {
  month: Date;
  summary: MonthlySummary;
  plannedTotal: number;
}) {
  const folio = String(month.getUTCMonth() + 1).padStart(2, "0");
  const count = summary.transactionCount;
  const used = plannedTotal > 0 ? (summary.spent / plannedTotal) * 100 : 0;
  const over = plannedTotal > 0 && used > 100;

  return (
    // `dark` keeps the hero in ink on both themes, like the sidebar and the dial.
    <section
      aria-label={`${formatMonthLabel(month)} overview`}
      className="dark relative isolate overflow-hidden rounded-3xl border border-sidebar-border bg-sidebar text-foreground shadow-lift animate-[rise_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-ledger" />
        <div className="absolute -top-36 -left-28 size-[28rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -right-24 -bottom-44 size-[26rem] rounded-full bg-gold/15 blur-3xl" />
        <div className="absolute inset-y-0 left-6 w-[5px] border-x border-[var(--margin-rule)] sm:left-8" />
      </div>

      <div className="grid gap-7 py-7 pr-6 pl-12 sm:py-8 sm:pr-8 sm:pl-16 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <p className="flex items-center gap-2.5 text-[10.5px] font-semibold tracking-[0.22em] text-gold-ink uppercase">
            <span aria-hidden className="gold-rule h-px w-7" />
            Folio {folio} · Monthly ledger
          </p>
          <h1 className="mt-4 font-display text-[2.75rem] leading-none tracking-[-0.01em] sm:text-6xl">
            <AccentTitle title={formatMonthLabel(month)} />
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {count > 0
              ? `${count} transaction${count === 1 ? "" : "s"} recorded`
              : "Nothing recorded for this month yet"}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <AddTransactionButton />
            <SummaryExplainer summary={summary} />
          </div>
        </div>

        <figure className="flex items-center gap-5 md:flex-col md:gap-4">
          <VaultDial
            turns={plannedTotal > 0 ? Math.min(10, Math.round(used / 10)) : 0}
            state={over ? "error" : "idle"}
            label={plannedTotal > 0 ? `${Math.round(used)}%` : "—"}
            className="size-[120px] sm:size-[148px]"
          />
          <figcaption className="text-sm md:text-center">
            <span className="block text-[10.5px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Budget used
            </span>
            {plannedTotal > 0 ? (
              <span className="mt-1 block">
                <Money
                  value={summary.spent}
                  className={over ? "font-semibold text-destructive" : "font-semibold text-foreground"}
                />{" "}
                <span className="text-muted-foreground">
                  of <Money value={plannedTotal} />
                </span>
              </span>
            ) : (
              <span className="mt-1 block text-muted-foreground">No budget set</span>
            )}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
