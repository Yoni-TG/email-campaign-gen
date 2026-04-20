import type { DigestedProduct, ProductSnapshot } from "@/lib/types";

// Converts a digested feed product into the ProductSnapshot stored on campaign
// rows. Centralized here so the API route, the review-add flow, and the
// product-selection service all produce the same shape.
export function toProductSnapshot(product: DigestedProduct): ProductSnapshot {
  return {
    sku: product.sku,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    salePrice: product.salePrice,
    currency: product.currency,
    link: product.link,
    productType: product.productType,
    priceTier: product.priceTier,
    isOnSale: product.isOnSale,
    reviewTier: product.reviewTier,
    personalizationSummary: product.personalizationSummary,
  };
}
