import { notFound, redirect } from "next/navigation";
import { LayoutPickView } from "@/modules/campaigns/components/wizard/layout-pick-view";
import { WizardChrome } from "@/modules/campaigns/components/wizard/wizard-chrome";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";
import { CAMPAIGN_STATUSES } from "@/lib/types";

// Step 3 (Layout). Available once `render-candidates` has populated
// candidateVariants — anything earlier in the flow gets bounced back to
// the status-driven detail page so the operator sees the right "still
// generating" view instead of a half-loaded picker.
export const dynamic = "force-dynamic";

const VARIANT_SELECTION_INDEX = CAMPAIGN_STATUSES.indexOf("variant_selection");

export default async function LayoutStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const statusIndex = CAMPAIGN_STATUSES.indexOf(campaign.status);
  const candidatesReady =
    statusIndex >= VARIANT_SELECTION_INDEX &&
    (campaign.candidateVariants?.length ?? 0) > 0;
  if (!candidatesReady) redirect(`/campaigns/${id}`);

  return (
    <>
      <WizardChrome
        title={`${campaign.name} · Layout`}
        currentStep={3}
        campaignId={campaign.id}
      />
      <LayoutPickView campaign={campaign} />
    </>
  );
}
