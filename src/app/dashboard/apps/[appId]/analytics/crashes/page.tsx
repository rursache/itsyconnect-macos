"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bug,
  DeviceMobile,
  Desktop,
  ShieldCheck,
} from "@phosphor-icons/react";
import { formatDate } from "@/lib/mock-analytics";
import { useAnalytics } from "@/lib/analytics-context";
import { parseRange, filterByDateRange } from "@/lib/analytics-range";
import { KpiCard } from "@/components/kpi-card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

const crashConfig = {
  crashes: { label: "Crashes", color: "var(--color-chart-4)" },
  uniqueDevices: { label: "Affected devices", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

// ---------- Page ----------

export default function CrashesPage() {
  const searchParams = useSearchParams();
  const { data, loading, error, pending, lastDate } = useAnalytics();
  const range = useMemo(() => parseRange(searchParams.get("range"), lastDate), [searchParams, lastDate]);

  const crashSlice = useMemo(
    () => filterByDateRange(data?.dailyCrashes ?? [], range),
    [data, range],
  );

  const sessionSlice = useMemo(
    () => filterByDateRange(data?.dailySessions ?? [], range),
    [data, range],
  );

  const totalCrashes = crashSlice.reduce((s, c) => s + c.crashes, 0);
  const totalAffected = crashSlice.reduce((s, c) => s + c.uniqueDevices, 0);
  const sessionDevices = sessionSlice.reduce((s, d) => s + d.uniqueDevices, 0);

  const crashFreeRate =
    sessionDevices > 0
      ? ((1 - totalAffected / sessionDevices) * 100).toFixed(1)
      : "100";

  const crashesByVersion = data?.crashesByVersion ?? [];
  const crashesByDevice = data?.crashesByDevice ?? [];

  if (loading && !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (pending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Spinner className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Fetching analytics data – this may take a moment on first load
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total crashes"
          value={totalCrashes.toLocaleString()}
          subtitle={`In selected period`}
          icon={Bug}
        />
        <KpiCard
          title="Affected devices"
          value={totalAffected.toLocaleString()}
          subtitle="Unique devices with crashes"
          icon={DeviceMobile}
        />
        <KpiCard
          title="Crash-free rate"
          value={`${crashFreeRate}%`}
          subtitle={`${totalAffected} affected of ${sessionDevices.toLocaleString()} devices`}
          icon={ShieldCheck}
        />
        <KpiCard
          title="Device models"
          value={crashesByDevice.length.toLocaleString()}
          subtitle="Distinct models affected"
          icon={Desktop}
        />
      </div>

      {/* Daily crash chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Crashes over time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={crashConfig} className="h-[280px] w-full">
            <AreaChart data={crashSlice} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatDate}
                interval="preserveStartEnd"
              />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => formatDate(v as string)}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="crashes"
                fill="var(--color-crashes)"
                stroke="var(--color-crashes)"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="uniqueDevices"
                fill="var(--color-uniqueDevices)"
                stroke="var(--color-uniqueDevices)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Two tables side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Crashes by version */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Crashes by version
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Crashes</TableHead>
                  <TableHead className="text-right">Unique devices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crashesByVersion.map((row) => (
                  <TableRow key={`${row.version}-${row.platform}`}>
                    <TableCell className="font-medium font-mono">
                      {row.version}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.platform}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.crashes}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.uniqueDevices}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Crashes by device */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Crashes by device
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Crashes</TableHead>
                  <TableHead className="text-right">Unique devices</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crashesByDevice.map((row) => (
                  <TableRow key={row.device}>
                    <TableCell className="font-medium font-mono">
                      {row.device}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.crashes}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.uniqueDevices}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
