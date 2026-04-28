// Curated category map. The product feed exposes 28 raw `product_type`
// values; many are noise ("Virtual", "Ornament MYKA") or near-duplicates
// ("Earring" vs "Earrings" vs "Earring - Hoop") that exist only because
// the supplier system never enforced a canonical taxonomy.
//
// Applied at digest time (see product-digest.ts) so every downstream
// reader — chip list, filter, rerank prompt, product snapshots — sees
// the same curated values. Pure, fixture-tested.
//
// Brand-curated as a first pass; refine via the Phase I task in v2 plan.

// Drop entirely. Useless for email-campaign targeting:
//   - Virtual: digital / non-physical SKUs.
//   - Ornament MYKA: legacy supplier-branded category, no live products.
const CATEGORY_DENYLIST = new Set<string>([
  "Virtual",
  "Ornament MYKA",
]);

// Raw → canonical. Folds duplicates and sub-types into a parent chip.
// Kept INTENTIONALLY separate (despite naming overlap):
//   - "Name Necklace" stays distinct from "Necklace" — personalized
//     name necklaces are a Theo Grace flagship line, worth its own chip.
const CATEGORY_SYNONYMS: Record<string, string> = {
  Accessory: "Accessories",
  Earring: "Earrings",
  "Earring - Hoop": "Earrings",
  "Earring - Stud": "Earrings",
  "Bracelet - Bangle": "Bracelet",
  "Ring - Promise Ring": "Ring",
  "Ring - Stackable": "Ring",
  "Vertical Necklace": "Necklace",
  "Thick Name Necklace": "Name Necklace",
};

// Applies the denylist + synonym map and dedupes. Order is preserved
// against the canonical-name first occurrence so the final productType
// array stays stable across digests.
export function canonicalizeCategories(rawTypes: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of rawTypes) {
    if (CATEGORY_DENYLIST.has(raw)) continue;
    const canonical = CATEGORY_SYNONYMS[raw] ?? raw;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    out.push(canonical);
  }
  return out;
}
