"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { CaretUpDown } from "@phosphor-icons/react";
import { Spinner } from "@/components/ui/spinner";
import { useApps } from "@/lib/apps-context";
import { useFormDirty } from "@/lib/form-dirty-context";
import { AppIcon } from "@/components/app-icon";
import { getAppState } from "@/lib/nav-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { appId } = useParams<{ appId?: string }>();
  const { isMobile } = useSidebar();
  const { apps, loading } = useApps();
  const { guardNavigation } = useFormDirty();

  const activeApp = apps.find((a) => a.id === appId);

  /** Subpages that persist across app switches (Insights + TestFlight). */
  const STICKY_SUBPAGES = new Set([
    "reviews", "analytics", "sales", "testflight",
  ]);

  function buildAppUrl(targetAppId: string): string {
    const saved = getAppState(targetAppId);
    if (saved) return `/dashboard/apps/${targetAppId}${saved}`;

    // Fallback: sticky subpage logic for never-visited apps
    if (!appId) return `/dashboard/apps/${targetAppId}`;
    const subpath = pathname.replace(`/dashboard/apps/${appId}`, "").replace(/^\//, "");
    const topSegment = subpath.split("/")[0];
    if (topSegment && STICKY_SUBPAGES.has(topSegment)) {
      return `/dashboard/apps/${targetAppId}/${topSegment}`;
    }
    return `/dashboard/apps/${targetAppId}`;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              suppressHydrationWarning
            >
              {loading ? (
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted">
                  <Spinner className="text-muted-foreground" />
                </div>
              ) : activeApp ? (
                <AppIcon
                  iconUrl={activeApp.iconUrl}
                  name={activeApp.name}
                  className="size-8"
                  iconSize={16}
                />
              ) : null}
              <span className="truncate font-semibold text-sm">
                {loading
                  ? "Loading..."
                  : activeApp?.name ?? "Select an app"}
              </span>
              <CaretUpDown className="ml-auto" size={16} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Apps
            </DropdownMenuLabel>
            {apps.length === 0 && !loading && (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                No apps found
              </div>
            )}
            {apps.map((app) => (
              <DropdownMenuItem
                key={app.id}
                onClick={() => guardNavigation(() => router.push(buildAppUrl(app.id)))}
                className="gap-2 p-2"
              >
                <AppIcon
                  iconUrl={app.iconUrl}
                  name={app.name}
                  className="size-6"
                  iconSize={12}
                  rounded="rounded-md"
                />
                <div className="grid flex-1 leading-tight">
                  <span className="truncate font-medium">{app.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {app.bundleId}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
