import type { Campaign, FinalRenderResult } from "@/lib/types";
import { renderSkeleton } from "@/modules/email-templates";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import { buildBlueprint } from "@/modules/campaigns/utils/build-blueprint";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface RenderFinalResult {
  status: "completed";
  renderResult: FinalRenderResult;
}

// rendering_final → completed
//
// Runs the renderer with the operator-uploaded assets to produce the
// export-ready HTML, then writes it to Campaign.renderResult and advances.
export async function renderFinal(campaign: Campaign): Promise<RenderFinalResult> {
  if (!campaign.approvedCopy || !campaign.approvedProducts) {
    throw new Error("Campaign missing approved copy/products.");
  }
  if (!campaign.chosenSkeletonId) {
    throw new Error("Campaign has no chosenSkeletonId.");
  }
  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) {
    throw new Error(
      `Unknown chosenSkeletonId "${campaign.chosenSkeletonId}".`,
    );
  }

  const blueprint = buildBlueprint({
    campaignId: campaign.id,
    seed: campaign.seed,
    approvedCopy: campaign.approvedCopy,
    approvedProducts: campaign.approvedProducts,
    assets: campaign.assetPaths ?? {},
  });

  try {
    const { html, missingAssets } = await renderSkeleton(skeleton, blueprint, {
      withAssets: true,
    });

    const renderResult: FinalRenderResult = {
      skeletonId: skeleton.id,
      html,
      renderedAt: new Date().toISOString(),
    };

    await updateCampaign(campaign.id, {
      renderResult,
      status: "completed",
      error:
        missingAssets.length > 0
          ? `Rendered with ${missingAssets.length} missing asset slot(s): ${missingAssets.join(", ")}`
          : null,
    });

    return { status: "completed", renderResult };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Final render failed";
    await updateCampaign(campaign.id, { error: message });
    throw err;
  }
}
