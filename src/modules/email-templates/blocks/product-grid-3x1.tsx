import { ProductGridInternal } from "./product-grid";
import type { ProductGridProps } from "./types";

// 3 cells in a single row. Designed to sit under a labelled section
// (e.g. "JEWELLERY FOR FAMILY TIME / HER STORY / EVERY DAY") and stack
// three of these per skeleton, each with a different `offset`, to
// produce three distinct labelled tiers from one approvedProducts list.
export function ProductGrid3x1({
  products,
  offset = 0,
  editTargets,
}: ProductGridProps) {
  return (
    <ProductGridInternal
      products={products}
      columns={3}
      rows={1}
      offset={offset}
      editable={Boolean(editTargets?.products)}
    />
  );
}
