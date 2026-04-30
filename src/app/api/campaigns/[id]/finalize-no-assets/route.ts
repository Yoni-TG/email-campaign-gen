import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { finalizeNoAssets } from "@/modules/campaigns/actions/finalize-no-assets";
import { handleRouteError } from "@/lib/errors";

// Used by ZeroSlotState in step 4 to advance a 0-required-slot skeleton
// straight from asset_upload to completed in one server round-trip.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["asset_upload"]);
  if (!result.ok) return result.response;

  try {
    const out = await finalizeNoAssets(result.campaign);
    return NextResponse.json(out);
  } catch (err) {
    return handleRouteError(err, "Finalize-no-assets failed");
  }
}
