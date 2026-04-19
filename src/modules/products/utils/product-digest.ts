import type {
  FeedProduct,
  DigestedProduct,
  PriceTier,
  ReviewTier,
  PrimaryLanguage,
} from "@/lib/types";
import { getProductImageUrl } from "@/modules/products/utils/image-url";

const INSCRIPTION_COUNT = /(\d+)\s*Inscription/i;

export function derivePriceTier(priceStr: string): PriceTier {
  const price = parseFloat(priceStr);
  if (Number.isNaN(price)) return "under_50";
  if (price < 50) return "under_50";
  if (price < 150) return "50_150";
  if (price < 500) return "150_500";
  return "500_plus";
}

export function deriveReviewTier(
  countStr: string,
  rateStr: string,
): ReviewTier {
  const count = parseInt(countStr, 10);
  const rate = parseFloat(rateStr);
  if (Number.isNaN(count) || Number.isNaN(rate)) return null;
  if (count > 50 && rate > 4.5) return "highly_reviewed";
  if (count > 10 && rate > 4) return "well_reviewed";
  return null;
}

export function derivePrimaryLanguage(
  collection: string[],
): PrimaryLanguage {
  const tags = collection.map((c) => c.toLowerCase());
  if (tags.includes("arabic")) return "arabic";
  if (tags.includes("non-latin")) return "non_latin";
  if (tags.includes("non-english")) return "non_english";
  return "english";
}

/**
 * Builds a short human-readable summary of the personalization signals for
 * an entry. Reads three sources:
 *
 * - `inscriptions`: strings like "1 Inscription" / "2 Inscriptions". The
 *   max count wins (so a product advertising "1 Inscription, 2 Inscriptions"
 *   is summarized as "2 inscriptions").
 * - `material`: substring match for "birthstone" adds "birthstone".
 * - `hasPersonalization`: when the feed's generic flag is "YES" but nothing
 *   more specific was detected, falls back to "personalizable".
 *
 * Returns null when there are no signals.
 */
export function derivePersonalizationSummary(
  inscriptions: string[],
  material: string[],
  hasPersonalization: string | undefined,
): string | null {
  const parts: string[] = [];

  if (inscriptions.length > 0) {
    let maxCount = 0;
    for (const entry of inscriptions) {
      const match = entry.match(INSCRIPTION_COUNT);
      if (match) {
        const count = parseInt(match[1], 10);
        if (!Number.isNaN(count) && count > maxCount) maxCount = count;
      }
    }
    if (maxCount > 0) {
      parts.push(`${maxCount} inscription${maxCount > 1 ? "s" : ""}`);
    }
  }

  if (material.some((m) => m.toLowerCase().includes("birthstone"))) {
    parts.push("birthstone");
  }

  if (parts.length === 0 && hasPersonalization?.toUpperCase() === "YES") {
    parts.push("personalizable");
  }

  return parts.length === 0 ? null : parts.join(" + ");
}

/**
 * Transforms a raw feed product into a DigestedProduct.
 * Returns null when the product should be filtered out (inactive or OOS).
 */
export function digestProduct(raw: FeedProduct): DigestedProduct | null {
  if (raw.stock_status !== "In Stock") return null;
  if (raw.is_active && raw.is_active.toLowerCase() !== "yes") return null;

  const rawCollection = raw.collection ?? [];
  const isClearance = rawCollection.some(
    (c) => c.toLowerCase() === "clearance",
  );
  const collection = rawCollection.filter(
    (c) => c.toLowerCase() !== "clearance",
  );

  const price = parseFloat(raw.price);
  const salePrice = parseFloat(raw.sale_price);
  const isOnSale =
    !Number.isNaN(price) && !Number.isNaN(salePrice) && salePrice < price;

  const imageUrl =
    raw.image_url || getProductImageUrl(raw.link) || "";

  return {
    sku: raw.sku,
    name: raw.name,
    description: "",
    productType: raw.product_type ?? [],
    shopFor: raw.shop_for ?? [],
    occasion: raw.occasion ?? [],
    collection,
    material: raw.material ?? [],
    metalColor: raw.metal_color ?? "",
    price: raw.price,
    salePrice: raw.sale_price,
    currency: raw.currency,
    link: raw.link,
    imageUrl,
    reviewCount: raw.review_count,
    reviewRate: raw.review_rate,

    priceTier: derivePriceTier(raw.price),
    isOnSale,
    isClearance,
    primaryLanguage: derivePrimaryLanguage(rawCollection),
    reviewTier: deriveReviewTier(raw.review_count, raw.review_rate),
    personalizationSummary: derivePersonalizationSummary(
      raw.num_of_inscriptions ?? [],
      raw.material ?? [],
      raw.has_perosnalization,
    ),
  };
}

export function digestFeed(raw: FeedProduct[]): DigestedProduct[] {
  const result: DigestedProduct[] = [];
  for (const p of raw) {
    const digested = digestProduct(p);
    if (digested) result.push(digested);
  }
  return result;
}
