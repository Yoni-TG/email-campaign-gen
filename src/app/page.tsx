import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CampaignFilterBar } from "@/modules/campaigns/components/campaign-filter-bar";
import { CampaignList } from "@/modules/campaigns/components/campaign-list";
import { listCampaignSummaries } from "@/modules/campaigns/utils/campaign-persistence";
import {
  filterCampaigns,
  groupByMonth,
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
  const all = await listCampaignSummaries(scope);
  const filtered = filterCampaigns(all, filters);
  const groups = groupByMonth(filtered);

  const totalInScope = all.length;
  const filtersActive =
    filters.search.length > 0 ||
    filters.type !== "all" ||
    filters.status !== "all";

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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Theo Grace email campaign generator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/blocks"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Blocks
          </Link>
          <Link
            href="/skeletons"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skeletons
          </Link>
          <Link href="/campaigns/new">
            <Button>New Campaign</Button>
          </Link>
        </div>
      </div>
      <div className="mb-4">
        <CampaignFilterBar />
      </div>
      <CampaignList groups={groups} emptyState={emptyState} />
    </div>
  );
}
