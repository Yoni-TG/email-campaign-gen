import Link from "next/link";
import { notFound } from "next/navigation";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/types";
import { CampaignDetail } from "@/modules/campaigns/components/campaign-detail";
import { StatusBadge } from "@/modules/campaigns/components/status-badge";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";

// Polling refreshes this route every 2s during `generating` / `filling_figma`,
// so we must re-fetch per request rather than cache at build time.
export const dynamic = "force-dynamic";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to campaigns
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <StatusBadge status={campaign.status} />
        </div>
        <p className="text-muted-foreground">
          {CAMPAIGN_TYPE_LABELS[campaign.campaignType]} · {campaign.createdBy} ·{" "}
          {campaign.createdAt.toLocaleDateString()}
        </p>
      </div>
      <CampaignDetail campaign={campaign} />
    </div>
  );
}
