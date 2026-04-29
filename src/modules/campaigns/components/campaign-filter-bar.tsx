"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive, ChevronDown } from "lucide-react";
import { CAMPAIGN_TYPES, CAMPAIGN_TYPE_LABELS } from "@/lib/types";
import {
  CAMPAIGN_SORTS,
  STATUS_BUCKETS,
  STATUS_BUCKET_LABELS,
  type StatusBucket,
} from "@/modules/campaigns/utils/filter-campaigns";
import {
  parseListSearchParams,
  serializeListQuery,
} from "@/modules/campaigns/utils/filter-search-params";
import { cn } from "@/lib/utils";

const SORT_LABELS: Record<(typeof CAMPAIGN_SORTS)[number], string> = {
  newest: "Recent",
  oldest: "Oldest",
  name: "Name",
};

interface Props {
  bucketCounts: Record<StatusBucket, number>;
  /** Drives whether the Active/Archived toggle renders — only show it when
   *  there's something on the other side worth toggling to. */
  hasArchived: boolean;
}

// Filter bar — chip-tab status buckets on the left, type/sort dropdowns
// on the right, scope toggle when archived rows exist. URL-driven via
// the same `?type=&bucket=&sort=&scope=` params parsed in
// `parseListSearchParams`, so a refresh / back-button preserves the view
// and the server page reads the same state.
export function CampaignFilterBar({ bucketCounts, hasArchived }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const parsed = parseListSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
  const { scope, filters } = parsed;

  function pushFilters(patch: Partial<typeof filters>) {
    push({ ...parsed, filters: { ...filters, ...patch } });
  }

  function push(next: typeof parsed) {
    const qs = serializeListQuery(next);
    const target = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => router.replace(target, { scroll: false }));
  }

  return (
    <div
      role="toolbar"
      aria-label="Campaign filters"
      className={cn(
        "flex flex-wrap items-center gap-3 border-b border-border pb-4 transition-opacity",
        isPending && "opacity-70",
      )}
    >
      <div role="tablist" aria-label="Status bucket" className="flex flex-wrap items-center gap-1">
        {STATUS_BUCKETS.map((bucket) => (
          <BucketChip
            key={bucket}
            label={STATUS_BUCKET_LABELS[bucket]}
            count={bucketCounts[bucket]}
            active={filters.bucket === bucket}
            onClick={() => pushFilters({ bucket })}
          />
        ))}
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Type"
          value={
            filters.type === "all" ? "All" : CAMPAIGN_TYPE_LABELS[filters.type]
          }
          onChange={(v) =>
            pushFilters({ type: v as typeof filters.type })
          }
          options={[
            { value: "all", label: "All types" },
            ...CAMPAIGN_TYPES.map((t) => ({
              value: t,
              label: CAMPAIGN_TYPE_LABELS[t],
            })),
          ]}
        />

        <FilterDropdown
          label="Sort"
          value={SORT_LABELS[filters.sort]}
          onChange={(v) =>
            pushFilters({ sort: v as typeof filters.sort })
          }
          options={CAMPAIGN_SORTS.map((s) => ({
            value: s,
            label: SORT_LABELS[s],
          }))}
        />

        {(hasArchived || scope === "archived") && (
          <ScopeToggle
            scope={scope}
            onChange={(next) => push({ ...parsed, scope: next })}
          />
        )}
      </div>
    </div>
  );
}

function BucketChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-brand-soft font-semibold text-ink"
          : "text-ink-2 hover:bg-surface-2 hover:text-ink",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "tabular-nums text-xs",
          active ? "text-brand" : "text-ink-3",
        )}
      >
        {count}
      </span>
    </button>
  );
}

// Native <select> styled to match the chip aesthetic. Wraps the chevron
// + label in a relative box so the arrow stays put across browsers.
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  // Find the currently-selected option's underlying value so the
  // <select> stays controlled even when callers pass a humanised label.
  const selectedValue =
    options.find((o) => o.label === value)?.value ?? options[0]?.value;
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <span
        aria-hidden
        className="pointer-events-none flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-ink-2 hover:bg-surface-2"
      >
        <span className="text-ink-3">{label}:</span>
        <span className="font-medium text-ink">{value}</span>
        <ChevronDown className="size-3.5 text-ink-3" />
      </span>
      <select
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ScopeToggle({
  scope,
  onChange,
}: {
  scope: "active" | "archived";
  onChange: (next: "active" | "archived") => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Campaign scope"
      className="inline-flex items-center rounded-md border border-border bg-surface p-0.5 text-sm"
    >
      <ScopeBtn
        active={scope === "active"}
        onClick={() => onChange("active")}
      >
        Active
      </ScopeBtn>
      <ScopeBtn
        active={scope === "archived"}
        onClick={() => onChange("archived")}
      >
        <Archive className="size-3.5" />
        Archived
      </ScopeBtn>
    </div>
  );
}

function ScopeBtn({
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
        "inline-flex items-center gap-1 rounded px-2.5 py-1 text-sm transition-colors",
        active
          ? "bg-brand-soft font-medium text-ink"
          : "text-ink-3 hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
