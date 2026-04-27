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
  /**
   * Operator-uploaded asset URLs keyed by AssetSlot.key from the chosen
   * skeleton (e.g. "hero", "closing"). Empty during the candidate-render
   * phase — the renderer falls back to placeholders for unset keys.
   */
  assets?: Record<string, string>;
}

// Builds the CampaignBlueprint consumed by the email-templates renderer.
// Pure — no I/O.
export function buildBlueprint({
  campaignId,
  seed,
  approvedCopy,
  approvedProducts,
  assets,
}: BuildBlueprintInput): CampaignBlueprint {
  return {
    campaign_id: campaignId,
    lead_value: seed.leadValue,
    lead_personalities: seed.leadPersonalities,
    market: seed.market ?? "us",
    free_top_text: approvedCopy.free_top_text,
    subject_variant: approvedCopy.subject_variant,
    body_blocks: approvedCopy.body_blocks,
    sms: approvedCopy.sms,
    nicky_quote: approvedCopy.nicky_quote,
    products: approvedProducts.map((p) => ({
      sku: p.sku,
      title: p.name,
      price: p.salePrice || p.price,
      image_url: p.imageUrl,
      link: p.link,
    })),
    assets: assets ?? {},
  };
}
