import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { replaceAsset } from "@/modules/campaigns/actions/replace-asset";
import { handleRouteError } from "@/lib/errors";

// Fine-tune: replace an asset on a completed campaign and re-render.
// Distinct from the initial /asset endpoint (which requires asset_upload
// status) so the original onboarding flow stays single-purpose.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["completed"]);
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
    const out = await replaceAsset(result.campaign, slotKey, file);
    return NextResponse.json(out);
  } catch (err) {
    return handleRouteError(err, "Asset replace failed");
  }
}
