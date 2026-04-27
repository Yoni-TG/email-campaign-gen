import type { BlockType, SkeletonManifest } from "../types";

// How many products each grid block surfaces. A skeleton's effective
// capacity is the *max* across its grid blocks (not the sum) — multiple
// grids in one skeleton typically bind to the same `products` array and
// just paint a subset of the same first N items, so the visible distinct
// product count is bounded by the largest grid in the layout.

const GRID_CAPACITY: Partial<Record<BlockType, number>> = {
  product_grid_2x2: 4,
  product_grid_3x2: 6,
  product_grid_4x1: 4,
  product_grid_magazine: 6,
};

export function maxProductsRendered(skeleton: SkeletonManifest): number {
  let max = 0;
  for (const block of skeleton.blocks) {
    const cap = GRID_CAPACITY[block.type];
    if (cap !== undefined && cap > max) max = cap;
  }
  return max;
}
