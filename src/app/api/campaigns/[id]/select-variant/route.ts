import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import { selectVariant } from "@/modules/campaigns/actions/select-variant";

interface SelectVariantBody {
  variantName?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["variant_selection"]);
  if (!result.ok) return result.response;

  const body = (await request.json()) as SelectVariantBody;
  if (typeof body.variantName !== "string" || body.variantName.length === 0) {
    return NextResponse.json(
      { error: "Missing 'variantName'" },
      { status: 400 },
    );
  }

  try {
    const out = await selectVariant(result.campaign, body.variantName);
    return NextResponse.json(out);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Variant selection failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
