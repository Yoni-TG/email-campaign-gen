import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { replaceProductImage } from "@/modules/campaigns/actions/replace-product-image";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["completed"]);
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
    const message =
      err instanceof Error ? err.message : "Product image replace failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
