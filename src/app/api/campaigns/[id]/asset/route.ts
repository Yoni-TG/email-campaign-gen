import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { uploadAsset } from "@/modules/campaigns/actions/upload-asset";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["asset_upload"]);
  if (!result.ok) return result.response;

  const formData = await request.formData();
  const slotKey = formData.get("slotKey");
  const file = formData.get("file");

  if (typeof slotKey !== "string" || slotKey.length === 0) {
    return NextResponse.json(
      { error: "Missing 'slotKey' in form data" },
      { status: 400 },
    );
  }
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'file' in form data" },
      { status: 400 },
    );
  }

  try {
    const out = await uploadAsset(result.campaign, slotKey, file);
    return NextResponse.json(out);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Asset upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
