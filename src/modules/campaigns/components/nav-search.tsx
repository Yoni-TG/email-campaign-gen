"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import {
  parseListSearchParams,
  serializeListQuery,
} from "@/modules/campaigns/utils/filter-search-params";
import { cn } from "@/lib/utils";

// Search input that lives in the top nav. Drives the same `?q=` URL param
// the campaign list reads. Debounced (250ms) so each keystroke doesn't
// push a history entry.
export function NavSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const parsed = parseListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );

  const [value, setValue] = useState(parsed.filters.search);
  useEffect(() => {
    setValue(parsed.filters.search);
  }, [parsed.filters.search]);

  useEffect(() => {
    if (value === parsed.filters.search) return;
    const timer = setTimeout(() => {
      const next = {
        ...parsed,
        filters: { ...parsed.filters, search: value },
      };
      const qs = serializeListQuery(next);
      const target = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => router.replace(target, { scroll: false }));
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <label
      className={cn(
        "relative hidden md:flex w-72 items-center rounded-md border border-border bg-surface-2/60 transition-colors focus-within:border-border-strong focus-within:bg-surface",
        isPending && "opacity-70",
      )}
    >
      <Search
        aria-hidden
        className="pointer-events-none absolute left-2.5 size-3.5 text-ink-3"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search…"
        aria-label="Search campaigns"
        className="h-9 w-full rounded-md bg-transparent pl-8 pr-12 text-sm text-ink placeholder:text-ink-4 focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-2 hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-3 sm:inline-flex">
        ⌘K
      </kbd>
    </label>
  );
}
