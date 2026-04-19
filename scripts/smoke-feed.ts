#!/usr/bin/env tsx
/**
 * One-off smoke script. Exercises the feed pipeline end-to-end against
 * whatever PRODUCT_FEED_URL / PRODUCT_FEED_SOURCE is in .env.
 *
 * Usage:
 *   npx tsx scripts/smoke-feed.ts
 */
import "dotenv/config";
import {
  refreshFeed,
  getDistinctCategories,
  getFeedLastLoadedFrom,
} from "../src/modules/products/services/product-feed";

async function main() {
  console.log("Refreshing feed...");
  const products = await refreshFeed();

  console.log(`\nLoaded from: ${getFeedLastLoadedFrom()}`);
  console.log(`Digested products (in-stock only): ${products.length}`);

  const categories = getDistinctCategories();
  console.log(`\nDistinct categories (${categories.length}):`);
  for (const c of categories) console.log(`  - ${c}`);

  const sample = products[0];
  if (sample) {
    console.log("\nSample product:");
    console.log(JSON.stringify(sample, null, 2));
  }
}

main().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exitCode = 1;
});
