import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { uploadHero } from "@/modules/campaigns/actions/upload-hero";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["hero_upload"]);
  if (!result.ok) return result.response;

  const formData = await request.formData();
  const file = formData.get("hero");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'hero' file in form data" },
      { status: 400 },
    );
  }

  const out = await uploadHero(result.campaign, file);
  return NextResponse.json(out);
}
