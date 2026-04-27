import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { updateBlockBackground } from "@/modules/campaigns/actions/update-block-background";
import type { BlockBackground } from "@/modules/email-templates/blocks/theme";

interface UpdateBlockBgBody {
  blockIndex?: number;
  background?: BlockBackground;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["completed"]);
  if (!result.ok) return result.response;

  const body = (await request.json()) as UpdateBlockBgBody;
  if (typeof body.blockIndex !== "number" || !body.background) {
    return NextResponse.json(
      { error: "Missing 'blockIndex' or 'background'" },
      { status: 400 },
    );
  }

  try {
    const out = await updateBlockBackground(
      result.campaign,
      body.blockIndex,
      body.background,
    );
    return NextResponse.json(out);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Block background update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
