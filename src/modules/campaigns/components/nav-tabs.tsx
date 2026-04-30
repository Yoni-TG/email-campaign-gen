"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Tab {
  href: string;
  label: string;
  /** Active when the current path equals href, or starts with `${href}/`.
   *  Home (`/`) only matches exactly so it doesn't claim every page. */
  matchPrefix?: boolean;
}

const TABS: Tab[] = [
  { href: "/", label: "Campaigns" },
  { href: "/blocks", label: "Blocks", matchPrefix: true },
  { href: "/skeletons", label: "Skeletons", matchPrefix: true },
];

export function NavTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {TABS.map((tab) => {
        const active = tab.matchPrefix
          ? pathname === tab.href || pathname.startsWith(`${tab.href}/`)
          : pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-brand-soft font-semibold text-ink"
                : "text-ink-3 hover:bg-surface-2 hover:text-ink",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
