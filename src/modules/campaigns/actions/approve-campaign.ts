import type {
  ApprovedCopy,
  Campaign,
  ProductSnapshot,
} from "@/lib/types";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

export interface ApproveInput {
  approvedCopy: ApprovedCopy;
  approvedProducts: ProductSnapshot[];
}

export interface ApproveResult {
  status: "rendering_candidates";
}

// CP1 review-gate: lock approved copy + products and advance to the
// candidate-render phase. The candidate render itself runs as a follow-up
// action (renderCandidates) — keeping that out of approve makes this idempotent
// and lets the UI poll the status instead of holding an HTTP request open
// during the render.
export async function approveCampaign(
  campaign: Campaign,
  input: ApproveInput,
): Promise<ApproveResult> {
  await updateCampaign(campaign.id, {
    approvedCopy: input.approvedCopy,
    approvedProducts: input.approvedProducts,
    status: "rendering_candidates",
  });
  return { status: "rendering_candidates" };
}
