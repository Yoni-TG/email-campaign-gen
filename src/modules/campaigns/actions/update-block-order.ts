import type { Campaign, FinalRenderResult } from "@/lib/types";
import { renderSkeleton } from "@/modules/email-templates";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import { buildBlueprint } from "@/modules/campaigns/utils/build-blueprint";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface UpdateBlockOrderResult {
  status: "completed";
  renderResult: FinalRenderResult;
}

// Fine-tune action — persist a new display order for the operator's
// chosen skeleton (driven by the layers panel's drag-to-reorder). The
// blockOrder array is a permutation of [0..N-1] where N = skeleton.blocks.length.
// Background / alignment / button-colour overrides remain keyed by
// manifest index, so reorders carry their per-block style with them.
export async function updateBlockOrder(
  campaign: Campaign,
  blockOrder: number[],
): Promise<UpdateBlockOrderResult> {
  if (!campaign.chosenSkeletonId) {
    throw new Error("Campaign has no chosenSkeletonId.");
  }
  if (!campaign.approvedCopy || !campaign.approvedProducts) {
    throw new Error("Campaign missing approved copy or products.");
  }
  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) {
    throw new Error(`Unknown chosenSkeletonId "${campaign.chosenSkeletonId}".`);
  }

  validateBlockOrder(blockOrder, skeleton.blocks.length);

  const blueprint = buildBlueprint({
    campaignId: campaign.id,
    seed: campaign.seed,
    approvedCopy: campaign.approvedCopy,
    approvedProducts: campaign.approvedProducts,
    assets: campaign.assetPaths ?? {},
  });
  const { html } = await renderSkeleton(skeleton, blueprint, {
    withAssets: true,
    blockOverrides: campaign.blockOverrides,
    blockOrder,
  });
  const renderResult: FinalRenderResult = {
    skeletonId: skeleton.id,
    html,
    renderedAt: new Date().toISOString(),
  };

  await updateCampaign(campaign.id, {
    blockOrder,
    renderResult,
    error: null,
  });

  return { status: "completed", renderResult };
}

function validateBlockOrder(order: number[], expectedLength: number): void {
  if (order.length !== expectedLength) {
    throw new Error(
      `blockOrder length ${order.length} does not match skeleton block count ${expectedLength}.`,
    );
  }
  const seen = new Set<number>();
  for (const idx of order) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= expectedLength) {
      throw new Error(
        `blockOrder contains invalid index ${idx} (allowed 0..${expectedLength - 1}).`,
      );
    }
    if (seen.has(idx)) {
      throw new Error(`blockOrder contains duplicate index ${idx}.`);
    }
    seen.add(idx);
  }
}
