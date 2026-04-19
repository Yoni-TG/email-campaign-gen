import type { CampaignType, DigestedProduct } from "@/lib/types";

export interface ProductFilterOptions {
  categories: string[];
  campaignType: CampaignType;
  pinnedSkus?: string[];
  /** Upper bound on returned candidates; defaults to 50 so LLM re-rank stays cheap. */
  maxCandidates?: number;
}

const DEFAULT_MAX_CANDIDATES = 50;

function discount(p: DigestedProduct): number {
  const price = parseFloat(p.price);
  const sale = parseFloat(p.salePrice);
  if (Number.isNaN(price) || Number.isNaN(sale)) return 0;
  return Math.max(0, price - sale);
}

function reviewRank(p: DigestedProduct): number {
  if (p.reviewTier === "highly_reviewed") return 2;
  if (p.reviewTier === "well_reviewed") return 1;
  return 0;
}

function sortByCampaignType(
  products: DigestedProduct[],
  campaignType: CampaignType,
): DigestedProduct[] {
  if (campaignType === "sale_promo") {
    return [...products].sort((a, b) => discount(b) - discount(a));
  }
  if (campaignType === "collection_spotlight") {
    return [...products].sort((a, b) => reviewRank(b) - reviewRank(a));
  }
  return products;
}

/**
 * Stage-1 deterministic filter. Narrows the full digested feed to the
 * candidates the LLM re-rank will choose from. Pure — no IO, no Claude.
 */
export function filterProducts(
  products: DigestedProduct[],
  options: ProductFilterOptions,
): DigestedProduct[] {
  const {
    categories,
    campaignType,
    pinnedSkus = [],
    maxCandidates = DEFAULT_MAX_CANDIDATES,
  } = options;

  const pinnedSet = new Set(pinnedSkus);
  const categorySet = new Set(categories.map((c) => c.toLowerCase()));

  const filtered = products.filter((p) => {
    if (pinnedSet.has(p.sku)) return false;

    const types = p.productType.map((t) => t.toLowerCase());
    if (!types.some((t) => categorySet.has(t))) return false;

    if (campaignType === "sale_promo" && !p.isOnSale) return false;

    return true;
  });

  return sortByCampaignType(filtered, campaignType).slice(0, maxCandidates);
}
