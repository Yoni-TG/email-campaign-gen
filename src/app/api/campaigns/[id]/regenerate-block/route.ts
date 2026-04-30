import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { regenerateBlock } from "@/modules/copy-generation/services/regenerate-block";
import { handleRouteError } from "@/lib/errors";
import type { BodyBlock } from "@/lib/types";

interface RegenerateBlockBody {
  index?: number;
  blocks?: BodyBlock[];
}

// Per-section "Regenerate" affordance from the wizard copy step. Takes
// the operator's current block list (so unsaved edits are honored) plus
// the index to replace; returns the fresh BodyBlock for the client to
// merge in. Persistence flows through the existing autosave loop.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id);
  if (!result.ok) return result.response;

  const body = (await request.json()) as RegenerateBlockBody;
  if (typeof body.index !== "number" || !Array.isArray(body.blocks)) {
    return NextResponse.json(
      { error: "Missing 'index' (number) or 'blocks' (array)." },
      { status: 400 },
    );
  }

  try {
    const block = await regenerateBlock({
      seed: result.campaign.seed,
      campaignType: result.campaign.campaignType,
      blocks: body.blocks,
      index: body.index,
    });
    return NextResponse.json({ block });
  } catch (err) {
    return handleRouteError(err, "Block regeneration failed");
  }
}
