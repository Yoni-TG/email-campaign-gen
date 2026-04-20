import Link from "next/link";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/types";
import type { CampaignSummary } from "@/modules/campaigns/utils/campaign-persistence";
import { StatusBadge } from "./status-badge";

// Server-renderable — the parent page provides already-fetched summaries.
export function CampaignList({ campaigns }: { campaigns: CampaignSummary[] }) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-white py-12 text-center text-muted-foreground">
        No campaigns yet. Create your first one.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {campaigns.map((campaign) => (
        <li key={campaign.id}>
          <Link
            href={`/campaigns/${campaign.id}`}
            className="flex items-center justify-between rounded-lg border bg-white p-4 transition-colors hover:bg-gray-50"
          >
            <div>
              <p className="font-medium">{campaign.name}</p>
              <p className="text-sm text-muted-foreground">
                {CAMPAIGN_TYPE_LABELS[campaign.campaignType]} ·{" "}
                {campaign.createdBy} ·{" "}
                {campaign.createdAt.toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={campaign.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
