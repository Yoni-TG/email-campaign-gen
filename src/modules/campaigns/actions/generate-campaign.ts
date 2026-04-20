import { generateCopy } from "@/modules/copy-generation/services/copy-generation";
import { selectProducts } from "@/modules/products/services/product-selection";
import type { Campaign } from "@/lib/types";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface GenerateResult {
  status: "review";
}

// Marks the campaign as `generating`, runs copy + product selection in
// parallel, and advances to `review` on success. On failure the error is
// persisted onto the campaign row and re-thrown for the route to surface.
export async function runGeneration(campaign: Campaign): Promise<GenerateResult> {
  await updateCampaign(campaign.id, { status: "generating", error: null });

  try {
    const [generatedCopy, generatedProducts] = await Promise.all([
      generateCopy(campaign.id, campaign.seed, campaign.campaignType),
      selectProducts(campaign.seed, campaign.campaignType),
    ]);

    await updateCampaign(campaign.id, {
      generatedCopy,
      generatedProducts,
      status: "review",
    });

    return { status: "review" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    // Keep status as `generating` so the UI can show the error + a retry CTA.
    await updateCampaign(campaign.id, { error: message });
    throw err;
  }
}
