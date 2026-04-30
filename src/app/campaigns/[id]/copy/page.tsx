import { notFound } from "next/navigation";
import { CopyEditView } from "@/modules/campaigns/components/wizard/copy-edit-view";
import { GeneratingView } from "@/modules/campaigns/components/generating-view";
import { WizardChrome } from "@/modules/campaigns/components/wizard/wizard-chrome";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";

// Step 2 (Copy). Owns two states inside the wizard chrome:
//   - draft / generating → GeneratingView (skeleton + poll)
//   - review (with copy + products) → CopyEditView
// Anything later in the flow is redirected to its own step page by
// `[id]/page.tsx` before this route runs.
export const dynamic = "force-dynamic";

export default async function CopyStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const isGenerating =
    campaign.status === "draft" || campaign.status === "generating";

  return (
    <>
      <WizardChrome
        title={`${campaign.name} · Copy`}
        currentStep={2}
        campaignId={campaign.id}
      />
      {isGenerating || !campaign.generatedCopy || !campaign.generatedProducts ? (
        <GeneratingView campaignId={campaign.id} error={campaign.error} />
      ) : (
        <CopyEditView
          campaign={campaign}
          generatedCopy={campaign.generatedCopy}
          generatedProducts={campaign.generatedProducts}
        />
      )}
    </>
  );
}
