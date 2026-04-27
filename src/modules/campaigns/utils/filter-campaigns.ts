import type { CampaignStatus, CampaignType } from "@/lib/types";
import type { CampaignSummary } from "./campaign-persistence";

export const CAMPAIGN_SORTS = ["newest", "oldest", "name"] as const;
export type CampaignSort = (typeof CAMPAIGN_SORTS)[number];

export interface CampaignFilters {
  /** Free-text search against `name` (case-insensitive, substring). */
  search: string;
  /** "all" or a specific campaign type. */
  type: CampaignType | "all";
  /** "all" or a specific status. */
  status: CampaignStatus | "all";
  sort: CampaignSort;
}

export const DEFAULT_FILTERS: CampaignFilters = {
  search: "",
  type: "all",
  status: "all",
  sort: "newest",
};

export function filterCampaigns(
  campaigns: CampaignSummary[],
  filters: CampaignFilters,
): CampaignSummary[] {
  const needle = filters.search.trim().toLowerCase();

  const matched = campaigns.filter((c) => {
    if (filters.type !== "all" && c.campaignType !== filters.type) return false;
    if (filters.status !== "all" && c.status !== filters.status) return false;
    if (needle && !c.name.toLowerCase().includes(needle)) return false;
    return true;
  });

  return sortCampaigns(matched, filters.sort);
}

function sortCampaigns(
  campaigns: CampaignSummary[],
  sort: CampaignSort,
): CampaignSummary[] {
  const out = [...campaigns];
  switch (sort) {
    case "newest":
      return out.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    case "oldest":
      return out.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
    case "name":
      return out.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }
}

export interface CampaignMonthGroup {
  /** "YYYY-MM" — stable sort key. */
  key: string;
  /** Display label, e.g. "April 2026". Locale-aware. */
  label: string;
  campaigns: CampaignSummary[];
}

// Group campaigns by year-month of `createdAt`. Order of returned groups
// matches input order (so name-sort still produces a sensible single
// section, and date sorts give chronological sections).
export function groupByMonth(
  campaigns: CampaignSummary[],
): CampaignMonthGroup[] {
  const groups = new Map<string, CampaignMonthGroup>();
  for (const c of campaigns) {
    const key = monthKey(c.createdAt);
    let group = groups.get(key);
    if (!group) {
      group = { key, label: monthLabel(c.createdAt), campaigns: [] };
      groups.set(key, group);
    }
    group.campaigns.push(c);
  }
  return Array.from(groups.values());
}

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}
