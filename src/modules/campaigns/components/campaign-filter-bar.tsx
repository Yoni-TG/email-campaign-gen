"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive, Search } from "lucide-react";
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPES,
  CAMPAIGN_TYPE_LABELS,
} from "@/lib/types";
import { CAMPAIGN_SORTS } from "@/modules/campaigns/utils/filter-campaigns";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  parseListSearchParams,
  serializeListQuery,
} from "@/modules/campaigns/utils/filter-search-params";

const SORT_LABELS: Record<(typeof CAMPAIGN_SORTS)[number], string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name: "Name (A–Z)",
};

// Filter bar for the campaign list. Drives state via the URL
// (?q=&type=&status=&sort=&scope=) so a refresh / back-button preserves
// the operator's view, and the server page reads the same params to
// scope the DB query and apply the in-memory filters.
//
// Search is debounced (250ms) so each keystroke doesn't push history.
// The scope toggle (Active / Archived) is the most important affordance
// — it's the difference between "today's worklist" and "past artifacts".
export function CampaignFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const parsed = parseListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
  const { scope, filters } = parsed;

  // Local state for the search input so typing stays snappy; pushed to
  // the URL on a 250ms debounce.
  const [searchInput, setSearchInput] = useState(filters.search);
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  useEffect(() => {
    if (searchInput === filters.search) return;
    const timer = setTimeout(() => {
      push({ ...parsed, filters: { ...filters, search: searchInput } });
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  function push(next: typeof parsed) {
    const qs = serializeListQuery(next);
    const target = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => router.replace(target, { scroll: false }));
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-3 shadow-sm transition-opacity",
        isPending && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name…"
            className="h-9 pl-8"
            aria-label="Search campaigns"
          />
        </div>

        <Select
          value={filters.type}
          onChange={(v) =>
            push({ ...parsed, filters: { ...filters, type: v as typeof filters.type } })
          }
          aria-label="Filter by campaign type"
        >
          <option value="all">All types</option>
          {CAMPAIGN_TYPES.map((t) => (
            <option key={t} value={t}>
              {CAMPAIGN_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>

        <Select
          value={filters.status}
          onChange={(v) =>
            push({
              ...parsed,
              filters: { ...filters, status: v as typeof filters.status },
            })
          }
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {CAMPAIGN_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CAMPAIGN_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>

        <Select
          value={filters.sort}
          onChange={(v) =>
            push({ ...parsed, filters: { ...filters, sort: v as typeof filters.sort } })
          }
          aria-label="Sort campaigns"
        >
          {CAMPAIGN_SORTS.map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </Select>

        <div
          role="tablist"
          aria-label="Campaign scope"
          className="inline-flex rounded-lg bg-muted p-0.5 text-sm"
        >
          <ScopeToggle
            active={scope === "active"}
            onClick={() => push({ ...parsed, scope: "active" })}
          >
            Active
          </ScopeToggle>
          <ScopeToggle
            active={scope === "archived"}
            onClick={() => push({ ...parsed, scope: "archived" })}
          >
            <Archive className="h-3.5 w-3.5" />
            Archived
          </ScopeToggle>
        </div>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">) {
  return (
    <select
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-input/60 bg-muted/30 px-2.5 text-sm transition-colors hover:bg-muted/50 focus-visible:bg-card focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none"
    >
      {children}
    </select>
  );
}

function ScopeToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
