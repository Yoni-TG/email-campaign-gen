import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/types";
import type { CampaignSummary } from "@/modules/campaigns/utils/campaign-persistence";
import { StatusBadgeWithTooltip } from "./status-badge-with-tooltip";

// Server-renderable — the parent page provides already-fetched summaries.
// The status badge itself is a client component so hover tooltips work.
export function CampaignList({ campaigns }: { campaigns: CampaignSummary[] }) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          No campaigns yet. Create your first one.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {campaigns.map((campaign) => (
        <li key={campaign.id}>
          <Link
            href={`/campaigns/${campaign.id}`}
            className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/40 hover:shadow-md"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{campaign.name}</p>
              <p className="text-sm text-muted-foreground">
                {CAMPAIGN_TYPE_LABELS[campaign.campaignType]} ·{" "}
                {campaign.createdBy} ·{" "}
                {campaign.createdAt.toLocaleDateString()}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <StatusBadgeWithTooltip status={campaign.status} />
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
