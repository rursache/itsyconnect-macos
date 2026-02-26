"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AppWindow,
  Check,
  Export,
  FloppyDisk,
  PencilSimple,
  Prohibit,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  MOCK_APPS,
  getVersion,
  getVersionLocalizations,
  getVersionBuild,
} from "@/lib/mock-data";
import { localeName, FIELD_LIMITS } from "@/lib/asc/locale-names";

const STATE_COLORS: Record<string, string> = {
  READY_FOR_SALE: "text-green-600",
  READY_FOR_DISTRIBUTION: "text-green-600",
  ACCEPTED: "text-green-600",
  IN_REVIEW: "text-blue-600",
  WAITING_FOR_REVIEW: "text-amber-600",
  PREPARE_FOR_SUBMISSION: "text-yellow-600",
  REJECTED: "text-red-600",
  METADATA_REJECTED: "text-red-600",
  DEVELOPER_REJECTED: "text-red-600",
};

const STATE_DOT_COLORS: Record<string, string> = {
  READY_FOR_SALE: "bg-green-500",
  READY_FOR_DISTRIBUTION: "bg-green-500",
  ACCEPTED: "bg-green-500",
  IN_REVIEW: "bg-blue-500",
  WAITING_FOR_REVIEW: "bg-amber-500",
  PREPARE_FOR_SUBMISSION: "bg-yellow-500",
  REJECTED: "bg-red-500",
  METADATA_REJECTED: "bg-red-500",
  DEVELOPER_REJECTED: "bg-red-500",
};

function stateLabel(state: string): string {
  return state
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PLATFORM_LABELS: Record<string, string> = {
  IOS: "iOS",
  MAC_OS: "macOS",
  TV_OS: "tvOS",
  VISION_OS: "visionOS",
};

export default function VersionPage() {
  const { appId, versionId } = useParams<{
    appId: string;
    versionId: string;
  }>();

  const app = MOCK_APPS.find((a) => a.id === appId);
  const version = getVersion(versionId);
  const localizations = getVersionLocalizations(versionId);
  const build = getVersionBuild(versionId);

  const [selectedLocale, setSelectedLocale] = useState(
    localizations[0]?.locale ?? ""
  );
  const selected = localizations.find((l) => l.locale === selectedLocale);

  const [promotionalText, setPromotionalText] = useState(
    selected?.promotionalText ?? ""
  );
  const [whatsNew, setWhatsNew] = useState(selected?.whatsNew ?? "");
  const [releaseType, setReleaseType] = useState("manually");
  const [phasedRelease, setPhasedRelease] = useState(false);

  function handleLocaleChange(locale: string) {
    setSelectedLocale(locale);
    const loc = localizations.find((l) => l.locale === locale);
    setPromotionalText(loc?.promotionalText ?? "");
    setWhatsNew(loc?.whatsNew ?? "");
  }

  if (!version || !app) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Version not found
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-8 px-2">
          {/* Version heading + status */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {version.versionString}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground"
                onClick={() => toast.info("Inline editing not available in prototype")}
              >
                <PencilSimple size={14} />
              </Button>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 text-sm font-medium ${STATE_COLORS[version.appVersionState] ?? "text-muted-foreground"}`}
            >
              <span
                className={`size-2 rounded-full ${STATE_DOT_COLORS[version.appVersionState] ?? "bg-muted-foreground"}`}
              />
              {stateLabel(version.appVersionState)}
            </span>
          </div>

          {/* Promotional text */}
          <section className="space-y-2">
            <h3 className="section-title">Promotional text</h3>
            <Card className="gap-0 py-0">
              <CardContent className="px-5 py-4">
                <Textarea
                  value={promotionalText}
                  onChange={(e) => setPromotionalText(e.target.value)}
                  placeholder="Inform your App Store visitors of any current app features..."
                  className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none font-mono text-sm min-h-0"
                />
              </CardContent>
              <div className="flex items-center justify-end border-t px-3 py-1.5">
                <CharCount
                  value={promotionalText}
                  limit={FIELD_LIMITS.promotionalText}
                />
              </div>
            </Card>
          </section>

          {/* What's new */}
          <section className="space-y-2">
            <h3 className="section-title">What&apos;s new?</h3>
            <Card className="gap-0 py-0">
              <CardContent className="px-5 py-4">
                <Textarea
                  value={whatsNew}
                  onChange={(e) => setWhatsNew(e.target.value)}
                  placeholder="Describe what's new in this version of your app..."
                  className="border-0 p-0 shadow-none focus-visible:ring-0 resize-none font-mono text-sm min-h-0"
                />
              </CardContent>
              <div className="flex items-center justify-end border-t px-3 py-1.5">
                <CharCount
                  value={whatsNew}
                  limit={FIELD_LIMITS.whatsNew}
                />
              </div>
            </Card>
          </section>

          {/* Build */}
          <section className="space-y-2">
            <h3 className="section-title">Build</h3>
            {build ? (
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm">
                  <AppWindow size={20} weight="fill" />
                </div>
                <div>
                  <p className="font-semibold">Build {build.buildNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(build.uploadedDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    &middot; Version {build.versionString}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No build attached to this version yet.
              </div>
            )}
          </section>

          {/* Release settings */}
          <section className="space-y-6 pb-8">
            <h3 className="section-title">Release settings</h3>

            <div className="space-y-3">
              <p className="text-sm font-medium">Release method</p>
              <Tabs
                value={releaseType}
                onValueChange={setReleaseType}
                className="w-full max-w-md"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="automatically">Automatic</TabsTrigger>
                  <TabsTrigger value="manually">Manual</TabsTrigger>
                  <TabsTrigger value="after-date">Scheduled</TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-sm text-muted-foreground">
                {releaseType === "automatically" &&
                  "Goes live as soon as App Review approves it."}
                {releaseType === "manually" &&
                  "Stays on hold after approval – you decide when to release."}
                {releaseType === "after-date" &&
                  "Released on a date you choose, after approval."}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Phased rollout</p>
              <p className="text-sm text-muted-foreground">
                Gradually roll out to users over 7 days. Only affects automatic
                updates – manual downloads get the new version immediately.
              </p>
              <div className="flex items-center gap-3">
                <Switch
                  checked={phasedRelease}
                  onCheckedChange={setPhasedRelease}
                />
                <Label className="text-sm">Enable 7-day phased rollout</Label>
              </div>
            </div>
          </section>
        </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t bg-background px-6 py-3">
        <div className="flex items-center gap-2">
          <Check size={16} className="text-muted-foreground" />
        </div>
        <div className="flex items-center gap-3">
          {/* Locale switcher */}
          <select
            value={selectedLocale}
            onChange={(e) => handleLocaleChange(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {localizations.map((l) => (
              <option key={l.locale} value={l.locale}>
                {localeName(l.locale)}
              </option>
            ))}
          </select>

          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              toast.info("This is a prototype – submission not available")
            }
          >
            <Prohibit size={14} className="mr-1.5" />
            Cancel submission
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Sharing not available in prototype")}
          >
            <Export size={14} className="mr-1.5" />
            Share
          </Button>

          <Button
            size="sm"
            onClick={() => toast.success("Changes saved (prototype)")}
          >
            <FloppyDisk size={14} className="mr-1.5" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

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
