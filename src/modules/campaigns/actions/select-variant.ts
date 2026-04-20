import type { Campaign, FigmaResult } from "@/lib/types";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface SelectVariantResult {
  status: "completed";
  figmaResult: FigmaResult;
}

export async function selectVariant(
  campaign: Campaign,
  variantName: string,
): Promise<SelectVariantResult> {
  const figmaResult = campaign.figmaResult;
  if (!figmaResult) {
    throw new Error("Campaign has no figmaResult — fill-figma must run first.");
  }

  const exists = figmaResult.variants.some((v) => v.variantName === variantName);
  if (!exists) {
    throw new Error(
      `Unknown variant "${variantName}". Available: ${figmaResult.variants
        .map((v) => v.variantName)
        .join(", ")}`,
    );
  }

  const updated: FigmaResult = { ...figmaResult, selectedVariant: variantName };
  await updateCampaign(campaign.id, {
    figmaResult: updated,
    status: "completed",
  });

  return { status: "completed", figmaResult: updated };
}
