import { NextRequest, NextResponse } from "next/server";
import type { ApprovedCopy, ProductSnapshot } from "@/lib/types";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { approveCampaign } from "@/modules/campaigns/actions/approve-campaign";

interface ApproveBody {
  approvedCopy?: ApprovedCopy;
  approvedProducts?: ProductSnapshot[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["review"]);
  if (!result.ok) return result.response;

  const body = (await request.json()) as ApproveBody;
  if (!body.approvedCopy || !Array.isArray(body.approvedProducts)) {
    return NextResponse.json(
      { error: "Missing approvedCopy or approvedProducts" },
      { status: 400 },
    );
  }

  const out = await approveCampaign(result.campaign, {
    approvedCopy: body.approvedCopy,
    approvedProducts: body.approvedProducts,
  });
  return NextResponse.json(out);
}
