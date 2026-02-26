"use client";

import Link from "next/link";
import { GearSix } from "@phosphor-icons/react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavFooter() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild size="lg" tooltip="Settings">
          <Link href="/dashboard/settings">
            <GearSix size={16} />
            <span className="truncate font-medium">Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
