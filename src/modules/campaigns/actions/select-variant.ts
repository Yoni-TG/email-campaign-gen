import type { Campaign } from "@/lib/types";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface SelectVariantResult {
  status: "asset_upload";
  chosenSkeletonId: string;
}

// variant_selection → asset_upload
//
// Records the operator's pick and advances. The chosen skeleton's
// requiredAssets[] declares what the operator needs to upload next.
export async function selectVariant(
  campaign: Campaign,
  skeletonId: string,
): Promise<SelectVariantResult> {
  if (!campaign.candidateVariants) {
    throw new Error(
      "Campaign has no candidateVariants — render-candidates must run first.",
    );
  }

  const exists = campaign.candidateVariants.some(
    (v) => v.skeletonId === skeletonId,
  );
  if (!exists) {
    throw new Error(
      `Unknown skeleton "${skeletonId}". Available: ${campaign.candidateVariants
        .map((v) => v.skeletonId)
        .join(", ")}`,
    );
  }

  await updateCampaign(campaign.id, {
    chosenSkeletonId: skeletonId,
    status: "asset_upload",
    error: null,
  });

  return { status: "asset_upload", chosenSkeletonId: skeletonId };
}
