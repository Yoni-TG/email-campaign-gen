import type { ApprovedCopy, Campaign, FinalRenderResult } from "@/lib/types";
import { renderSkeleton } from "@/modules/email-templates";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import { buildBlueprint } from "@/modules/campaigns/utils/build-blueprint";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface UpdateCopyResult {
  status: "completed";
  renderResult: FinalRenderResult;
}

// Fine-tune action — replace approvedCopy with operator-edited copy
// and re-render. campaign_id is preserved from the existing record so
// the JSON blob stays self-contained (matches the rule baked into
// generateCopy).
export async function updateCopy(
  campaign: Campaign,
  edited: Omit<ApprovedCopy, "campaign_id">,
): Promise<UpdateCopyResult> {
  if (!campaign.chosenSkeletonId) {
    throw new Error("Campaign has no chosenSkeletonId.");
  }
  if (!campaign.approvedProducts) {
    throw new Error("Campaign missing approved products.");
  }
  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) {
    throw new Error(`Unknown chosenSkeletonId "${campaign.chosenSkeletonId}".`);
  }

  const approvedCopy: ApprovedCopy = {
    campaign_id: campaign.id,
    ...edited,
  };

  const blueprint = buildBlueprint({
    campaignId: campaign.id,
    seed: campaign.seed,
    approvedCopy,
    approvedProducts: campaign.approvedProducts,
    assets: campaign.assetPaths ?? {},
  });
  const { html } = await renderSkeleton(skeleton, blueprint, {
    withAssets: true,
    blockOverrides: campaign.blockOverrides,
    blockOrder: campaign.blockOrder,
  });
  const renderResult: FinalRenderResult = {
    skeletonId: skeleton.id,
    html,
    renderedAt: new Date().toISOString(),
  };

  await updateCampaign(campaign.id, {
    approvedCopy,
    renderResult,
    error: null,
  });

  return { status: "completed", renderResult };
}
