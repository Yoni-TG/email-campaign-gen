import * as React from "react";
import { ProductGridInternal } from "./product-grid";
import type { ProductGridProps } from "./types";

export function ProductGrid2x2({ products }: ProductGridProps) {
  return <ProductGridInternal products={products} columns={2} />;
}
