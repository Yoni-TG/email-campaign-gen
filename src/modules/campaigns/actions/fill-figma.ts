import type { Campaign, FigmaResult } from "@/lib/types";
import { figmaService } from "@/modules/figma/services/figma-service";
import { buildBlueprint } from "@/modules/campaigns/utils/build-blueprint";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface FillFigmaResult {
  status: "variant_selection";
  figmaResult: FigmaResult;
}

export async function fillFigma(campaign: Campaign): Promise<FillFigmaResult> {
  if (!campaign.approvedCopy || !campaign.approvedProducts) {
    throw new Error(
      "Campaign missing approvedCopy or approvedProducts — approve before fill-figma.",
    );
  }

  const blueprint = buildBlueprint({
    campaignId: campaign.id,
    seed: campaign.seed,
    approvedCopy: campaign.approvedCopy,
    approvedProducts: campaign.approvedProducts,
    heroImagePath: campaign.heroImagePath,
  });

  try {
    const variants = await figmaService.fillTemplates(blueprint);
    const thumbnails = await figmaService.exportThumbnails(variants);

    const figmaResult: FigmaResult = {
      variants: variants.map((v, i) => ({
        variantName: v.variantName,
        figmaFrameUrl: v.figmaFrameUrl,
        thumbnailUrl: thumbnails[i],
      })),
    };

    await updateCampaign(campaign.id, {
      figmaResult,
      status: "variant_selection",
      error: null,
    });

    return { status: "variant_selection", figmaResult };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Figma fill failed";
    await updateCampaign(campaign.id, { error: message });
    throw err;
  }
}
