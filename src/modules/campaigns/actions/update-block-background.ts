import type { Campaign, FinalRenderResult } from "@/lib/types";
import { renderSkeleton } from "@/modules/email-templates";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import { BLOCK_BACKGROUNDS } from "@/modules/email-templates/blocks/theme";
import type { BlockBackground } from "@/modules/email-templates/blocks/theme";
import { buildBlueprint } from "@/modules/campaigns/utils/build-blueprint";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface UpdateBlockBackgroundResult {
  status: "completed";
  renderResult: FinalRenderResult;
}

// Fine-tune action — patch one block's `background` prop on a completed
// campaign. Persists to Campaign.blockOverrides[blockIndex].background
// and re-runs renderFinal so the export-ready HTML reflects the change
// alongside any prior overrides.
export async function updateBlockBackground(
  campaign: Campaign,
  blockIndex: number,
  background: BlockBackground,
): Promise<UpdateBlockBackgroundResult> {
  if (!campaign.chosenSkeletonId) {
    throw new Error("Campaign has no chosenSkeletonId.");
  }
  if (!campaign.approvedCopy || !campaign.approvedProducts) {
    throw new Error("Campaign missing approved copy or products.");
  }
  if (!BLOCK_BACKGROUNDS.includes(background)) {
    throw new Error(
      `Unknown background "${background}". Allowed: ${BLOCK_BACKGROUNDS.join(", ")}`,
    );
  }
  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) {
    throw new Error(`Unknown chosenSkeletonId "${campaign.chosenSkeletonId}".`);
  }
  if (blockIndex < 0 || blockIndex >= skeleton.blocks.length) {
    throw new Error(
      `Block index ${blockIndex} out of range (skeleton has ${skeleton.blocks.length} blocks).`,
    );
  }

  const existing = campaign.blockOverrides ?? {};
  const blockOverrides: Record<number, Record<string, unknown>> = {
    ...existing,
    [blockIndex]: {
      ...(existing[blockIndex] ?? {}),
      background,
    },
  };

  const blueprint = buildBlueprint({
    campaignId: campaign.id,
    seed: campaign.seed,
    approvedCopy: campaign.approvedCopy,
    approvedProducts: campaign.approvedProducts,
    assets: campaign.assetPaths ?? {},
  });
  const { html } = await renderSkeleton(skeleton, blueprint, {
    withAssets: true,
    blockOverrides,
  });
  const renderResult: FinalRenderResult = {
    skeletonId: skeleton.id,
    html,
    renderedAt: new Date().toISOString(),
  };

  await updateCampaign(campaign.id, {
    blockOverrides,
    renderResult,
    error: null,
  });

  return { status: "completed", renderResult };
}
