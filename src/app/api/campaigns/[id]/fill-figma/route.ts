import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { fillFigma } from "@/modules/campaigns/actions/fill-figma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["filling_figma"]);
  if (!result.ok) return result.response;

  try {
    const out = await fillFigma(result.campaign);
    return NextResponse.json(out);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Figma fill failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
