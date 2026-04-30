import type { Campaign } from "@/lib/types";
import { renderSkeleton } from "@/modules/email-templates";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import { buildBlueprint } from "./build-blueprint";

// Server-side helper that re-renders a completed campaign with
// editable: true so the click-to-edit hooks are present in the HTML
// served to EditableEmailFrame. Distinct from Campaign.renderResult.html
// (which is always editable: false — that's what we ship to Klaviyo).
//
// Returns null when the campaign isn't in a renderable state — caller
// just falls back to the static iframe in that case.
export async function renderEditableForCampaign(
  campaign: Campaign,
): Promise<string | null> {
  if (
    !campaign.approvedCopy ||
    !campaign.approvedProducts ||
    !campaign.chosenSkeletonId
  ) {
    return null;
  }
  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) return null;

  const blueprint = buildBlueprint({
    campaignId: campaign.id,
    seed: campaign.seed,
    approvedCopy: campaign.approvedCopy,
    approvedProducts: campaign.approvedProducts,
    assets: campaign.assetPaths ?? {},
  });

  const { html } = await renderSkeleton(skeleton, blueprint, {
    withAssets: true,
    editable: true,
    blockOverrides: campaign.blockOverrides,
    blockOrder: campaign.blockOrder,
  });
  return html;
}
