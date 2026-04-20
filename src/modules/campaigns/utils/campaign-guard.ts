import { NextResponse } from "next/server";
import type { Campaign, CampaignStatus } from "@/lib/types";
import { getCampaign } from "./campaign-persistence";

export type GuardResult =
  | { ok: true; campaign: Campaign }
  | { ok: false; response: NextResponse };

// Shared load + status-check the transition routes need. Keeps route handlers
// down to "ask the guard, call the action, return the result".
export async function requireCampaign(
  id: string,
  allowedStatuses?: CampaignStatus[],
): Promise<GuardResult> {
  const campaign = await getCampaign(id);
  if (!campaign) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 },
      ),
    };
  }

  if (allowedStatuses && !allowedStatuses.includes(campaign.status)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: `Invalid status for this action: ${campaign.status}`,
          allowed: allowedStatuses,
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true, campaign };
}
