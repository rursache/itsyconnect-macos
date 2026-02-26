"use client";

import { useParams, useRouter } from "next/navigation";
import { CaretUpDown, AppWindow, Plus } from "@phosphor-icons/react";
import { MOCK_APPS } from "@/lib/mock-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  const { appId } = useParams<{ appId?: string }>();
  const { isMobile } = useSidebar();

  const activeApp = MOCK_APPS.find((a) => a.id === appId);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm">
                <AppWindow size={16} weight="fill" />
              </div>
              <span className="truncate font-semibold text-sm">
                {activeApp?.name ?? "Select an app"}
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
            {MOCK_APPS.map((app) => (
              <DropdownMenuItem
                key={app.id}
                onClick={() => router.push(`/dashboard/apps/${app.id}`)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm bg-gradient-to-b from-blue-500 to-blue-600 text-white">
                  <AppWindow size={12} weight="fill" />
                </div>
                <div className="grid flex-1 leading-tight">
                  <span className="truncate font-medium">{app.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {app.bundleId}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus size={14} />
              </div>
              <div className="font-medium text-muted-foreground">
                Add credentials
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
