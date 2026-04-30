import { notFound, redirect } from "next/navigation";
import { ImageUploadView } from "@/modules/campaigns/components/wizard/image-upload-view";
import { WizardChrome } from "@/modules/campaigns/components/wizard/wizard-chrome";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";
import { CAMPAIGN_STATUSES } from "@/lib/types";

// Step 4 (Images). Available once a skeleton has been chosen. Anything
// earlier in the flow gets bounced back to the status dispatcher so the
// operator sees the right "still generating" view.
export const dynamic = "force-dynamic";

const ASSET_UPLOAD_INDEX = CAMPAIGN_STATUSES.indexOf("asset_upload");

export default async function ImagesStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const statusIndex = CAMPAIGN_STATUSES.indexOf(campaign.status);
  if (statusIndex < ASSET_UPLOAD_INDEX || !campaign.chosenSkeletonId) {
    redirect(`/campaigns/${id}`);
  }

  return (
    <>
      <WizardChrome
        title={`${campaign.name} · Images`}
        currentStep={4}
        campaignId={campaign.id}
      />
      <ImageUploadView campaign={campaign} />
    </>
  );
}
