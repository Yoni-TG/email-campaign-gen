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
  `You are a product merchandiser for Theo Grace, a personalized jewelry ` +
  `brand. You rank products for marketing campaigns from the supplied ` +
  `<candidates> list — an upstream filter has already enforced category and ` +
  `audience constraints, so every candidate is fair game.\n\n` +
  `## Hard constraints (MUST satisfy)\n\n` +
  `- Every returned SKU MUST appear in the supplied <candidates> list. Do ` +
  `  not invent SKUs or pull from memory.\n` +
  `- Return EXACTLY the requested count, ordered most relevant first.\n` +
  `- All SKUs distinct. The feed contains variants of the same physical ` +
  `  design (different metals, inscription counts). Prefer one ` +
  `  representative per design family — judge from name + productType.\n\n` +
  `## Soft preferences (rank order)\n\n` +
  `1. Theme fit. Does the product match the brief's <main_message>, ` +
  `   <secondary_message>, and <promo_details>? Use name, productType, ` +
  `   collection, and occasion to judge.\n` +
  `2. Lead-value + personality fit. <lead_value> is the emotional anchor; ` +
  `   <lead_personalities> are the voice. Prefer products that carry the ` +
  `   same emotional weight — family_first → name / initial / birthstone ` +
  `   pieces and family-occasion items; joy → bright, playful, gifting.\n` +
  `3. Social proof. highly_reviewed > well_reviewed > unrated, all else ` +
  `   equal — break ties on reviewTier.\n` +
  `4. Price spread. Among the N selected, mix at least 2 price tiers so ` +
  `   readers see entry-point and hero pieces. Exception: stay within one ` +
  `   tier when the brief explicitly calls for budget or luxury.\n` +
  `5. Personalization relevance. When the campaign leans on customization ` +
  `   or gifting, prefer products with a non-null personalizationSummary.\n\n` +
  `## Brand voice\n\n` +
  `Theo Grace voice is joyfully characterful and warm-hearted (modern ` +
  `family moments, everyday meaning, personalization stories). Selections ` +
  `should reflect that. Skip items that feel generic or off-brand even if ` +
  `they otherwise match — voice undermines product fit.\n\n` +
  `## Output\n\n` +
  `Call the rank_products tool with the chosen SKU list. Do not write ` +
  `prose — only the tool call.`;

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

  // XML-tagged structure: hard constraints (audience, categories) lead, then
  // theme fields, then voice. The Anthropic models we use weight earlier
  // and clearly delimited content more heavily; the SMS-overshoot retry
  // pattern in copy-generation.ts proved this layout is robust under
  // tool-use forcing.
  const briefLines: string[] = [
    `<campaign_type>${CAMPAIGN_TYPE_LABELS[campaignType]}</campaign_type>`,
    `<categories>${seed.targetCategories.join(", ")}</categories>`,
  ];

  if (seed.targetAudience && seed.targetAudience.length > 0) {
    briefLines.push(`<audience>${seed.targetAudience.join(", ")}</audience>`);
  }

  briefLines.push(
    `<lead_value>${LEAD_VALUE_LABELS[seed.leadValue]} — ${LEAD_VALUE_DESCRIPTIONS[seed.leadValue]}</lead_value>`,
    `<lead_personalities>${personalityLine}</lead_personalities>`,
    `<main_message>${seed.mainMessage}</main_message>`,
  );

  if (seed.secondaryMessage) {
    briefLines.push(
      `<secondary_message>${seed.secondaryMessage}</secondary_message>`,
    );
  }
  if (seed.promoDetails) {
    briefLines.push(`<promo_details>${seed.promoDetails}</promo_details>`);
  }
  if (seed.additionalNotes) {
    briefLines.push(`<notes>${seed.additionalNotes}</notes>`);
  }

  const summaries = candidates.map(toProductSummary);

  return [
    `<brief>`,
    ...briefLines.map((l) => `  ${l}`),
    `</brief>`,
    ``,
    `<task>Pick the ${count} best products from <candidates> for this brief, ordered most relevant first.</task>`,
    ``,
    `<candidates>`,
    JSON.stringify(summaries, null, 2),
    `</candidates>`,
  ].join("\n");
}
