import { notFound, redirect } from "next/navigation";
import { WizardChrome } from "@/modules/campaigns/components/wizard/wizard-chrome";
import { DesignStepView } from "@/modules/campaigns/components/design-step/design-step-view";
import { DesignPendingView } from "@/modules/campaigns/components/wizard/design-pending-view";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";
import { renderEditableForCampaign } from "@/modules/campaigns/utils/render-editable";
import { loadSkeletonById } from "@/modules/email-templates";

// Step 5 of the wizard. The route owns the polish-the-design moment;
// it also owns the brief wait between Step 4's uploadAll firing and the
// final render landing — DesignPendingView polls inside the wizard
// chrome so the operator never falls back to the legacy dispatcher.
// Earlier statuses (no chosen skeleton / no approved copy) are bounced
// to /campaigns/[id], which knows the rest of the lifecycle.
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
    !campaign.approvedProducts
  ) {
    redirect(`/campaigns/${id}`);
  }

  // Render in flight — keep the operator on the wizard URL, poll for
  // completion, and let DesignStepView take over on the next refresh.
  if (!campaign.renderResult) {
    if (campaign.status !== "rendering_final") {
      redirect(`/campaigns/${id}`);
    }
    return (
      <>
        <WizardChrome
          title={`${campaign.name} · Design`}
          currentStep={5}
          campaignId={campaign.id}
        />
        <DesignPendingView campaignId={campaign.id} error={campaign.error} />
      </>
    );
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
