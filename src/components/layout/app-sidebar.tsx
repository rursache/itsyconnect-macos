"use client";

import { useParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { AppSwitcher } from "./app-switcher";
import { NavVersions } from "./nav-versions";
import { NavMain } from "./nav-main";
import { NavFooter } from "./nav-footer";

export function AppSidebar() {
  const { appId } = useParams<{ appId?: string }>();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <AppSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {appId && (
          <>
            <NavVersions appId={appId} />
            <SidebarSeparator />
            <NavMain appId={appId} />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
