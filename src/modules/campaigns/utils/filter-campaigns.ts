import type { CampaignStatus, CampaignType } from "@/lib/types";
import type { CampaignSummary } from "./campaign-persistence";

export const CAMPAIGN_SORTS = ["newest", "oldest", "name"] as const;
export type CampaignSort = (typeof CAMPAIGN_SORTS)[number];

// Status buckets group the 8 raw statuses into the small set the operator
// actually scans against. "in_progress" rolls up every intermediate state
// between approval and final render — the operator just wants to know
// "this is in flight", not which of five render steps it's on.
export const STATUS_BUCKETS = [
  "all",
  "drafts",
  "review",
  "in_progress",
  "completed",
] as const;
export type StatusBucket = (typeof STATUS_BUCKETS)[number];

export const STATUS_BUCKET_LABELS: Record<StatusBucket, string> = {
  all: "All",
  drafts: "Drafts",
  review: "Review",
  in_progress: "In progress",
  completed: "Completed",
};

const BUCKET_STATUSES: Record<
  Exclude<StatusBucket, "all">,
  readonly CampaignStatus[]
> = {
  drafts: ["draft"],
  review: ["review"],
  in_progress: [
    "generating",
    "rendering_candidates",
    "variant_selection",
    "asset_upload",
    "rendering_final",
  ],
  completed: ["completed"],
};

export function bucketIncludesStatus(
  bucket: StatusBucket,
  status: CampaignStatus,
): boolean {
  if (bucket === "all") return true;
  return BUCKET_STATUSES[bucket].includes(status);
}

export interface CampaignFilters {
  /** Free-text search against `name` (case-insensitive, substring). */
  search: string;
  /** "all" or a specific campaign type. */
  type: CampaignType | "all";
  /** Status bucket — see STATUS_BUCKETS. */
  bucket: StatusBucket;
  sort: CampaignSort;
}

export const DEFAULT_FILTERS: CampaignFilters = {
  search: "",
  type: "all",
  bucket: "all",
  sort: "newest",
};

export function filterCampaigns(
  campaigns: CampaignSummary[],
  filters: CampaignFilters,
): CampaignSummary[] {
  const needle = filters.search.trim().toLowerCase();

  const matched = campaigns.filter((c) => {
    if (filters.type !== "all" && c.campaignType !== filters.type) return false;
    if (!bucketIncludesStatus(filters.bucket, c.status)) return false;
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

// Counts campaigns into each bucket so the chip-tabs can show "Drafts 1",
// "Review 1", "Completed 4", etc. The "all" count is the total. We count
// against the unfiltered scope list — chip counts shouldn't shrink as the
// operator narrows by type or search.
export function countByBucket(
  campaigns: CampaignSummary[],
): Record<StatusBucket, number> {
  const counts: Record<StatusBucket, number> = {
    all: campaigns.length,
    drafts: 0,
    review: 0,
    in_progress: 0,
    completed: 0,
  };
  for (const c of campaigns) {
    for (const bucket of STATUS_BUCKETS) {
      if (bucket === "all") continue;
      if (bucketIncludesStatus(bucket, c.status)) counts[bucket]++;
    }
  }
  return counts;
}
