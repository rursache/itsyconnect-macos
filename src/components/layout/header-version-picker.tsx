"use client";

import {
  useParams,
  usePathname,
  useSearchParams,
  useRouter,
} from "next/navigation";
import { FloppyDisk, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useVersions } from "@/lib/versions-context";
import {
  getVersionPlatforms,
  getVersionsByPlatform,
  resolveVersion,
} from "@/lib/asc/version-types";

const VERSION_PAGES = new Set(["store-listing", "screenshots", "review"]);
const NEW_VERSION_PAGES = new Set(["", "store-listing", "screenshots", "review"]);
const SAVE_ONLY_PAGES = new Set(["details"]);

const EDITABLE_STATES = new Set([
  "PREPARE_FOR_SUBMISSION",
  "REJECTED",
  "METADATA_REJECTED",
  "DEVELOPER_REJECTED",
]);

const PLATFORM_LABELS: Record<string, string> = {
  IOS: "iOS",
  MAC_OS: "macOS",
  TV_OS: "tvOS",
  VISION_OS: "visionOS",
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
  const platformVersions = getVersionsByPlatform(versions, currentPlatform);

  function navigate(versionId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("version", versionId);
    router.replace(`${pathname}?${params.toString()}`);
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
            <SelectTrigger className="h-7 w-24 gap-1 text-xs">
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
            <SelectTrigger className="h-7 w-28 gap-1 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {platformVersions.map((v) => (
                <SelectItem key={v.id} value={v.id} className="font-mono">
                  {v.attributes.versionString}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedVersion && (
            <span className="ml-1 hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
              <span
                className={`size-1.5 shrink-0 rounded-full ${STATE_DOT_COLORS[selectedVersion.attributes.appVersionState] ?? "bg-muted-foreground"}`}
              />
              {stateLabel(selectedVersion.attributes.appVersionState)}
            </span>
          )}
        </>
      )}
    </>
  );
}

export function HeaderVersionActions() {
  const { appId } = useParams<{ appId?: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { versions } = useVersions();

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
  const readOnly = selectedVersion
    ? !EDITABLE_STATES.has(selectedVersion.attributes.appVersionState)
    : true;

  return (
    <>
      {showNewVersion && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() =>
            toast.info("New version creation not available in prototype")
          }
        >
          <Plus size={12} />
          New version
        </Button>
      )}
      {(showSave || (showVersionActions && !readOnly)) && (
        <Button
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => toast.success("Changes saved (prototype)")}
        >
          <FloppyDisk size={12} />
          Save
        </Button>
      )}
    </>
  );
}
