import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { renderFinal } from "@/modules/campaigns/actions/render-final";
import { handleRouteError } from "@/lib/errors";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["rendering_final"]);
  if (!result.ok) return result.response;

  try {
    const out = await renderFinal(result.campaign);
    return NextResponse.json(out);
  } catch (err) {
    return handleRouteError(err, "Final render failed", 500);
  }
}
