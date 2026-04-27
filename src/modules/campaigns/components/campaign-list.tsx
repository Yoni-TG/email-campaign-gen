import Link from "next/link";
import { Archive, ChevronRight } from "lucide-react";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/types";
import type { CampaignSummary } from "@/modules/campaigns/utils/campaign-persistence";
import type { CampaignMonthGroup } from "@/modules/campaigns/utils/filter-campaigns";
import { CampaignRowMenu } from "./campaign-row-menu";
import { StatusBadgeWithTooltip } from "./status-badge-with-tooltip";

interface CampaignListProps {
  groups: CampaignMonthGroup[];
  /** Empty-state copy varies by why the list is empty (no campaigns yet,
   *  filters too tight, archived view with nothing in it). The page
   *  decides which message to show. */
  emptyState: { title: string; hint: string };
}

// Server-renderable — the parent page provides month-grouped summaries.
// The row's overflow menu is a client component, the status badge is a
// client component for its hover tooltip; the rest renders on the server.
export function CampaignList({ groups, emptyState }: CampaignListProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          {emptyState.title}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{emptyState.hint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.key} className="space-y-2">
          <h3 className="px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {group.label}
            <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/70">
              {group.campaigns.length} campaign
              {group.campaigns.length === 1 ? "" : "s"}
            </span>
          </h3>
          <ul className="space-y-2">
            {group.campaigns.map((campaign) => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  const archived = campaign.archivedAt !== null;
  // The menu lives as a sibling of the Link, not inside it — nesting a
  // <button> inside an <a> is invalid HTML and causes the parent link
  // to navigate even after the menu's click handlers stopPropagate
  // (the popover opens, the route change unmounts it, you see a flicker).
  return (
    <li className="group relative">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 pr-24 shadow-sm transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{campaign.name}</p>
            {archived && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                <Archive className="h-2.5 w-2.5" />
                Archived
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {CAMPAIGN_TYPE_LABELS[campaign.campaignType]} ·{" "}
            {campaign.createdBy} ·{" "}
            {campaign.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadgeWithTooltip status={campaign.status} />
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
        </div>
      </Link>
      <div className="absolute right-10 top-1/2 -translate-y-1/2">
        <CampaignRowMenu campaignId={campaign.id} archived={archived} />
      </div>
    </li>
  );
}
