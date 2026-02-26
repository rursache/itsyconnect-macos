"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AppWindow, ArrowLeft } from "@phosphor-icons/react";
import {
  getTFBuild,
  MOCK_BETA_GROUPS,
  type MockTFBuild,
} from "@/lib/mock-testflight";

const STATUS_DOTS: Record<MockTFBuild["status"], string> = {
  Testing: "bg-green-500",
  "Ready to submit": "bg-yellow-500",
  Processing: "bg-blue-500",
  Expired: "bg-red-500",
};

function CharCount({ value, limit }: { value: string; limit?: number }) {
  const count = value?.length ?? 0;
  if (!limit) return null;
  const over = count > limit;

  return (
    <span
      className={`text-xs tabular-nums ${over ? "font-medium text-destructive" : "text-muted-foreground"}`}
    >
      {count}/{limit}
    </span>
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BuildDetailPage() {
  const { appId, buildId } = useParams<{ appId: string; buildId: string }>();
  const build = useMemo(() => getTFBuild(buildId), [buildId]);
  const groups = useMemo(
    () =>
      build
        ? MOCK_BETA_GROUPS.filter((g) => build.groupIds.includes(g.id))
        : [],
    [build],
  );

  const [whatsNew, setWhatsNew] = useState(build?.whatsNew ?? "");

  const daysUntilExpiry = useMemo(() => {
    if (!build) return null;
    const now = Date.now();
    const expiry = new Date(build.expiryDate).getTime();
    if (expiry <= now) return null;
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  }, [build]);

  if (!build) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Build not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/dashboard/apps/${appId}/testflight`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to builds
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-b from-blue-500 to-blue-600 text-white">
            <AppWindow size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Build {build.buildNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {build.versionString}
              {daysUntilExpiry !== null && (
                <span className="ml-2">
                  · Expires in {daysUntilExpiry} days
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block size-2 shrink-0 rounded-full ${STATUS_DOTS[build.status]}`}
          />
          <span className="text-sm font-medium">{build.status}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6 text-sm">
        <div>
          <p className="text-muted-foreground">Created</p>
          <p className="font-medium tabular-nums">
            {formatDateTime(build.uploadedDate)}
          </p>
        </div>
        <div className="h-8 border-l" />
        <div>
          <p className="text-muted-foreground">Testers</p>
          <p className="font-medium tabular-nums">{build.testerCount}</p>
        </div>
      </div>

      {/* What's new */}
      <section className="space-y-2">
        <h3 className="section-title">What&apos;s new</h3>
        <Card className="gap-0 py-0">
          <CardContent className="px-5 py-4">
            <Textarea
              value={whatsNew}
              onChange={(e) => setWhatsNew(e.target.value)}
              placeholder="Describe what's new in this build…"
              className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none font-mono text-sm min-h-0"
            />
          </CardContent>
          <div className="flex items-center justify-end border-t px-3 py-1.5">
            <CharCount value={whatsNew} limit={4000} />
          </div>
        </Card>
      </section>

      {/* Groups */}
      <section className="space-y-3">
        <h3 className="section-title">Groups</h3>
        {groups.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No groups assigned to this build.
          </div>
        ) : (
          <div className="space-y-1">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/dashboard/apps/${appId}/testflight/groups/${g.id}`}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <Badge
                  variant="secondary"
                  className="text-xs font-normal px-1.5"
                >
                  {g.shortLabel}
                </Badge>
                <span className="text-sm font-medium">{g.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {g.testerCount} testers
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Testers */}
      <section className="space-y-3">
        <h3 className="section-title">Testers</h3>
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No individual testers – testers are managed via groups
        </div>
      </section>
    </div>
  );
}
