import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { runGeneration } from "@/modules/campaigns/actions/generate-campaign";
import { handleRouteError } from "@/lib/errors";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["draft", "generating"]);
  if (!result.ok) return result.response;

  try {
    const out = await runGeneration(result.campaign);
    return NextResponse.json(out);
  } catch (err) {
    return handleRouteError(err, "Generation failed", 500);
  }
}
