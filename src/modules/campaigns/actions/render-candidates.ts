import type { Campaign, CandidateVariant } from "@/lib/types";
import { renderSkeleton, selectSkeletons } from "@/modules/email-templates";
import type { SkeletonRanked } from "@/modules/email-templates";
import { buildBlueprint } from "@/modules/campaigns/utils/build-blueprint";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface RenderCandidatesResult {
  status: "variant_selection";
  candidateVariants: CandidateVariant[];
}

// rendering_candidates → variant_selection
//
// Picks 3 skeletons that fit the campaign type (selectSkeletons) and renders
// each against the approved copy + products. Asset slots resolve to
// placeholders during this candidate phase — the operator uploads real assets
// AFTER picking a variant.
export async function renderCandidates(
  campaign: Campaign,
): Promise<RenderCandidatesResult> {
  if (!campaign.approvedCopy || !campaign.approvedProducts) {
    throw new Error(
      "Campaign missing approvedCopy or approvedProducts — approve before render-candidates.",
    );
  }

  const blueprint = buildBlueprint({
    campaignId: campaign.id,
    seed: campaign.seed,
    approvedCopy: campaign.approvedCopy,
    approvedProducts: campaign.approvedProducts,
    // No assets at this stage — the renderer falls back to placeholders
    // for `assets.<key>` bind paths.
  });

  try {
    const ranked = await selectSkeletons({
      campaignType: campaign.campaignType,
      leadValue: campaign.seed.leadValue,
      leadPersonalities: campaign.seed.leadPersonalities,
      productCount: campaign.approvedProducts.length,
      bodyBlockCount: campaign.approvedCopy.body_blocks.length,
      hasNickyQuote: campaign.approvedCopy.nicky_quote !== null,
      mainMessage: campaign.seed.mainMessage,
    });

    const candidateVariants: CandidateVariant[] = await Promise.all(
      ranked.map(async ({ skeleton, rationale }: SkeletonRanked) => {
        const { html } = await renderSkeleton(skeleton, blueprint, {
          withAssets: false,
        });
        return {
          skeletonId: skeleton.id,
          name: skeleton.name,
          rationale,
          previewHtml: html,
        };
      }),
    );

    await updateCampaign(campaign.id, {
      candidateVariants,
      status: "variant_selection",
      error: null,
    });

    return { status: "variant_selection", candidateVariants };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Candidate render failed";
    await updateCampaign(campaign.id, { error: message });
    throw err;
  }
}
