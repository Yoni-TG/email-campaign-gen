import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

  // Wizard hand-off: when generation finishes the operator should land
  // on the new per-step routes, not the legacy side-by-side dispatcher
  // views. Each branch is gated on the data the wizard step needs, so
  // we never bounce mid-redirect.
  if (campaign.status === "review" && campaign.generatedCopy && campaign.generatedProducts) {
    redirect(`/campaigns/${id}/copy`);
  }
  if (
    campaign.status === "variant_selection" &&
    (campaign.candidateVariants?.length ?? 0) > 0
  ) {
    redirect(`/campaigns/${id}/layout`);
  }
  if (campaign.status === "asset_upload" && campaign.chosenSkeletonId) {
    redirect(`/campaigns/${id}/images`);
  }

  // Only completed campaigns get an editable render — everywhere else
  // the existing flow handles its own iframe needs.
  const editableHtml =
    campaign.status === "completed"
      ? await renderEditableForCampaign(campaign)
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
