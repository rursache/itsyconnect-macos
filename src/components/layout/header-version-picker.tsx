"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useParams,
  usePathname,
  useSearchParams,
  useRouter,
} from "next/navigation";
import { ArrowsClockwise, Plus, SpinnerGap } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useApps } from "@/lib/apps-context";
import { useVersions } from "@/lib/versions-context";
import { useFormDirty } from "@/lib/form-dirty-context";
import {
  getVersionPlatforms,
  getVersionsByPlatform,
  resolveVersion,
  EDITABLE_STATES,
  PLATFORM_LABELS,
  STATE_DOT_COLORS,
  type AscVersion,
} from "@/lib/asc/version-types";

const VERSION_PAGES = new Set(["store-listing", "screenshots", "review"]);
const NEW_VERSION_PAGES = new Set(["", "store-listing", "screenshots", "review"]);
const SAVE_ONLY_PAGES = new Set(["details"]);

const LIVE_STATES = new Set([
  "READY_FOR_SALE",
  "READY_FOR_DISTRIBUTION",
  "ACCEPTED",
]);

/** All non-live versions + only the most recent live version. */
function filterPickerVersions(versions: AscVersion[]): AscVersion[] {
  let foundLive = false;
  return versions.filter((v) => {
    if (!LIVE_STATES.has(v.attributes.appVersionState)) return true;
    if (!foundLive) { foundLive = true; return true; }
    return false;
  });
}

export function HeaderVersionPicker() {
  const { appId } = useParams<{ appId?: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { versions } = useVersions();

  if (!appId) return null;

  const pageSegment = pathname
    .replace(`/dashboard/apps/${appId}`, "")
    .replace(/^\//, "")
    .split("/")[0];

  if (!NEW_VERSION_PAGES.has(pageSegment) && !SAVE_ONLY_PAGES.has(pageSegment)) return null;

  if (SAVE_ONLY_PAGES.has(pageSegment)) return null;

  const showVersionPicker = VERSION_PAGES.has(pageSegment);
  const platforms = getVersionPlatforms(versions);
  const versionParam = searchParams.get("version");
  const selectedVersion = resolveVersion(versions, versionParam);
  const currentPlatform = selectedVersion?.attributes.platform ?? platforms[0] ?? "IOS";
  const platformVersions = filterPickerVersions(getVersionsByPlatform(versions, currentPlatform));

  const { isDirty, guardNavigation } = useFormDirty();

  function navigate(versionId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("version", versionId);
    const url = `${pathname}?${params.toString()}`;
    guardNavigation(() => router.replace(url));
  }

  function handlePlatformChange(platform: string) {
    const pvs = getVersionsByPlatform(versions, platform);
    if (pvs.length > 0) {
      navigate(pvs[0].id);
    }
  }

  return (
    <>
      {showVersionPicker && (
        <>
          <Separator orientation="vertical" className="mx-2 !h-4" />
          <Select value={currentPlatform} onValueChange={handlePlatformChange}>
            <SelectTrigger className="!h-8 gap-1 bg-background px-2 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((p) => (
                <SelectItem key={p} value={p}>
                  {PLATFORM_LABELS[p] ?? p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedVersion?.id ?? ""}
            onValueChange={navigate}
          >
            <SelectTrigger className="!h-8 gap-1 bg-background px-2 font-mono text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformVersions.map((v) => (
                <SelectItem key={v.id} value={v.id} className="font-mono">
                  <span className="flex items-center gap-1.5">
                    {v.attributes.versionString}
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${STATE_DOT_COLORS[v.attributes.appVersionState] ?? "bg-muted-foreground"}`}
                    />
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

        </>
      )}
    </>
  );
}

export function HeaderVersionActions() {
  const { appId } = useParams<{ appId?: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { versions, refresh } = useVersions();
  const { isDirty, isSaving, onSave, guardNavigation } = useFormDirty();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [versionString, setVersionString] = useState("");
  const [platform, setPlatform] = useState("");
  const [creating, setCreating] = useState(false);

  const platforms = getVersionPlatforms(versions);

  // Cmd+Enter / Ctrl+Enter to save
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && isDirty && !isSaving) {
        e.preventDefault();
        onSave();
      }
    },
    [isDirty, isSaving, onSave],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!appId) return null;

  const pageSegment = pathname
    .replace(`/dashboard/apps/${appId}`, "")
    .replace(/^\//, "")
    .split("/")[0];

  const showSave = SAVE_ONLY_PAGES.has(pageSegment);
  const showVersionActions = VERSION_PAGES.has(pageSegment);
  const showNewVersion = NEW_VERSION_PAGES.has(pageSegment);

  if (!showSave && !showVersionActions && !showNewVersion) return null;

  const selectedVersion = resolveVersion(versions, searchParams.get("version"));
  const currentPlatform = selectedVersion?.attributes.platform ?? platforms[0] ?? "IOS";
  const readOnly = selectedVersion
    ? !EDITABLE_STATES.has(selectedVersion.attributes.appVersionState)
    : true;

  function openDialog() {
    setVersionString("");
    setPlatform(currentPlatform);
    setDialogOpen(true);
  }

  async function handleCreate() {
    if (!versionString.trim() || !platform) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/apps/${appId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionString: versionString.trim(), platform }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create version");
        return;
      }
      setDialogOpen(false);
      await refresh();
      router.push(`/dashboard/apps/${appId}/store-listing?version=${data.versionId}`);
    } catch {
      toast.error("Failed to create version");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      {showNewVersion && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-sm"
          onClick={() => guardNavigation(openDialog)}
        >
          <Plus size={14} />
          New version
        </Button>
      )}
      {(showSave || (showVersionActions && !readOnly)) && (
        <Button
          size="sm"
          className="h-8 gap-1 text-sm"
          disabled={!isDirty || isSaving}
          onClick={onSave}
        >
          {isSaving && <SpinnerGap size={14} className="animate-spin" />}
          {isSaving ? "Saving\u2026" : "Save"}
          {!isSaving && (
            <kbd className="ml-1 text-[10px] opacity-50 font-sans">&#8984;&#9166;</kbd>
          )}
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New app store version</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="version-string">Version</Label>
              <Input
                id="version-string"
                placeholder="e.g. 1.2.0"
                value={versionString}
                onChange={(e) => setVersionString(e.target.value)}
                className="font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && versionString.trim() && platform) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platform-select">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="platform-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleCreate}
            disabled={!versionString.trim() || !platform || creating}
          >
            {creating && <SpinnerGap size={14} className="animate-spin" />}
            {creating ? "Creating\u2026" : "Create"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function HeaderRefreshButton() {
  const { appId } = useParams<{ appId?: string }>();
  const { refresh: refreshApps } = useApps();
  const { loading, refresh: refreshVersions } = useVersions();
  const { guardNavigation } = useFormDirty();
  const [refreshing, setRefreshing] = useState(false);

  if (!appId) return null;

  async function doRefresh() {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId }),
      });
      await Promise.all([refreshApps(), refreshVersions()]);
    } finally {
      setRefreshing(false);
    }
  }

  const busy = loading || refreshing;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="ml-2 size-8"
      onClick={() => guardNavigation(doRefresh)}
      disabled={busy}
    >
      <ArrowsClockwise size={14} className={busy ? "animate-spin" : ""} />
    </Button>
  );
}
