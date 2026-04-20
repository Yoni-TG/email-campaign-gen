import type { ProductSnapshot } from "@/lib/types";

// A product is "on sale" when it has a salePrice AND it differs from the
// list price. The feed stores "no sale" as an empty string rather than
// null, so an empty-string check is enough.
export function isOnSale(
  product: Pick<ProductSnapshot, "price" | "salePrice">,
): boolean {
  return Boolean(product.salePrice) && product.salePrice !== product.price;
}

// Rendered everywhere the UI shows a single price (cards, rows, summaries).
// Keeps currency placement consistent so "USD 120" never appears next to "$120".
export function formatPrice(amount: string, currency: string): string {
  return `${currency} ${amount}`;
}
