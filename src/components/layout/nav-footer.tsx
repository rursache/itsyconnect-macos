"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Plus, GearSix, SignOut } from "@phosphor-icons/react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavFooter() {
  const router = useRouter();
  const { appId } = useParams<{ appId?: string }>();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <SidebarMenu>
      {appId && (
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="New version">
            <Link href={`/dashboard/apps/${appId}/versions/new`}>
              <Plus size={16} />
              <span>New version</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Settings">
          <Link href="/dashboard/settings">
            <GearSix size={16} />
            <span>Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton tooltip="Sign out" onClick={handleLogout}>
          <SignOut size={16} />
          <span>Sign out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
