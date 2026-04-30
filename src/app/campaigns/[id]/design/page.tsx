import { notFound, redirect } from "next/navigation";
import { WizardChrome } from "@/modules/campaigns/components/wizard/wizard-chrome";
import { DesignStepView } from "@/modules/campaigns/components/design-step/design-step-view";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";
import { renderEditableForCampaign } from "@/modules/campaigns/utils/render-editable";
import { loadSkeletonById } from "@/modules/email-templates";

// Step 5 of the wizard. The route assumes the campaign is past asset
// upload + final render — that's the polish-the-design moment in the
// flow. Anything earlier in the lifecycle is bounced back to the
// existing /campaigns/[id] detail view, which knows every other status.
export const dynamic = "force-dynamic";

export default async function DesignStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  if (
    !campaign.chosenSkeletonId ||
    !campaign.approvedCopy ||
    !campaign.approvedProducts ||
    !campaign.renderResult
  ) {
    redirect(`/campaigns/${id}`);
  }

  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) redirect(`/campaigns/${id}`);

  const editableHtml = await renderEditableForCampaign(campaign);
  if (!editableHtml) redirect(`/campaigns/${id}`);

  return (
    <>
      <WizardChrome
        title={`${campaign.name} · Design`}
        currentStep={5}
        campaignId={campaign.id}
      />
      <DesignStepView
        campaign={campaign}
        skeleton={skeleton}
        editableHtml={editableHtml}
      />
    </>
  );
}
