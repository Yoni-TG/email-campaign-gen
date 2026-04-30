import Link from "next/link";
import { Archive } from "lucide-react";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/types";
import type { CampaignSummary } from "@/modules/campaigns/utils/campaign-persistence";
import { formatRelativeDate } from "@/modules/campaigns/utils/relative-date";
import { cn } from "@/lib/utils";
import { CampaignRowMenu } from "./campaign-row-menu";
import { OwnerAvatar } from "./owner-avatar";
import {
  StatusBadgeWithTooltip,
} from "./status-badge-with-tooltip";
import { statusStripeClass } from "./status-badge";

interface CampaignListProps {
  campaigns: CampaignSummary[];
  /** Empty-state copy varies by why the list is empty (no campaigns yet,
   *  filters too tight, archived view with nothing in it). The page
   *  decides which message to show. */
  emptyState: { title: string; hint: string };
}

// Dense-table layout. Server-rendered shell with two client islands per row
// (StatusBadgeWithTooltip + CampaignRowMenu). The whole row is a single
// <Link> so anywhere outside the menu navigates to the campaign — the
// menu lives as a sibling of the link, not nested inside it, because a
// <button> inside an <a> is invalid and produces flicker on click.
export function CampaignList({ campaigns, emptyState }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-surface/40 py-16 text-center">
        <p className="text-sm font-medium text-ink">{emptyState.title}</p>
        <p className="mt-1 text-sm text-ink-3">{emptyState.hint}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div
        role="row"
        className="grid grid-cols-[8px_minmax(0,1fr)_140px_64px_120px_28px] items-center gap-4 border-b border-border bg-surface-2/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3"
      >
        <span aria-hidden />
        <span role="columnheader">Campaign</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Owner</span>
        <span role="columnheader">Date</span>
        <span aria-hidden />
      </div>
      <ul role="rowgroup">
        {campaigns.map((c) => (
          <CampaignRow key={c.id} campaign={c} />
        ))}
      </ul>
    </div>
  );
}

function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  const archived = campaign.archivedAt !== null;
  const teaser =
    campaign.teaser?.trim() ||
    CAMPAIGN_TYPE_LABELS[campaign.campaignType];

  return (
    <li role="row" className="group relative border-b border-border last:border-b-0">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="grid grid-cols-[8px_minmax(0,1fr)_140px_64px_120px_28px] items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2/40"
      >
        <span
          className={cn(
            "h-9 w-1 rounded-full",
            statusStripeClass(campaign.status),
          )}
          aria-hidden
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-ink">{campaign.name}</p>
            {archived && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-3">
                <Archive className="size-2.5" />
                Archived
              </span>
            )}
          </div>
          <p className="truncate text-sm text-ink-3">{teaser}</p>
        </div>
        <div role="cell">
          <StatusBadgeWithTooltip status={campaign.status} />
        </div>
        <div role="cell">
          <OwnerAvatar name={campaign.createdBy} />
        </div>
        <span role="cell" className="text-sm text-ink-3 tabular-nums">
          {formatRelativeDate(campaign.createdAt)}
        </span>
        <span aria-hidden />
      </Link>
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <CampaignRowMenu campaignId={campaign.id} archived={archived} />
      </div>
    </li>
  );
}
