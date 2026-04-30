import { notFound, redirect } from "next/navigation";
import { LayoutPickView } from "@/modules/campaigns/components/wizard/layout-pick-view";
import { RenderingCandidatesView } from "@/modules/campaigns/components/rendering-candidates-view";
import { WizardChrome } from "@/modules/campaigns/components/wizard/wizard-chrome";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";
import { CAMPAIGN_STATUSES } from "@/lib/types";

// Step 3 (Layout). Owns the rendering_candidates wait + the picker —
// both wrapped in wizard chrome so the operator never falls back to a
// full-page replacement loader.
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

  // Earlier statuses (no copy approved yet) belong to /copy — bounce
  // back so the operator stays on the right step.
  const statusIndex = CAMPAIGN_STATUSES.indexOf(campaign.status);
  const RENDERING_CANDIDATES_INDEX = CAMPAIGN_STATUSES.indexOf(
    "rendering_candidates",
  );
  if (statusIndex < RENDERING_CANDIDATES_INDEX) {
    redirect(`/campaigns/${id}`);
  }

  const candidatesReady =
    statusIndex >= VARIANT_SELECTION_INDEX &&
    (campaign.candidateVariants?.length ?? 0) > 0;

  return (
    <>
      <WizardChrome
        title={`${campaign.name} · Layout`}
        currentStep={3}
        campaignId={campaign.id}
      />
      {candidatesReady ? (
        <LayoutPickView campaign={campaign} />
      ) : (
        <RenderingCandidatesView campaign={campaign} />
      )}
    </>
  );
}
