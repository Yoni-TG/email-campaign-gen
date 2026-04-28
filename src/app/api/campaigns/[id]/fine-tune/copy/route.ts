import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { updateCopy } from "@/modules/campaigns/actions/update-copy";
import type { ApprovedCopy } from "@/lib/types";
import { handleRouteError } from "@/lib/errors";

interface UpdateCopyBody {
  approvedCopy?: Omit<ApprovedCopy, "campaign_id">;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["completed"]);
  if (!result.ok) return result.response;

  const body = (await request.json()) as UpdateCopyBody;
  if (!body.approvedCopy) {
    return NextResponse.json(
      { error: "Missing 'approvedCopy'" },
      { status: 400 },
    );
  }

  try {
    const out = await updateCopy(result.campaign, body.approvedCopy);
    return NextResponse.json(out);
  } catch (err) {
    return handleRouteError(err, "Copy update failed");
  }
}
