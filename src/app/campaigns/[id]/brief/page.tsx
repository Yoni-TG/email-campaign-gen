import { notFound } from "next/navigation";
import { CreativeSeedForm } from "@/modules/campaigns/components/creative-seed-form";
import { WizardChrome } from "@/modules/campaigns/components/wizard/wizard-chrome";
import type { CreativeSeedFormState } from "@/modules/campaigns/hooks/use-creative-seed-form";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";
import {
  ensureFeedLoaded,
  getProductBySku,
} from "@/modules/products/services/product-feed";
import { toProductSnapshot } from "@/modules/products/utils/product-api-shape";

// Step 1 in edit mode. Re-uses the create form prefilled from the campaign's
// existing seed; submit PATCHes /api/campaigns/:id with the updated values
// and routes back to /copy. Pinned-sku snapshots are resolved server-side
// so the ProductPicker round-trips correctly.
export const dynamic = "force-dynamic";

export default async function EditBriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  await ensureFeedLoaded();
  const pinnedProducts = (campaign.seed.pinnedSkus ?? [])
    .map((sku) => getProductBySku(sku))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map(toProductSnapshot);

  const initial: Partial<CreativeSeedFormState> = {
    name: campaign.name,
    campaignType: campaign.campaignType,
    targetCategories: campaign.seed.targetCategories,
    targetAudience: campaign.seed.targetAudience ?? [],
    promoDetails: campaign.seed.promoDetails ?? "",
    mainMessage: campaign.seed.mainMessage,
    secondaryMessage: campaign.seed.secondaryMessage ?? "",
    additionalNotes: campaign.seed.additionalNotes ?? "",
    includeSms: campaign.seed.includeSms ?? false,
    includeNicky: campaign.seed.includeNicky ?? false,
    leadValue: campaign.seed.leadValue,
    leadPersonalities: campaign.seed.leadPersonalities,
    pinnedProducts,
    market: campaign.seed.market,
  };

  return (
    <>
      <WizardChrome
        title={`${campaign.name} · Brief`}
        currentStep={1}
        campaignId={campaign.id}
      />
      <CreativeSeedForm
        mode={{ kind: "edit", campaignId: campaign.id }}
        initial={initial}
      />
    </>
  );
}
