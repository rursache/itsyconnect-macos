"use client";

import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_APPS, getAppVersions } from "@/lib/mock-data";
import { AppWindow, Package, Globe, Tag, Hash } from "@phosphor-icons/react";

const STATE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  READY_FOR_SALE: "default",
  READY_FOR_DISTRIBUTION: "default",
  PREPARE_FOR_SUBMISSION: "secondary",
  WAITING_FOR_REVIEW: "outline",
  IN_REVIEW: "outline",
  ACCEPTED: "default",
  REJECTED: "destructive",
  METADATA_REJECTED: "destructive",
  DEVELOPER_REJECTED: "destructive",
};

function stateLabel(state: string): string {
  return state
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AppOverviewPage() {
  const { appId } = useParams<{ appId: string }>();
  const app = MOCK_APPS.find((a) => a.id === appId);
  const versions = getAppVersions(appId);

  if (!app) {
    return (
      <div className="flex items-center justify-center p-6 py-20 text-muted-foreground">
        App not found
      </div>
    );
  }

  const latestVersion = versions[0];

  return (
    <div className="space-y-6 overflow-auto p-6">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm">
          <AppWindow size={28} weight="fill" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{app.name}</h1>
          <p className="text-sm text-muted-foreground">{app.bundleId}</p>
        </div>
        {latestVersion && (
          <Badge
            variant={STATE_VARIANTS[latestVersion.appVersionState] ?? "secondary"}
            className="ml-auto"
          >
            {stateLabel(latestVersion.appVersionState)}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versions</CardTitle>
            <Package size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{versions.length}</div>
            <p className="text-xs text-muted-foreground">
              across {new Set(versions.map((v) => v.platform)).size} platform{new Set(versions.map((v) => v.platform)).size !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest version</CardTitle>
            <Tag size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {latestVersion?.versionString ?? "–"}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestVersion?.platform ?? "No versions"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary locale</CardTitle>
            <Globe size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{app.primaryLocale}</div>
            <p className="text-xs text-muted-foreground">Default language</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SKU</CardTitle>
            <Hash size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono truncate">{app.sku}</div>
            <p className="text-xs text-muted-foreground">Unique identifier</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Select a version from the sidebar to edit its localizations, or use the
            navigation below to manage screenshots, app information, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
