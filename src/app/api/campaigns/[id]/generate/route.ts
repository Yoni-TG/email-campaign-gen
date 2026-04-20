import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { runGeneration } from "@/modules/campaigns/actions/generate-campaign";

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
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
