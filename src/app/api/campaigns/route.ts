import { NextRequest, NextResponse } from "next/server";
import type { CampaignType, CreativeSeed } from "@/lib/types";
import { CAMPAIGN_TYPES } from "@/lib/types";
import {
  createCampaign,
  listCampaigns,
} from "@/modules/campaigns/utils/campaign-persistence";

export async function GET() {
  const campaigns = await listCampaigns();
  return NextResponse.json(campaigns);
}

interface CreateBody {
  name?: unknown;
  campaignType?: unknown;
  createdBy?: unknown;
  seed?: unknown;
}

function validateSeed(value: unknown): value is CreativeSeed {
  if (!value || typeof value !== "object") return false;
  const seed = value as Partial<CreativeSeed>;
  return (
    Array.isArray(seed.targetCategories) &&
    seed.targetCategories.length > 0 &&
    typeof seed.mainMessage === "string" &&
    seed.mainMessage.length > 0 &&
    typeof seed.leadValue === "string" &&
    Array.isArray(seed.leadPersonalities) &&
    typeof seed.includeSms === "boolean"
  );
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateBody;

  if (typeof body.name !== "string" || body.name.length === 0) {
    return NextResponse.json(
      { error: "Missing or invalid 'name'" },
      { status: 400 },
    );
  }
  if (!CAMPAIGN_TYPES.includes(body.campaignType as CampaignType)) {
    return NextResponse.json(
      { error: "Missing or invalid 'campaignType'" },
      { status: 400 },
    );
  }
  if (!validateSeed(body.seed)) {
    return NextResponse.json(
      {
        error:
          "Invalid 'seed' — required: targetCategories[], mainMessage, leadValue, leadPersonalities[], includeSms",
      },
      { status: 400 },
    );
  }

  const campaign = await createCampaign({
    name: body.name,
    campaignType: body.campaignType as CampaignType,
    createdBy:
      typeof body.createdBy === "string" && body.createdBy.length > 0
        ? body.createdBy
        : "anonymous",
    seed: body.seed,
  });

  return NextResponse.json(campaign, { status: 201 });
}
