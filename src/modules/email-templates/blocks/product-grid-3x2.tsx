import { ProductGridInternal } from "./product-grid";
import type { ProductGridProps } from "./types";

export function ProductGrid3x2({ products, editTargets }: ProductGridProps) {
  return (
    <ProductGridInternal
      products={products}
      columns={3}
      rows={2}
      editable={Boolean(editTargets?.products)}
    />
  );
}
