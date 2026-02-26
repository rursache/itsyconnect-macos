"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DeviceMobile,
  Desktop,
  Television,
  Eyeglasses,
  CaretRight,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { getAppVersions, type MockVersion } from "@/lib/mock-data";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

const PLATFORM_META: Record<
  string,
  { label: string; icon: Icon }
> = {
  IOS: { label: "iOS", icon: DeviceMobile },
  MAC_OS: { label: "macOS", icon: Desktop },
  TV_OS: { label: "tvOS", icon: Television },
  VISION_OS: { label: "visionOS", icon: Eyeglasses },
};

const STATE_COLORS: Record<string, string> = {
  READY_FOR_SALE: "bg-green-500",
  READY_FOR_DISTRIBUTION: "bg-green-500",
  ACCEPTED: "bg-green-500",
  IN_REVIEW: "bg-blue-500",
  WAITING_FOR_REVIEW: "bg-blue-500",
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

export function NavVersions({ appId }: { appId: string }) {
  const { versionId } = useParams<{ versionId?: string }>();
  const versions = getAppVersions(appId);

  const grouped = versions.reduce<Record<string, MockVersion[]>>(
    (acc, ver) => {
      (acc[ver.platform] ??= []).push(ver);
      return acc;
    },
    {}
  );

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Versions</SidebarGroupLabel>
      <SidebarMenu>
        {Object.entries(grouped).map(([platform, vers]) => {
          const meta = PLATFORM_META[platform] ?? {
            label: platform,
            icon: DeviceMobile,
          };
          const PlatformIcon = meta.icon;

          return (
            <Collapsible key={platform} defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={meta.label}>
                    <PlatformIcon size={16} />
                    <span>{meta.label}</span>
                    <CaretRight
                      size={14}
                      className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {vers.map((ver) => (
                      <SidebarMenuSubItem key={ver.id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={ver.id === versionId}
                        >
                          <Link
                            href={`/dashboard/apps/${appId}/versions/${ver.id}`}
                          >
                            <span
                              className={`size-2 shrink-0 rounded-full ${STATE_COLORS[ver.appVersionState] ?? "bg-muted-foreground"}`}
                              title={stateLabel(ver.appVersionState)}
                            />
                            <span>{ver.versionString}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
