"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AXIS_TICK,
  ChartDataTable,
  ChartTooltipCard,
  useChartTheme,
} from "@/components/charts/chart-kit";
import { useMoney } from "@/components/providers";
import { CATEGORICAL_SLOTS, STATUS } from "@/lib/chart-colors";

export type SeriesPoint = { label: string } & Record<string, number | string>;

export type SeriesDef = { key: string; name: string; color: string };

const AXIS_WIDTH = 46;

function LegendRow({ series }: { series: SeriesDef[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
      {series.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}
        </li>
      ))}
    </ul>
  );
}

/**
 * Change over time. A crosshair plus a shared tooltip means every series can be
 * read at the same x without hunting for individual points.
 */
export function TrendLineChart({
  data,
  series,
  height = 240,
  area = false,
  caption,
}: {
  data: SeriesPoint[];
  series: SeriesDef[];
  height?: number;
  area?: boolean;
  caption: string;
}) {
  const theme = useChartTheme();
  const money = useMoney();

  const resolved = React.useMemo(
    () => series.map((item) => ({ ...item, color: theme.series(item.color) })),
    [series, theme],
  );

  const Chart = area ? AreaChart : LineChart;

  return (
    <div>
      <LegendRow series={resolved} />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
            <defs>
              {resolved.map((item) => (
                <linearGradient key={item.key} id={`fill-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={item.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={item.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: theme.axis }}
              tickMargin={8}
              minTickGap={16}
            />
            <YAxis
              width={AXIS_WIDTH}
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: theme.axis }}
              tickFormatter={(value: number) => money.formatAxis(value)}
            />
            <Tooltip
              cursor={{ stroke: theme.axis, strokeDasharray: "3 3", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltipCard
                    title={String(label)}
                    rows={payload.map((entry) => ({
                      label: String(entry.name),
                      value: Number(entry.value ?? 0),
                      color: entry.color,
                    }))}
                  />
                );
              }}
            />

            {resolved.map((item) =>
              area ? (
                <Area
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.name}
                  stroke={item.color}
                  strokeWidth={2}
                  fill={`url(#fill-${item.key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
                  animationDuration={520}
                />
              ) : (
                <Line
                  key={item.key}
                  type="monotone"
                  dataKey={item.key}
                  name={item.name}
                  stroke={item.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
                  animationDuration={520}
                />
              ),
            )}
          </Chart>
        </ResponsiveContainer>
      </div>

      <ChartDataTable
        caption={caption}
        columns={["Month", ...series.map((item) => item.name)]}
        rows={data.map((point) => [
          String(point.label),
          ...series.map((item) => Number(point[item.key] ?? 0)),
        ])}
      />
    </div>
  );
}

/** Grouped bars — income against spending, or planned against actual. */
export function GroupedBarChart({
  data,
  series,
  height = 260,
  caption,
}: {
  data: SeriesPoint[];
  series: SeriesDef[];
  height?: number;
  caption: string;
}) {
  const theme = useChartTheme();
  const money = useMoney();

  const resolved = React.useMemo(
    () => series.map((item) => ({ ...item, color: theme.series(item.color) })),
    [series, theme],
  );

  return (
    <div>
      <LegendRow series={resolved} />
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }} barGap={2}>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: theme.axis }}
              tickMargin={8}
              interval="preserveStartEnd"
            />
            <YAxis
              width={AXIS_WIDTH}
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: theme.axis }}
              tickFormatter={(value: number) => money.formatAxis(value)}
            />
            <Tooltip
              cursor={{ fill: theme.cursor }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <ChartTooltipCard
                    title={String(label)}
                    rows={payload.map((entry) => ({
                      label: String(entry.name),
                      value: Number(entry.value ?? 0),
                      color: entry.color,
                    }))}
                  />
                );
              }}
            />
            {resolved.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.name}
                fill={item.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                animationDuration={520}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ChartDataTable
        caption={caption}
        columns={["Month", ...series.map((item) => item.name)]}
        rows={data.map((point) => [
          String(point.label),
          ...series.map((item) => Number(point[item.key] ?? 0)),
        ])}
      />
    </div>
  );
}

/**
 * Net worth over time. A single series, so no legend box — the card title names
 * it. Negative net worth is drawn in the reserved "negative" status colour.
 */
export function NetWorthChart({ data, height = 260 }: { data: SeriesPoint[]; height?: number }) {
  const theme = useChartTheme();
  const money = useMoney();
  const anyNegative = data.some((point) => Number(point.netWorth ?? 0) < 0);
  const color = anyNegative
    ? theme.isDark
      ? STATUS.negative.dark
      : STATUS.negative.light
    : theme.series(CATEGORICAL_SLOTS[0].light);

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fill-net-worth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: theme.axis }}
              tickMargin={8}
              minTickGap={16}
            />
            <YAxis
              width={AXIS_WIDTH}
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: theme.axis }}
              tickFormatter={(value: number) => money.formatAxis(value)}
            />
            <Tooltip
              cursor={{ stroke: theme.axis, strokeDasharray: "3 3", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as SeriesPoint;
                return (
                  <ChartTooltipCard
                    title={String(label)}
                    rows={[
                      { label: "Net worth", value: Number(point.netWorth ?? 0), color },
                      { label: "Assets", value: Number(point.assets ?? 0) },
                      { label: "Liabilities", value: Number(point.liabilities ?? 0) },
                    ]}
                  />
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="netWorth"
              name="Net worth"
              stroke={color}
              strokeWidth={2}
              fill="url(#fill-net-worth)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
              animationDuration={520}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <ChartDataTable
        caption="Net worth over time"
        columns={["Month", "Assets", "Liabilities", "Net worth"]}
        rows={data.map((point) => [
          String(point.label),
          Number(point.assets ?? 0),
          Number(point.liabilities ?? 0),
          Number(point.netWorth ?? 0),
        ])}
      />
    </div>
  );
}

/**
 * Planned against actual for one month, one bar per category.
 * Bars over budget take the reserved negative status colour.
 */
export function BudgetVsActualChart({
  data,
  height = 280,
}: {
  data: { label: string; planned: number; actual: number; over: boolean }[];
  height?: number;
}) {
  const theme = useChartTheme();
  const money = useMoney();

  const plannedColor = theme.isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.12)";
  const actualColor = theme.series(CATEGORICAL_SLOTS[0].light);
  const overColor = theme.isDark ? STATUS.negative.dark : STATUS.negative.light;

  return (
    <div>
      <ul className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: plannedColor }} />
          Planned
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: actualColor }} />
          Actual
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: overColor }} />
          Over budget
        </li>
      </ul>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
            barGap={2}
          >
            <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: theme.axis }}
              tickFormatter={(value: number) => money.formatAxis(value)}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={104}
              tickLine={false}
              axisLine={false}
              tick={{ ...AXIS_TICK, fill: theme.axis }}
            />
            <Tooltip
              cursor={{ fill: theme.cursor }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as { planned: number; actual: number };
                return (
                  <ChartTooltipCard
                    title={String(label)}
                    rows={[
                      { label: "Planned", value: point.planned, color: plannedColor },
                      { label: "Actual", value: point.actual, color: actualColor },
                    ]}
                    footer={
                      point.actual > point.planned
                        ? `${money.format(point.actual - point.planned)} over`
                        : `${money.format(point.planned - point.actual)} left`
                    }
                  />
                );
              }}
            />
            <Bar dataKey="planned" name="Planned" fill={plannedColor} radius={[0, 4, 4, 0]} maxBarSize={10} />
            <Bar dataKey="actual" name="Actual" radius={[0, 4, 4, 0]} maxBarSize={10} animationDuration={520}>
              {data.map((point) => (
                <Cell key={point.label} fill={point.over ? overColor : actualColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ChartDataTable
        caption="Planned against actual spending by category"
        columns={["Category", "Planned", "Actual"]}
        rows={data.map((point) => [point.label, point.planned, point.actual])}
      />
    </div>
  );
}
