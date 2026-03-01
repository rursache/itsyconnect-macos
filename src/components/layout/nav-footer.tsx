"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { GearSix } from "@phosphor-icons/react";
import { useFormDirty } from "@/lib/form-dirty-context";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavFooter() {
  const router = useRouter();
  const { isDirty, guardNavigation } = useFormDirty();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild size="lg" tooltip="Settings">
          <Link
            href="/dashboard/settings"
            onNavigate={(e) => {
              if (!isDirty) return;
              e.preventDefault();
              guardNavigation(() => router.push("/dashboard/settings"));
            }}
          >
            <GearSix size={16} />
            <span className="truncate font-medium">Settings</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
