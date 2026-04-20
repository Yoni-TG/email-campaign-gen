import type {
  ApprovedCopy,
  CampaignBlueprint,
  CreativeSeed,
  ProductSnapshot,
} from "@/lib/types";

export interface BuildBlueprintInput {
  campaignId: string;
  seed: CreativeSeed;
  approvedCopy: ApprovedCopy;
  approvedProducts: ProductSnapshot[];
  heroImagePath: string | null;
}

// Builds the CampaignBlueprint handed to FigmaService. Pure — no I/O.
export function buildBlueprint({
  campaignId,
  seed,
  approvedCopy,
  approvedProducts,
  heroImagePath,
}: BuildBlueprintInput): CampaignBlueprint {
  return {
    campaign_id: campaignId,
    lead_value: seed.leadValue,
    lead_personalities: seed.leadPersonalities,
    free_top_text: approvedCopy.free_top_text,
    subject_variant: approvedCopy.subject_variant,
    hero_image_url: heroImagePath ?? "",
    body_blocks: approvedCopy.body_blocks,
    sms: approvedCopy.sms,
    products: approvedProducts.map((p) => ({
      title: p.name,
      price: p.salePrice || p.price,
      image_url: p.imageUrl,
      link: p.link,
    })),
  };
}
