import type { Campaign, FinalRenderResult } from "@/lib/types";
import { renderSkeleton } from "@/modules/email-templates";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import {
  BLOCK_ALIGNMENTS,
  BLOCK_BACKGROUNDS,
  BUTTON_COLORS,
} from "@/modules/email-templates/blocks/theme";
import { buildBlueprint } from "@/modules/campaigns/utils/build-blueprint";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export const BLOCK_STYLE_KEYS = ["background", "align", "buttonColor"] as const;
export type BlockStyleKey = (typeof BLOCK_STYLE_KEYS)[number];

export interface UpdateBlockStyleResult {
  status: "completed";
  renderResult: FinalRenderResult;
}

const ALLOWED_VALUES: Record<BlockStyleKey, readonly string[]> = {
  background: BLOCK_BACKGROUNDS,
  align: BLOCK_ALIGNMENTS,
  buttonColor: BUTTON_COLORS,
};

// Fine-tune action — patch one keyed style override on a single block
// (background, alignment, or button colour). Persists to
// Campaign.blockOverrides[blockIndex][key] and re-runs renderFinal so
// the export-ready HTML reflects the change alongside any prior overrides.
export async function updateBlockStyle(
  campaign: Campaign,
  blockIndex: number,
  key: BlockStyleKey,
  value: string,
): Promise<UpdateBlockStyleResult> {
  if (!campaign.chosenSkeletonId) {
    throw new Error("Campaign has no chosenSkeletonId.");
  }
  if (!campaign.approvedCopy || !campaign.approvedProducts) {
    throw new Error("Campaign missing approved copy or products.");
  }
  if (!ALLOWED_VALUES[key].includes(value)) {
    throw new Error(
      `Invalid ${key} "${value}". Allowed: ${ALLOWED_VALUES[key].join(", ")}`,
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
      [key]: value,
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
    blockOrder: campaign.blockOrder,
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
