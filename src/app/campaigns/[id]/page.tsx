import Link from "next/link";
import { notFound } from "next/navigation";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/types";
import { CampaignDetail } from "@/modules/campaigns/components/campaign-detail";
import { StatusBadge } from "@/modules/campaigns/components/status-badge";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";
import { renderEditableForCampaign } from "@/modules/campaigns/utils/render-editable";

// Polling refreshes this route every 2s during `generating` /
// `rendering_*`, so we must re-fetch per request rather than cache at
// build time. Editable HTML for the click-to-edit completed view is
// computed server-side here too — the renderer is fast enough that
// re-rendering on each load is fine, and it keeps the client component
// purely presentational.
export const dynamic = "force-dynamic";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  // Only completed campaigns get an editable render — everywhere else
  // the existing flow handles its own iframe needs.
  const editableHtml =
    campaign.status === "completed"
      ? await renderEditableForCampaign(campaign)
      : null;

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
      <CampaignDetail campaign={campaign} editableHtml={editableHtml} />
    </div>
  );
}
