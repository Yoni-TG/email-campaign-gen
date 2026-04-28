import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { uploadAsset } from "@/modules/campaigns/actions/upload-asset";
import { handleRouteError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Both statuses are valid: while the operator is filling required slots
  // we're in `asset_upload`; the moment the LAST required slot lands the
  // action flips us to `rendering_final`. If they also picked an optional
  // asset in the same batch, the next iteration of the upload loop arrives
  // with the campaign already in `rendering_final` — we still want it to
  // land before the render kicks off.
  const result = await requireCampaign(id, ["asset_upload", "rendering_final"]);
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
    return handleRouteError(err, "Asset upload failed");
  }
}
