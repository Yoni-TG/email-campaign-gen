import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { archiveCampaign } from "@/modules/campaigns/actions/archive-campaign";

interface ArchiveBody {
  archived?: boolean;
}

// Toggle the soft-archive flag. Allowed at every status — operators
// commonly archive long-completed campaigns, but they may also archive
// a stuck or duplicated draft, so the route is intentionally
// status-agnostic.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id);
  if (!result.ok) return result.response;

  const body = (await request.json().catch(() => ({}))) as ArchiveBody;
  if (typeof body.archived !== "boolean") {
    return NextResponse.json(
      { error: "Missing 'archived' boolean in body" },
      { status: 400 },
    );
  }

  const out = await archiveCampaign(result.campaign, body.archived);
  return NextResponse.json(out);
}
