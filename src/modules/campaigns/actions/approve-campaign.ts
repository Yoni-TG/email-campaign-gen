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
  status: "hero_upload";
}

export async function approveCampaign(
  campaign: Campaign,
  input: ApproveInput,
): Promise<ApproveResult> {
  await updateCampaign(campaign.id, {
    approvedCopy: input.approvedCopy,
    approvedProducts: input.approvedProducts,
    status: "hero_upload",
  });
  return { status: "hero_upload" };
}
