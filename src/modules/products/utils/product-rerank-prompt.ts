import {
  CAMPAIGN_TYPE_LABELS,
  LEAD_PERSONALITY_DESCRIPTIONS,
  LEAD_PERSONALITY_LABELS,
  LEAD_VALUE_DESCRIPTIONS,
  LEAD_VALUE_LABELS,
  type CampaignType,
  type CreativeSeed,
  type DigestedProduct,
  type PriceTier,
  type PrimaryLanguage,
  type ReviewTier,
} from "@/lib/types";

const MAX_DESCRIPTION_CHARS = 200;

const SYSTEM_PROMPT =
  `You are a product merchandiser for Theo Grace, a personalized jewelry brand ` +
  `launched on top of MYKA's expertise. You rank products for marketing ` +
  `campaigns — email blasts, SMS flows, site promos — using the data already ` +
  `derived from the product feed.\n\n` +
  `Theo Grace voice is joyfully characterful and warm-hearted; selections ` +
  `should reflect that (strong personalization stories, modern family moments, ` +
  `everyday meaning). Avoid items that feel generic or off-brand for the ` +
  `active campaign theme.\n\n` +
  `Ranking criteria — in priority order:\n` +
  `1. Campaign-theme fit. Does the product match the mainMessage, secondaryMessage, ` +
  `   and promoDetails? Use name, productType, collection, and occasion to judge.\n` +
  `2. Lead-value + personality fit. The campaign brief names one lead_value (the ` +
  `   emotional anchor) and 1+ lead_personalities (the voice). Prefer products ` +
  `   that carry the same emotional weight — e.g. family_first → name / initial / ` +
  `   birthstone pieces and family-occasion items; joy → bright, playful, gifting.\n` +
  `3. Audience fit. Use shopFor + occasion to gauge whether the product resonates ` +
  `   with the implied recipient of the campaign.\n` +
  `4. Social proof. Prefer reviewTier = "highly_reviewed", then "well_reviewed", ` +
  `   and break ties in favor of reviewTier over an equally-fitting but unrated ` +
  `   product.\n` +
  `5. Price mix. Among the N selected, ensure at least 2 price tiers are ` +
  `   represented so readers see a mix of entry-point and hero pieces. Exception: ` +
  `   stay within one tier when the brief explicitly calls for budget or luxury.\n` +
  `6. Personalization relevance. When the campaign leans on customization, gifting, ` +
  `   or meaning, promote products with a non-null personalizationSummary.\n\n` +
  `Filter rules:\n` +
  `- Skip anything that feels thematically wrong, even if reviews are strong.\n` +
  `- SKUs must be distinct. Note: the feed may contain variants of the same ` +
  `  physical design (e.g. different metals or inscription counts). Prefer one ` +
  `  representative per design family when you can tell from name + productType.\n` +
  `- Return exactly the requested count, ordered most relevant first.\n\n` +
  `Call the rank_products tool with the chosen SKU list. Do not write prose — ` +
  `only the tool call.`;

export function buildRerankSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export interface ProductSummary {
  sku: string;
  name: string;
  description: string;
  productType: string[];
  priceTier: PriceTier;
  isOnSale: boolean;
  isClearance: boolean;
  reviewTier: ReviewTier;
  primaryLanguage: PrimaryLanguage;
  shopFor: string[];
  occasion: string[];
  collection: string[];
  personalizationSummary: string | null;
}

export function toProductSummary(product: DigestedProduct): ProductSummary {
  return {
    sku: product.sku,
    name: product.name,
    description: product.description.slice(0, MAX_DESCRIPTION_CHARS),
    productType: product.productType,
    priceTier: product.priceTier,
    isOnSale: product.isOnSale,
    isClearance: product.isClearance,
    reviewTier: product.reviewTier,
    primaryLanguage: product.primaryLanguage,
    shopFor: product.shopFor,
    occasion: product.occasion,
    collection: product.collection,
    personalizationSummary: product.personalizationSummary,
  };
}

export function buildRerankUserPrompt(
  seed: CreativeSeed,
  campaignType: CampaignType,
  candidates: DigestedProduct[],
  count: number,
): string {
  const personalityLine = seed.leadPersonalities
    .map(
      (p) =>
        `${LEAD_PERSONALITY_LABELS[p]} (${LEAD_PERSONALITY_DESCRIPTIONS[p]})`,
    )
    .join("; ");

  const lines: string[] = [
    `Campaign brief`,
    `- Campaign type: ${CAMPAIGN_TYPE_LABELS[campaignType]}`,
    `- Lead value: ${LEAD_VALUE_LABELS[seed.leadValue]} — ${LEAD_VALUE_DESCRIPTIONS[seed.leadValue]}`,
    `- Lead personalities: ${personalityLine}`,
    `- Main message: ${seed.mainMessage}`,
  ];
  if (seed.secondaryMessage) {
    lines.push(`- Secondary message: ${seed.secondaryMessage}`);
  }
  if (seed.promoDetails) {
    lines.push(`- Promo details: ${seed.promoDetails}`);
  }
  lines.push(`- Target categories: ${seed.targetCategories.join(", ")}`);
  if (seed.additionalNotes) {
    lines.push(`- Notes: ${seed.additionalNotes}`);
  }

  const summaries = candidates.map(toProductSummary);

  return [
    lines.join("\n"),
    ``,
    `Return the ${count} most relevant products, ordered by relevance. Candidates:`,
    JSON.stringify(summaries, null, 2),
  ].join("\n");
}
