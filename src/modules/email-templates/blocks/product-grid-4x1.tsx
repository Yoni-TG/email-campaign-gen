import * as React from "react";
import { ProductGridInternal } from "./product-grid";
import type { ProductGridProps } from "./types";

// 4 cells in a single row — used under a section label like
// "JEWELLERY FOR FAMILY TIME" to surface a tight tier of picks.
export function ProductGrid4x1({ products, editTargets }: ProductGridProps) {
  return (
    <ProductGridInternal
      products={products}
      columns={4}
      rows={1}
      editable={Boolean(editTargets?.products)}
    />
  );
}
