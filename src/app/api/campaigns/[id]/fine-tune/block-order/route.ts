import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { updateBlockOrder } from "@/modules/campaigns/actions/update-block-order";
import { handleRouteError } from "@/lib/errors";

interface UpdateBlockOrderBody {
  blockOrder?: number[];
}

// Persists a new block display order for a completed campaign and
// re-renders. Validation lives in the action.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["completed"]);
  if (!result.ok) return result.response;

  const body = (await request.json()) as UpdateBlockOrderBody;
  if (!Array.isArray(body.blockOrder)) {
    return NextResponse.json(
      { error: "Missing 'blockOrder' (number[])." },
      { status: 400 },
    );
  }

  try {
    const out = await updateBlockOrder(result.campaign, body.blockOrder);
    return NextResponse.json(out);
  } catch (err) {
    return handleRouteError(err, "Block order update failed");
  }
}
