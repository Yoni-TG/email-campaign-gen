import Link from "next/link";
import { Plus } from "lucide-react";
import { AppTopNav } from "@/modules/campaigns/components/app-top-nav";
import { CampaignFilterBar } from "@/modules/campaigns/components/campaign-filter-bar";
import { CampaignList } from "@/modules/campaigns/components/campaign-list";
import { RefreshFeedButton } from "@/modules/campaigns/components/refresh-feed-button";
import { listCampaignSummaries } from "@/modules/campaigns/utils/campaign-persistence";
import {
  countByBucket,
  filterCampaigns,
} from "@/modules/campaigns/utils/filter-campaigns";
import { parseListSearchParams } from "@/modules/campaigns/utils/filter-search-params";

// DB-backed — must render per request so new campaigns show up immediately.
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const { scope, filters } = parseListSearchParams(raw);

  // Load both scopes' counts so the Active/Archived toggle only renders
  // when there's something on the other side worth toggling to. The two
  // scopes are mutually exclusive so we pick the one for the visible list
  // and check the OTHER for whether to surface the toggle.
  const [scoped, otherScope] = await Promise.all([
    listCampaignSummaries(scope),
    listCampaignSummaries(scope === "active" ? "archived" : "active"),
  ]);

  const filtered = filterCampaigns(scoped, filters);
  const counts = countByBucket(scoped);
  const sentThisMonth = countSentThisMonth(scoped);

  const totalInScope = scoped.length;
  const filtersActive =
    filters.search.length > 0 ||
    filters.type !== "all" ||
    filters.bucket !== "all";

  const emptyState =
    totalInScope === 0
      ? scope === "archived"
        ? {
            title: "No archived campaigns.",
            hint: "Archive any active campaign to find it here later.",
          }
        : {
            title: "No campaigns yet.",
            hint: "Create your first one to get started.",
          }
      : filtersActive
        ? {
            title: "No matches.",
            hint: "Try a different search, or clear the filters.",
          }
        : {
            title: "Nothing here.",
            hint: "Switch to the other scope to see campaigns.",
          };

  return (
    <>
      <AppTopNav />
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
        <PageHeader
          totalInScope={totalInScope}
          sentThisMonth={sentThisMonth}
          scope={scope}
        />
        <div className="mt-8 space-y-4">
          <CampaignFilterBar
            bucketCounts={counts}
            hasArchived={otherScope.length > 0 || scope === "archived"}
          />
          <CampaignList campaigns={filtered} emptyState={emptyState} />
        </div>
      </div>
    </>
  );
}

function PageHeader({
  totalInScope,
  sentThisMonth,
  scope,
}: {
  totalInScope: number;
  sentThisMonth: number;
  scope: "active" | "archived";
}) {
  const totalLabel = `${totalInScope} ${plural(totalInScope, "campaign", "campaigns")}`;
  const sentLabel =
    scope === "active" && sentThisMonth > 0
      ? ` · ${sentThisMonth} sent this month`
      : "";

  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0">
        <h1 className="font-display text-5xl leading-none text-ink">
          Campaigns
        </h1>
        <p className="mt-3 text-sm text-ink-3">
          {totalLabel}
          {sentLabel}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <RefreshFeedButton />
        <Link
          href="/campaigns/new"
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-brand px-4 text-sm font-medium text-surface shadow-sm transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Plus className="size-4" />
          New campaign
        </Link>
      </div>
    </div>
  );
}

function countSentThisMonth(
  campaigns: Array<{ status: string; updatedAt: Date; createdAt: Date }>,
): number {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return campaigns.filter((c) => {
    if (c.status !== "completed") return false;
    const d = c.updatedAt;
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;
}

function plural(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}
