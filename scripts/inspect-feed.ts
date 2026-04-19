#!/usr/bin/env tsx
/**
 * Peek at the raw feed structure to confirm field names and values.
 */
import "dotenv/config";

async function main() {
  const url = process.env.PRODUCT_FEED_URL!;
  console.log(`Fetching ${url}`);
  const res = await fetch(url);
  console.log(`status: ${res.status}`);
  const data: unknown = await res.json();

  if (!Array.isArray(data)) {
    console.log("Top-level is not an array. Shape preview:");
    console.log(JSON.stringify(data, null, 2).slice(0, 2000));
    return;
  }

  console.log(`\nArray length: ${data.length}`);
  const first = data[0] as Record<string, unknown>;
  console.log("\nKeys on first entry:");
  console.log(Object.keys(first).sort());

  console.log("\nFirst entry (truncated):");
  console.log(JSON.stringify(first, null, 2).slice(0, 3000));

  // Count by stock-status values if available
  const stockField = "Out of Stock (Stock/OOS)";
  const counts: Record<string, number> = {};
  for (const p of data as Array<Record<string, unknown>>) {
    const v = String(p[stockField] ?? "<missing>");
    counts[v] = (counts[v] || 0) + 1;
  }
  console.log(`\n"${stockField}" value distribution:`);
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${JSON.stringify(k)}: ${v}`);
  }
}

main().catch((err) => {
  console.error("Inspection failed:", err);
  process.exitCode = 1;
});
