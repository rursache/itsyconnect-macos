"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { AppWindow, CircleNotch, ArrowClockwise, FloppyDisk } from "@phosphor-icons/react";
import { toast } from "sonner";
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

  const [build, setBuild] = useState<TFBuild | null>(null);
  const [groups, setGroups] = useState<TFGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [whatsNew, setWhatsNew] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const qs = forceRefresh ? "?refresh=1" : "";
      const [buildRes, groupsRes] = await Promise.all([
        fetch(`/api/apps/${appId}/testflight/builds/${buildId}${qs}`),
        fetch(`/api/apps/${appId}/testflight/groups${qs}`),
      ]);

      if (!buildRes.ok) {
        const data = await buildRes.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to fetch build (${buildRes.status})`);
      }

      const buildData = await buildRes.json();
      setBuild(buildData.build);
      setWhatsNew(buildData.build.whatsNew ?? "");

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData.groups);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch build");
    } finally {
      setLoading(false);
    }
  }, [appId, buildId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => fetchData(true), [fetchData]);
  useRegisterRefresh({ onRefresh: handleRefresh, busy: loading });

  const buildGroups = useMemo(
    () =>
      build
        ? groups.filter((g) => build.groupIds.includes(g.id))
        : [],
    [build, groups],
  );

  const [mountTime] = useState(() => Date.now());
  const daysUntilExpiry = useMemo(() => {
    if (!build?.expirationDate || build.expired) return null;
    const expiry = new Date(build.expirationDate).getTime();
    if (expiry <= mountTime) return null;
    return Math.ceil((expiry - mountTime) / (1000 * 60 * 60 * 24));
  }, [build, mountTime]);

  const hasChanges = build && whatsNew !== (build.whatsNew ?? "");

  async function handleSave() {
    if (!build?.whatsNewLocalizationId) {
      toast.error("Cannot save – no localization ID available");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/apps/${appId}/testflight/builds/${buildId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsNew,
          localizationId: build.whatsNewLocalizationId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      toast.success("What's new saved");
      // Update local state
      setBuild((prev) => prev ? { ...prev, whatsNew } : prev);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
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

  if (!build) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Build not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            className={`inline-block size-2 shrink-0 rounded-full ${STATUS_DOTS[build.status] ?? "bg-gray-400"}`}
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
          <p className="text-muted-foreground">Installs</p>
          <p className="font-medium tabular-nums">{build.installs}</p>
        </div>
        <div className="h-8 border-l" />
        <div>
          <p className="text-muted-foreground">Sessions</p>
          <p className="font-medium tabular-nums">{build.sessions}</p>
        </div>
        <div className="h-8 border-l" />
        <div>
          <p className="text-muted-foreground">Crashes</p>
          <p className="font-medium tabular-nums">{build.crashes}</p>
        </div>
      </div>

      {/* What's new */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="section-title">What&apos;s new</h3>
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <CircleNotch size={14} className="mr-1.5 animate-spin" />
              ) : (
                <FloppyDisk size={14} className="mr-1.5" />
              )}
              Save
            </Button>
          )}
        </div>
        <Card className="gap-0 py-0">
          <CardContent className="px-5 py-4">
            <Textarea
              value={whatsNew}
              onChange={(e) => setWhatsNew(e.target.value)}
              placeholder="Describe what's new in this build…"
              className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none font-mono text-sm min-h-0 dark:bg-transparent"
            />
          </CardContent>
          <div className="flex items-center rounded-b-xl border-t bg-sidebar px-3 py-1.5">
            <CharCount value={whatsNew} limit={4000} />
          </div>
        </Card>
      </section>

      {/* Groups */}
      <section className="space-y-3">
        <h3 className="section-title">Groups</h3>
        {buildGroups.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No groups assigned to this build.
          </div>
        ) : (
          <div className="space-y-1">
            {buildGroups.map((g) => (
              <Link
                key={g.id}
                href={`/dashboard/apps/${appId}/testflight/groups/${g.id}`}
                className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <span className={`inline-flex size-4 items-center justify-center rounded text-[10px] font-medium ${g.isInternal ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-700"}`}>
                  {g.isInternal ? "I" : "E"}
                </span>
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
