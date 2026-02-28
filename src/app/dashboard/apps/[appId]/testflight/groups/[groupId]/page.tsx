"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, CircleNotch, ArrowClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useRegisterRefresh } from "@/lib/refresh-context";
import type { TFBuild, TFGroup, TFTester } from "@/lib/asc/testflight";

const TESTER_STATUS_DOTS: Record<string, string> = {
  INSTALLED: "bg-green-500",
  ACCEPTED: "bg-yellow-500",
  INVITED: "bg-blue-500",
  NOT_INVITED: "bg-gray-400",
  REVOKED: "bg-red-500",
};

const TESTER_STATUS_LABELS: Record<string, string> = {
  INSTALLED: "Installed",
  ACCEPTED: "Accepted",
  INVITED: "Invited",
  NOT_INVITED: "Not invited",
  REVOKED: "Revoked",
};

const BUILD_STATUS_DOTS: Record<string, string> = {
  Testing: "bg-green-500",
  "Ready to test": "bg-green-500",
  "Ready to submit": "bg-yellow-500",
  "In beta review": "bg-blue-500",
  Processing: "bg-blue-500",
  Expired: "bg-red-500",
  Invalid: "bg-red-500",
  "Missing compliance": "bg-amber-500",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function GroupDetailPage() {
  const { appId, groupId } = useParams<{ appId: string; groupId: string }>();
  const router = useRouter();

  const [group, setGroup] = useState<TFGroup | null>(null);
  const [builds, setBuilds] = useState<TFBuild[]>([]);
  const [testers, setTesters] = useState<TFTester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const qs = forceRefresh ? "?refresh=1" : "";
      const res = await fetch(`/api/apps/${appId}/testflight/groups/${groupId}${qs}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to fetch group (${res.status})`);
      }
      const data = await res.json();
      setGroup(data.group);
      setBuilds(data.builds);
      setTesters(data.testers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch group");
    } finally {
      setLoading(false);
    }
  }, [appId, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => fetchData(true), [fetchData]);
  useRegisterRefresh({ onRefresh: handleRefresh, busy: loading });

  const [publicLinkEnabled, setPublicLinkEnabled] = useState(false);

  // Sync public link toggle with fetched group data
  useEffect(() => {
    if (group) setPublicLinkEnabled(group.publicLinkEnabled);
  }, [group]);

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

  if (!group) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Group not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className={`inline-flex size-5 items-center justify-center rounded text-xs font-medium ${group.isInternal ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-700"}`}>
            {group.isInternal ? "I" : "E"}
          </span>
          <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{group.isInternal ? "Internal" : "External"}</span>
          <span>{group.testerCount} testers</span>
          <span>{group.buildCount} builds</span>
        </div>
      </div>

      {/* Public link */}
      {!group.isInternal && (
        <section className="space-y-3">
          <h3 className="section-title">Public link</h3>
          <div className="flex items-center gap-3">
            <Switch
              id="public-link"
              checked={publicLinkEnabled}
              onCheckedChange={setPublicLinkEnabled}
            />
            <Label htmlFor="public-link" className="text-sm">
              {publicLinkEnabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
          {publicLinkEnabled && group.publicLink && (
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 font-mono text-sm text-muted-foreground">
                {group.publicLink}
              </code>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(group.publicLink!);
                  toast.success("Link copied to clipboard");
                }}
              >
                <Copy size={16} />
              </Button>
            </div>
          )}
        </section>
      )}

      {/* Builds */}
      <section className="space-y-3">
        <h3 className="section-title">Builds</h3>
        {builds.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No builds assigned to this group.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Build</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Installs</TableHead>
                <TableHead className="text-right">Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {builds.map((build) => (
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
                  <TableCell className="text-sm">
                    {build.versionString}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block size-2 shrink-0 rounded-full ${BUILD_STATUS_DOTS[build.status] ?? "bg-gray-400"}`}
                      />
                      <span className="text-sm">{build.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {build.installs > 0 ? build.installs : "–"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {formatDate(build.uploadedDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Testers table */}
      <section className="space-y-3">
        <h3 className="section-title">Testers</h3>
        {testers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No testers in this group yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tester</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Crashes</TableHead>
                <TableHead className="text-right">Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testers.map((tester) => {
                const isPublicLink = tester.inviteType === "PUBLIC_LINK";
                return (
                  <TableRow key={tester.id}>
                    <TableCell>
                      {isPublicLink ? (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Anonymous
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Public link
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium">
                            {tester.firstName} {tester.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tester.email}
                          </p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block size-2 shrink-0 rounded-full ${TESTER_STATUS_DOTS[tester.state] ?? "bg-gray-400"}`}
                        />
                        <span className="text-sm">
                          {TESTER_STATUS_LABELS[tester.state] ?? tester.state}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {tester.sessions > 0 ? tester.sessions : "\u2013"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {tester.crashes > 0 ? tester.crashes : "\u2013"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {tester.feedbackCount > 0 ? tester.feedbackCount : "\u2013"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
