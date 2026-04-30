import { notFound, redirect } from "next/navigation";
import { CopyEditView } from "@/modules/campaigns/components/wizard/copy-edit-view";
import { WizardChrome } from "@/modules/campaigns/components/wizard/wizard-chrome";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";

// Step 2 (Copy). Available once `generate-campaign` has populated
// generatedCopy + generatedProducts — anything earlier in the flow gets
// bounced back to the status-driven detail page so the operator sees
// the right "still generating" view.
export const dynamic = "force-dynamic";

export default async function CopyStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  if (!campaign.generatedCopy || !campaign.generatedProducts) {
    redirect(`/campaigns/${id}`);
  }

  return (
    <>
      <WizardChrome
        title={`${campaign.name} · Copy`}
        currentStep={2}
        campaignId={campaign.id}
      />
      <CopyEditView
        campaign={campaign}
        generatedCopy={campaign.generatedCopy}
        generatedProducts={campaign.generatedProducts}
      />
    </>
  );
}
