"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_APPS } from "@/lib/mock-data";
import {
  getAppTFBuilds,
  MOCK_BETA_GROUPS,
  type MockTFBuild,
} from "@/lib/mock-testflight";

const PLATFORM_LABELS: Record<string, string> = {
  IOS: "iOS",
  MAC_OS: "macOS",
};

const STATUS_DOTS: Record<MockTFBuild["status"], string> = {
  Testing: "bg-green-500",
  "Ready to submit": "bg-yellow-500",
  Processing: "bg-blue-500",
  Expired: "bg-red-500",
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
  const app = MOCK_APPS.find((a) => a.id === appId);
  const allBuilds = useMemo(() => getAppTFBuilds(appId), [appId]);

  const platforms = useMemo(
    () => [...new Set(allBuilds.map((b) => b.platform))],
    [allBuilds],
  );
  const [platformFilter, setPlatformFilter] = useState("all");

  // Derive versions for the selected platform
  const versionsForPlatform = useMemo(() => {
    const platformBuilds =
      platformFilter === "all"
        ? allBuilds
        : allBuilds.filter((b) => b.platform === platformFilter);
    return [...new Set(platformBuilds.map((b) => b.versionString))];
  }, [allBuilds, platformFilter]);

  const [versionFilter, setVersionFilter] = useState("all");

  // Reset version filter when platform changes and version is no longer available
  const effectiveVersion =
    versionFilter !== "all" && versionsForPlatform.includes(versionFilter)
      ? versionFilter
      : "all";

  const builds = useMemo(() => {
    let filtered = allBuilds;
    if (platformFilter !== "all") {
      filtered = filtered.filter((b) => b.platform === platformFilter);
    }
    if (effectiveVersion !== "all") {
      filtered = filtered.filter((b) => b.versionString === effectiveVersion);
    }
    return filtered;
  }, [allBuilds, platformFilter, effectiveVersion]);

  // Stats
  const stats = useMemo(() => {
    const total = builds.length;
    const dates = builds.map((b) => new Date(b.uploadedDate).getTime());
    const firstDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
    const latestDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

    const now = Date.now();
    const activeExpiries = builds
      .filter((b) => b.status === "Testing" || b.status === "Ready to submit")
      .map((b) => new Date(b.expiryDate).getTime())
      .filter((t) => t > now);
    const nearestExpiry =
      activeExpiries.length > 0
        ? Math.ceil((Math.min(...activeExpiries) - now) / (1000 * 60 * 60 * 24))
        : null;

    return { total, firstDate, latestDate, nearestExpiry };
  }, [builds]);

  if (!app) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        App not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Builds</h1>
        <div className="flex items-center gap-2">
          {platforms.length > 1 && (
            <Select
              value={platformFilter}
              onValueChange={(v) => {
                setPlatformFilter(v);
                setVersionFilter("all");
              }}
            >
              <SelectTrigger className="w-[140px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All platforms</SelectItem>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLATFORM_LABELS[p] ?? p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {versionsForPlatform.length > 1 && (
            <Select value={effectiveVersion} onValueChange={setVersionFilter}>
              <SelectTrigger className="w-[140px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All versions</SelectItem>
                {versionsForPlatform.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

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
        <div className="h-8 border-l" />
        <div>
          <p className="text-muted-foreground">Expires in</p>
          <p className="font-medium tabular-nums">
            {stats.nearestExpiry !== null
              ? `${stats.nearestExpiry} days`
              : "–"}
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Build</TableHead>
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
            const groups = MOCK_BETA_GROUPS.filter((g) =>
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
                <TableCell>
                  <div>
                    <span className="font-medium">{build.buildNumber}</span>
                    <span className="ml-1.5 text-muted-foreground">
                      {build.versionString}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {PLATFORM_LABELS[build.platform] ?? build.platform}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block size-2 shrink-0 rounded-full ${STATUS_DOTS[build.status]}`}
                    />
                    <span className="text-sm">{build.status}</span>
                  </div>
                  {build.status === "Expired" && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(build.expiryDate)}
                    </p>
                  )}
                  {build.status === "Testing" && (
                    <p className="text-xs text-muted-foreground">
                      Expires {formatDate(build.expiryDate)}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {groups.length > 0
                      ? groups.map((g) => (
                          <Badge
                            key={g.id}
                            variant="secondary"
                            className="text-xs font-normal px-1.5"
                          >
                            {g.shortLabel}
                          </Badge>
                        ))
                      : <span className="text-sm text-muted-foreground">&ndash;</span>}
                  </div>
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
