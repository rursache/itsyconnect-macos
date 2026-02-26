"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Credentials", segment: "" },
  { label: "AI", segment: "/ai" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = "/dashboard/settings";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b">
        <nav className="-mb-px flex">
          {TABS.map((tab) => {
            const href = `${base}${tab.segment}`;
            const active =
              tab.segment === ""
                ? pathname === base
                : pathname.startsWith(`${base}${tab.segment}`);
            return (
              <Link
                key={tab.segment}
                href={href}
                className={cn(
                  "border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
