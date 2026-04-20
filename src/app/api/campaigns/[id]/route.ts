import { NextRequest, NextResponse } from "next/server";
import type { CampaignWrite } from "@/modules/campaigns/utils/campaign-persistence";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id);
  if (!result.ok) return result.response;
  return NextResponse.json(result.campaign);
}

// PATCH accepts the same CampaignWrite fields as the persistence layer — the
// UI uses this for light edits (renaming a draft, clearing an error, etc.).
// State-transition endpoints should be used for status changes instead.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id);
  if (!result.ok) return result.response;

  const body = (await request.json()) as CampaignWrite;
  const campaign = await updateCampaign(id, body);
  return NextResponse.json(campaign);
}
