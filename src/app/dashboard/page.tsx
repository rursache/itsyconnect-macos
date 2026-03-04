"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DownloadSimple,
  CurrencyDollar,
  AppWindow,
} from "@phosphor-icons/react";
import { getLastUrl } from "@/lib/nav-state";
import {
  CartesianGrid,
  Line,
  LineChart,
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
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/empty-state";
import { KpiCard } from "@/components/kpi-card";
import { AppIcon } from "@/components/app-icon";
import { useApps } from "@/lib/apps-context";
import { formatDateShort } from "@/lib/format";
import type { AnalyticsData } from "@/lib/asc/analytics";

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

interface AppAnalytics {
  data: AnalyticsData | null;
  loading: boolean;
  pending: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apps, loading } = useApps();
  const [analytics, setAnalytics] = useState<Record<string, AppAnalytics>>({});

  // entry=1 means proxy redirected here on app launch – go to last app
  const isEntry = searchParams.get("entry") === "1";
  useEffect(() => {
    if (!isEntry || loading || apps.length === 0) return;
    const saved = getLastUrl();
    const savedAppId = saved?.match(/^\/dashboard\/apps\/([^/?]+)/)?.[1];
    const appIds = new Set(apps.map((a) => a.id));
    const target = saved && savedAppId && appIds.has(savedAppId)
      ? saved
      : `/dashboard/apps/${apps[0].id}`;
    router.replace(target);
  }, [isEntry, apps, loading, router]);

  const fetchAnalytics = useCallback(async (appId: string) => {
    try {
      const res = await fetch(`/api/apps/${appId}/analytics`);
      const json = await res.json();
      setAnalytics((prev) => ({
        ...prev,
        [appId]: {
          data: json.data ?? null,
          loading: false,
          pending: json.pending ?? false,
        },
      }));
    } catch {
      setAnalytics((prev) => ({
        ...prev,
        [appId]: { data: null, loading: false, pending: false },
      }));
    }
  }, []);

  useEffect(() => {
    if (loading || apps.length === 0) return;

    // Initialize loading state for all apps
    const initial: Record<string, AppAnalytics> = {};
    for (const app of apps) {
      initial[app.id] = { data: null, loading: true, pending: false };
    }
    setAnalytics(initial);

    // Fetch all in parallel
    for (const app of apps) {
      fetchAnalytics(app.id);
    }
  }, [apps, loading, fetchAnalytics]);

  // Aggregated KPIs
  const { totalDownloads, totalProceeds, proceeds7d, proceedsYesterday } = useMemo(() => {
    let downloads = 0;
    let proceeds = 0;
    let p7d = 0;
    let pYesterday = 0;

    for (const entry of Object.values(analytics)) {
      if (!entry.data) continue;
      for (const d of entry.data.dailyDownloads) {
        downloads += d.firstTime + d.redownload;
      }
      const rev = entry.data.dailyRevenue;
      for (const r of rev) {
        proceeds += r.proceeds;
      }
      // Last entry is yesterday (most recent complete day)
      const sorted = [...rev].sort((a, b) => a.date.localeCompare(b.date));
      if (sorted.length > 0) {
        pYesterday += sorted[sorted.length - 1].proceeds;
      }
      const last7 = sorted.slice(-7);
      for (const r of last7) {
        p7d += r.proceeds;
      }
    }
    return { totalDownloads: downloads, totalProceeds: proceeds, proceeds7d: p7d, proceedsYesterday: pYesterday };
  }, [analytics]);

  // Proceeds chart data: merge all apps' dailyRevenue by date
  const { chartData, chartConfig } = useMemo(() => {
    const dateMap: Record<string, Record<string, number>> = {};
    const appNames: string[] = [];

    for (const app of apps) {
      const entry = analytics[app.id];
      if (!entry?.data) continue;
      appNames.push(app.name);
      for (const r of entry.data.dailyRevenue) {
        if (!dateMap[r.date]) dateMap[r.date] = {};
        dateMap[r.date][app.name] = r.proceeds;
      }
    }

    const dates = Object.keys(dateMap).sort();
    const data = dates.map((date) => {
      const row: Record<string, string | number> = { date };
      let total = 0;
      for (const name of appNames) {
        const val = dateMap[date][name] ?? 0;
        row[name] = val;
        total += val;
      }
      row["Total"] = total;
      return row;
    });

    const config: ChartConfig = {};
    for (let i = 0; i < appNames.length; i++) {
      config[appNames[i]] = {
        label: appNames[i],
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    }
    config["Total"] = {
      label: "Total",
      color: "oklch(from var(--foreground) l c h / 0.3)",
    };

    return { chartData: data, chartConfig: config };
  }, [apps, analytics]);

  const appNames = useMemo(
    () => Object.keys(chartConfig).filter((k) => k !== "Total"),
    [chartConfig],
  );

  if (isEntry) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background">
        <div className="drag fixed inset-x-0 top-0 h-16" />
        <Spinner className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Getting things ready…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <EmptyState
        icon={AppWindow}
        title="No apps yet"
        description={
          <>
            Create your apps in{" "}
            <a
              href="https://appstoreconnect.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              App Store Connect
            </a>{" "}
            first, then they&apos;ll appear here automatically.
          </>
        }
      />
    );
  }

  const anyLoaded = Object.values(analytics).some((a) => !a.loading);
  const allPending = Object.values(analytics).length > 0
    && Object.values(analytics).every((a) => !a.loading && a.pending && !a.data);
  const noData = anyLoaded
    && Object.values(analytics).every((a) => !a.loading && !a.data);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total downloads"
          value={anyLoaded ? totalDownloads.toLocaleString() : "–"}
          icon={DownloadSimple}
        />
        <KpiCard
          title="Total proceeds"
          value={anyLoaded ? `$${totalProceeds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "–"}
          icon={CurrencyDollar}
        />
        <KpiCard
          title="Proceeds last 7 days"
          value={anyLoaded ? `$${proceeds7d.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "–"}
          icon={CurrencyDollar}
        />
        <KpiCard
          title="Proceeds yesterday"
          value={anyLoaded ? `$${proceedsYesterday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "–"}
          icon={CurrencyDollar}
        />
      </div>

      {/* Proceeds chart */}
      {allPending || (!anyLoaded && Object.keys(analytics).length > 0) ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Spinner className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Fetching analytics data – this may take a moment on first load
          </p>
        </div>
      ) : noData ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No analytics data available yet.
        </div>
      ) : chartData.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Proceeds (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <LineChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatDateShort}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={(v) => `$${v}`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v) => formatDateShort(v as string)}
                      formatter={(value, name) => (
                        <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                          <span className="text-muted-foreground">{name}</span>
                          <span className="font-mono font-medium tabular-nums">
                            ${(value as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                {appNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="Total"
                  stroke="oklch(from var(--foreground) l c h / 0.3)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : null}

      {/* App cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => {
          const entry = analytics[app.id];
          return (
            <Link key={app.id} href={`/dashboard/apps/${app.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <AppIcon iconUrl={app.iconUrl} name={app.name} />
                  <CardTitle className="text-sm font-medium truncate">
                    {app.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {entry?.loading ? (
                    <Spinner className="size-4 text-muted-foreground" />
                  ) : entry?.pending ? (
                    <p className="text-xs text-muted-foreground">Pending</p>
                  ) : entry?.data ? (
                    <AppCardStats data={entry.data} />
                  ) : (
                    <p className="text-xs text-muted-foreground">No data</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AppCardStats({ data }: { data: AnalyticsData }) {
  const downloads = data.dailyDownloads.reduce(
    (sum, d) => sum + d.firstTime + d.redownload,
    0,
  );
  const proceeds = data.dailyRevenue.reduce(
    (sum, r) => sum + r.proceeds,
    0,
  );

  const totalDevices = data.dailySessions.reduce(
    (sum, s) => sum + s.uniqueDevices,
    0,
  );
  const crashDevices = data.crashesByVersion.reduce(
    (sum, c) => sum + c.uniqueDevices,
    0,
  );
  const crashFree =
    totalDevices > 0
      ? ((1 - crashDevices / totalDevices) * 100).toFixed(1)
      : null;

  return (
    <div className="grid grid-cols-3 gap-3 text-xs tabular-nums">
      <div>
        <p className="text-muted-foreground">Downloads</p>
        <p className="font-medium">{downloads.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Proceeds</p>
        <p className="font-medium">${proceeds.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      {crashFree && (
        <div>
          <p className="text-muted-foreground">Crash-free</p>
          <p className="font-medium">{crashFree}%</p>
        </div>
      )}
    </div>
  );
}
