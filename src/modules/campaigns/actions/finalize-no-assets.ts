import type { Campaign } from "@/lib/types";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";
import { renderFinal, type RenderFinalResult } from "./render-final";

// asset_upload → rendering_final → completed for skeletons that declare
// zero required assets. Mirrors what uploadAsset does on its last
// required slot, but for the 0-slot case there's nothing to upload —
// we flip the status and hand off to renderFinal in one server hop so
// the ZeroSlotState "Continue" button can route straight to /design.
export async function finalizeNoAssets(
  campaign: Campaign,
): Promise<RenderFinalResult> {
  if (!campaign.chosenSkeletonId) {
    throw new Error(
      "Campaign has no chosenSkeletonId — pick a layout before finalizing.",
    );
  }
  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton) {
    throw new Error(`Unknown chosenSkeletonId "${campaign.chosenSkeletonId}".`);
  }
  const requiredCount = skeleton.requiredAssets.filter((a) => a.required).length;
  if (requiredCount > 0) {
    throw new Error(
      `Skeleton ${skeleton.id} declares ${requiredCount} required asset slot(s); use the upload flow.`,
    );
  }

  // Promote in one transaction so renderFinal's status guard passes.
  await updateCampaign(campaign.id, { status: "rendering_final" });
  return renderFinal({ ...campaign, status: "rendering_final" });
}
