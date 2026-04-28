import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  CAMPAIGN_TYPES,
  LEAD_PERSONALITIES,
  LEAD_VALUES,
  MARKETS,
} from "@/lib/types";
import { ValidationError, handleRouteError } from "@/lib/errors";
import {
  createCampaign,
  listCampaigns,
} from "@/modules/campaigns/utils/campaign-persistence";
import {
  ensureFeedLoaded,
  getProductBySku,
} from "@/modules/products/services/product-feed";

export async function GET() {
  const campaigns = await listCampaigns();
  return NextResponse.json(campaigns);
}

const seedSchema = z.object({
  targetCategories: z.array(z.string().min(1)).min(1),
  promoDetails: z.string().optional(),
  mainMessage: z.string().min(1),
  secondaryMessage: z.string().optional(),
  pinnedSkus: z.array(z.string().min(1)).optional(),
  milledInspirationUrls: z.array(z.string().url()).optional(),
  additionalNotes: z.string().optional(),
  includeSms: z.boolean(),
  includeNicky: z.boolean().optional(),
  leadValue: z.enum(LEAD_VALUES),
  leadPersonalities: z.array(z.enum(LEAD_PERSONALITIES)).min(1),
  market: z.enum(MARKETS).optional(),
});

const createCampaignSchema = z.object({
  name: z.string().trim().min(1),
  campaignType: z.enum(CAMPAIGN_TYPES),
  createdBy: z.string().min(1).optional(),
  seed: seedSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createCampaignSchema.parse(body);

    const pinned = parsed.seed.pinnedSkus ?? [];
    if (pinned.length > 0) {
      await ensureFeedLoaded();
      const unknown = pinned.filter((sku) => !getProductBySku(sku));
      if (unknown.length > 0) {
        throw new ValidationError(
          `Unknown pinned SKU${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}`,
          { pinnedSkus: unknown },
        );
      }
    }

    const campaign = await createCampaign({
      name: parsed.name,
      campaignType: parsed.campaignType,
      createdBy: parsed.createdBy ?? "anonymous",
      seed: parsed.seed,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    return handleRouteError(err, "Failed to create campaign");
  }
}
