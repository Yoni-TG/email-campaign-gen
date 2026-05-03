import type {
  CampaignType,
  DigestedProduct,
  ShopForAudience,
} from "@/lib/types";

export interface ProductFilterOptions {
  categories: string[];
  campaignType: CampaignType;
  pinnedSkus?: string[];
  /**
   * Operator-selected audience values. When set + non-empty, candidates must
   * have at least one overlap with `audience` in their `shopFor`. Products
   * with empty `shopFor` are dropped (no signal to validate against). When
   * empty / undefined the filter is skipped — audience-agnostic editorials
   * keep the full pool.
   */
  audience?: ShopForAudience[];
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
    audience,
    maxCandidates = DEFAULT_MAX_CANDIDATES,
  } = options;

  const pinnedSet = new Set(pinnedSkus);
  const categorySet = new Set(categories.map((c) => c.toLowerCase()));
  const audienceSet =
    audience && audience.length > 0 ? new Set<string>(audience) : null;

  const filtered = products.filter((p) => {
    if (pinnedSet.has(p.sku)) return false;

    const types = p.productType.map((t) => t.toLowerCase());
    if (!types.some((t) => categorySet.has(t))) return false;

    if (audienceSet) {
      if (p.shopFor.length === 0) return false;
      if (!p.shopFor.some((s) => audienceSet.has(s))) return false;
    }

    if (campaignType === "sale_promo" && !p.isOnSale) return false;

    return true;
  });

  return sortByCampaignType(filtered, campaignType).slice(0, maxCandidates);
}
