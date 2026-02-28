"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CircleNotch, ArrowClockwise } from "@phosphor-icons/react";
import { useApps } from "@/lib/apps-context";
import { useVersions } from "@/lib/versions-context";
import { resolveVersion, PLATFORM_LABELS } from "@/lib/asc/version-types";
import { useRegisterRefresh } from "@/lib/refresh-context";
import type { TFBuild, TFGroup } from "@/lib/asc/testflight";

const STATUS_DOTS: Record<string, string> = {
  Testing: "bg-green-500",
  "Ready to test": "bg-green-500",
  "Ready to submit": "bg-yellow-500",
  "In beta review": "bg-blue-500",
  "In compliance review": "bg-blue-500",
  Processing: "bg-blue-500",
  Expired: "bg-red-500",
  Invalid: "bg-red-500",
  "Missing compliance": "bg-amber-500",
  "Processing exception": "bg-red-500",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function TestFlightBuildsPage() {
  const { appId } = useParams<{ appId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apps } = useApps();
  const app = apps.find((a) => a.id === appId);
  const { versions, loading: versionsLoading } = useVersions();

  const selectedVersion = resolveVersion(versions, searchParams.get("version"));
  const platform = selectedVersion?.attributes.platform;
  const versionString = selectedVersion?.attributes.versionString;

  const [builds, setBuilds] = useState<TFBuild[]>([]);
  const [groups, setGroups] = useState<TFGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (forceRefresh) params.set("refresh", "1");
      if (platform) params.set("platform", platform);
      if (versionString) params.set("version", versionString);
      const qs = params.toString() ? `?${params}` : "";

      const [buildsRes, groupsRes] = await Promise.all([
        fetch(`/api/apps/${appId}/testflight/builds${qs}`),
        fetch(`/api/apps/${appId}/testflight/groups${forceRefresh ? "?refresh=1" : ""}`),
      ]);

      if (!buildsRes.ok) {
        const data = await buildsRes.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to fetch builds (${buildsRes.status})`);
      }

      const buildsData = await buildsRes.json();
      setBuilds(buildsData.builds);

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch builds");
    } finally {
      setLoading(false);
    }
  }, [appId, platform, versionString]);

  // Wait for versions to load before fetching builds (prevents double-fetch)
  useEffect(() => {
    if (!versionsLoading) fetchData();
  }, [fetchData, versionsLoading]);

  const handleRefresh = useCallback(() => fetchData(true), [fetchData]);
  useRegisterRefresh({ onRefresh: handleRefresh, busy: loading });

  // Stats
  const stats = useMemo(() => {
    const total = builds.length;
    const dates = builds.map((b) => new Date(b.uploadedDate).getTime());
    const firstDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
    const latestDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

    return { total, firstDate, latestDate };
  }, [builds]);

  if (!app) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        App not found
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <CircleNotch size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
        <p>{error}</p>
        <Button variant="outline" size="sm" onClick={() => fetchData()}>
          <ArrowClockwise size={14} className="mr-1.5" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <p className="text-muted-foreground">Total builds</p>
          <p className="font-medium tabular-nums">{stats.total}</p>
        </div>
        <div className="h-8 border-l" />
        <div>
          <p className="text-muted-foreground">First build</p>
          <p className="font-medium tabular-nums">
            {stats.firstDate ? formatDate(stats.firstDate.toISOString()) : "–"}
          </p>
        </div>
        <div className="h-8 border-l" />
        <div>
          <p className="text-muted-foreground">Latest</p>
          <p className="font-medium tabular-nums">
            {stats.latestDate
              ? formatDate(stats.latestDate.toISOString())
              : "–"}
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Build</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Groups</TableHead>
            <TableHead className="text-right">Installs</TableHead>
            <TableHead className="text-right">Sessions</TableHead>
            <TableHead className="text-right">Crashes</TableHead>
            <TableHead className="text-right">Uploaded</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {builds.map((build) => {
            const buildGroups = groups.filter((g) =>
              build.groupIds.includes(g.id),
            );

            return (
              <TableRow
                key={build.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(
                    `/dashboard/apps/${appId}/testflight/${build.id}`,
                  )
                }
              >
                <TableCell className="font-medium">
                  {build.buildNumber}
                </TableCell>
                <TableCell>
                  <div>
                    <span className="text-sm">{build.versionString}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {PLATFORM_LABELS[build.platform] ?? build.platform}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block size-2 shrink-0 rounded-full ${STATUS_DOTS[build.status] ?? "bg-gray-400"}`}
                    />
                    <span className="text-sm">{build.status}</span>
                  </div>
                  {build.expired && build.expirationDate && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(build.expirationDate)}
                    </p>
                  )}
                  {!build.expired && build.expirationDate && build.status === "Testing" && (
                    <p className="text-xs text-muted-foreground">
                      Expires {formatDate(build.expirationDate)}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {buildGroups.length > 0 ? (
                    <div className="space-y-0.5">
                      {buildGroups.map((g) => (
                        <div key={g.id} className="flex items-center gap-1.5 text-sm">
                          <span className={`inline-flex size-4 items-center justify-center rounded text-[10px] font-medium ${g.isInternal ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-700"}`}>
                            {g.isInternal ? "I" : "E"}
                          </span>
                          <span>{g.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">&ndash;</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {build.installs > 0 ? build.installs : "–"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {build.sessions > 0 ? build.sessions : "–"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {build.crashes > 0 ? build.crashes : "–"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatDate(build.uploadedDate)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
