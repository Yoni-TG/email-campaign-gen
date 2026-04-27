import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { renderCandidates } from "@/modules/campaigns/actions/render-candidates";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["rendering_candidates"]);
  if (!result.ok) return result.response;

  try {
    const out = await renderCandidates(result.campaign);
    return NextResponse.json(out);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Candidate render failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
