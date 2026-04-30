import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { replaceProductImage } from "@/modules/campaigns/actions/replace-product-image";
import { handleRouteError } from "@/lib/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Allowed from asset_upload onward — operators may pre-swap a product
  // image during step 4 (Images) before the first full render. The action
  // still requires approvedProducts + chosenSkeletonId, both populated by
  // the time variant_selection has completed, so guarding by status alone
  // is overly strict.
  const result = await requireCampaign(id, [
    "asset_upload",
    "rendering_final",
    "completed",
  ]);
  if (!result.ok) return result.response;

  const formData = await request.formData();
  const sku = formData.get("sku");
  const file = formData.get("file");

  if (typeof sku !== "string" || sku.length === 0) {
    return NextResponse.json(
      { error: "Missing 'sku' in form data" },
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
    const out = await replaceProductImage(result.campaign, sku, file);
    return NextResponse.json(out);
  } catch (err) {
    return handleRouteError(err, "Product image replace failed");
  }
}
