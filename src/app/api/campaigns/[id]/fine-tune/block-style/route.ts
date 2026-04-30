import { NextRequest, NextResponse } from "next/server";
import { requireCampaign } from "@/modules/campaigns/utils/campaign-guard";
import {
  BLOCK_STYLE_KEYS,
  updateBlockStyle,
  type BlockStyleKey,
} from "@/modules/campaigns/actions/update-block-style";
import { handleRouteError } from "@/lib/errors";

interface UpdateBlockStyleBody {
  blockIndex?: number;
  key?: BlockStyleKey;
  value?: string;
}

// Generic fine-tune endpoint for per-block style overrides — background,
// alignment, button colour. Each call writes one keyed override and
// re-renders the campaign's final HTML.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await requireCampaign(id, ["completed"]);
  if (!result.ok) return result.response;

  const body = (await request.json()) as UpdateBlockStyleBody;
  if (
    typeof body.blockIndex !== "number" ||
    !body.key ||
    !BLOCK_STYLE_KEYS.includes(body.key) ||
    typeof body.value !== "string"
  ) {
    return NextResponse.json(
      {
        error:
          "Missing 'blockIndex' (number), 'key' (background | align | buttonColor), or 'value' (string).",
      },
      { status: 400 },
    );
  }

  try {
    const out = await updateBlockStyle(
      result.campaign,
      body.blockIndex,
      body.key,
      body.value,
    );
    return NextResponse.json(out);
  } catch (err) {
    return handleRouteError(err, "Block style update failed");
  }
}
