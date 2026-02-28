"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CircleNotch, ArrowClockwise, LinkSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useApps } from "@/lib/apps-context";
import { useRegisterRefresh } from "@/lib/refresh-context";
import type { TFGroup } from "@/lib/asc/testflight";

export default function GroupsPage() {
  const { appId } = useParams<{ appId: string }>();
  const { apps } = useApps();
  const app = apps.find((a) => a.id === appId);

  const [groups, setGroups] = useState<TFGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const qs = forceRefresh ? "?refresh=1" : "";
      const res = await fetch(`/api/apps/${appId}/testflight/groups${qs}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to fetch groups (${res.status})`);
      }
      const data = await res.json();
      setGroups(data.groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => fetchData(true), [fetchData]);
  useRegisterRefresh({ onRefresh: handleRefresh, busy: loading });

  const internalGroups = groups.filter((g) => g.isInternal);
  const externalGroups = groups.filter((g) => !g.isInternal);

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
      {internalGroups.length > 0 && (
        <section className="space-y-3">
          <h3 className="section-title">Internal groups</h3>
          <div className="rounded-lg border">
            {internalGroups.map((group, i) => (
              <Link
                key={group.id}
                href={`/dashboard/apps/${appId}/testflight/groups/${group.id}`}
                className={`flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 ${i > 0 ? "border-t" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-4 items-center justify-center rounded text-[10px] font-medium bg-muted text-muted-foreground">
                    I
                  </span>
                  <span className="text-sm font-medium">{group.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{group.testerCount} testers</span>
                  <span>{group.buildCount} builds</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {externalGroups.length > 0 && (
        <section className="space-y-3">
          <h3 className="section-title">External groups</h3>
          <div className="rounded-lg border">
            {externalGroups.map((group, i) => (
              <Link
                key={group.id}
                href={`/dashboard/apps/${appId}/testflight/groups/${group.id}`}
                className={`flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 ${i > 0 ? "border-t" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-4 items-center justify-center rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                    E
                  </span>
                  <span className="text-sm font-medium">{group.name}</span>
                  {group.publicLinkEnabled && (
                    <LinkSimple size={14} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{group.testerCount} testers</span>
                  <span>{group.buildCount} builds</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
