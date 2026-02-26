"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MagnifyingGlass,
  Images,
  Info,
  Stamp,
  PaperPlaneTilt,
  ChatsCircle,
  Package,
  Megaphone,
  WheelchairMotion,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  href: string;
  icon: Icon;
}

function getNavItems(appId: string): NavItem[] {
  return [
    {
      title: "App Store Optimization",
      href: `/dashboard/apps/${appId}/aso`,
      icon: MagnifyingGlass,
    },
    {
      title: "Screenshots",
      href: `/dashboard/apps/${appId}/screenshots`,
      icon: Images,
    },
    {
      title: "App information",
      href: `/dashboard/apps/${appId}/info`,
      icon: Info,
    },
    {
      title: "App review",
      href: `/dashboard/apps/${appId}/review`,
      icon: Stamp,
    },
    {
      title: "TestFlight",
      href: `/dashboard/apps/${appId}/testflight`,
      icon: PaperPlaneTilt,
    },
    {
      title: "Customer reviews",
      href: `/dashboard/apps/${appId}/reviews`,
      icon: ChatsCircle,
    },
    {
      title: "In-app purchases",
      href: `/dashboard/apps/${appId}/iap`,
      icon: Package,
    },
    {
      title: "App Store nominations",
      href: `/dashboard/apps/${appId}/nominations`,
      icon: Megaphone,
    },
    {
      title: "Accessibility",
      href: `/dashboard/apps/${appId}/accessibility`,
      icon: WheelchairMotion,
    },
  ];
}

export function NavMain({ appId }: { appId: string }) {
  const pathname = usePathname();
  const items = getNavItems(appId);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={pathname.startsWith(item.href)}
            >
              <Link href={item.href}>
                <item.icon size={16} />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
