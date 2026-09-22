"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartDataTable, ChartLegend, ChartTooltipCard, useChartTheme } from "@/components/charts/chart-kit";
import { useMoney } from "@/components/providers";
import { MAX_DONUT_SLICES } from "@/lib/chart-colors";
import { formatPercent } from "@/lib/format";

export type DonutDatum = { id: string; label: string; value: number; color: string };

/**
 * Where the month went. Arcs are capped and the tail folded into "Other", with
 * a legend listing every category so identity is never colour alone.
 *
 * @param props - The category amounts and the month's total.
 * @returns The donut with its legend, or null when there is nothing to show.
 */
export function SpendingDonut({ data, total }: { data: DonutDatum[]; total: number }) {
  const theme = useChartTheme();
  const money = useMoney();

  const { slices, legend } = React.useMemo(() => {
    const sorted = [...data].filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
    const head = sorted.slice(0, MAX_DONUT_SLICES);
    const tail = sorted.slice(MAX_DONUT_SLICES);

    const arcs = head.map((item) => ({ ...item, color: theme.series(item.color) }));
    if (tail.length > 0) {
      arcs.push({
        id: "__other__",
        label: `Other (${tail.length})`,
        value: tail.reduce((sum, item) => sum + item.value, 0),
        color: theme.other,
      });
    }

    return {
      slices: arcs,
      legend: sorted.map((item) => ({
        label: item.label,
        value: item.value,
        color: theme.series(item.color),
        meta: total > 0 ? formatPercent((item.value / total) * 100, 0) : undefined,
      })),
    };
  }, [data, theme, total]);

  if (slices.length === 0) return null;

  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:items-center">
      <div className="relative mx-auto aspect-square w-full max-w-[13rem]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="64%"
              outerRadius="100%"
              paddingAngle={2}
              stroke={theme.surface}
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              animationDuration={520}
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const datum = payload[0].payload as DonutDatum;
                return (
                  <ChartTooltipCard
                    title={datum.label}
                    rows={[{ label: "Amount", value: datum.value, color: datum.color }]}
                    footer={total > 0 ? formatPercent((datum.value / total) * 100) + " of the month" : null}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Hero number in the hole — the thing people actually came to read. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Total
          </span>
          <span className="text-lg font-semibold tabular">{money.format(total)}</span>
        </div>
      </div>

      <ChartLegend items={legend} className="min-w-0" />

      <ChartDataTable
        caption="Spending by category"
        columns={["Category", "Amount"]}
        rows={legend.map((item) => [item.label, item.value])}
      />
    </div>
  );
}
