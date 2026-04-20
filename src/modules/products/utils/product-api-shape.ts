import type { DigestedProduct } from "@/lib/types";

// Lighter shape returned by the /api/products search endpoint. Picks only the
// fields the frontend needs for autocomplete / pinning; full DigestedProduct
// stays server-side.
export interface ProductSearchResult {
  sku: string;
  name: string;
  imageUrl: string;
  price: string;
  salePrice: string;
  currency: string;
  link: string;
  productType: string[];
}

export function toProductSearchResult(
  product: DigestedProduct,
): ProductSearchResult {
  return {
    sku: product.sku,
    name: product.name,
    imageUrl: product.imageUrl,
    price: product.price,
    salePrice: product.salePrice,
    currency: product.currency,
    link: product.link,
    productType: product.productType,
  };
}
