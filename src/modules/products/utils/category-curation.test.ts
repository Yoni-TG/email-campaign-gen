import { describe, expect, it } from "vitest";
import { canonicalizeCategories } from "./category-curation";

describe("canonicalizeCategories", () => {
  it("passes through categories with no rule untouched", () => {
    expect(canonicalizeCategories(["Anklet", "Charm"])).toEqual([
      "Anklet",
      "Charm",
    ]);
  });

  it("drops denylisted categories", () => {
    expect(canonicalizeCategories(["Necklace", "Virtual"])).toEqual([
      "Necklace",
    ]);
    expect(canonicalizeCategories(["Ornament MYKA", "Bracelet"])).toEqual([
      "Bracelet",
    ]);
  });

  it("collapses Earring variants into Earrings", () => {
    expect(
      canonicalizeCategories(["Earring", "Earring - Hoop", "Earring - Stud"]),
    ).toEqual(["Earrings"]);
  });

  it("dedupes when raw + canonical both appear", () => {
    expect(canonicalizeCategories(["Earring", "Earrings"])).toEqual([
      "Earrings",
    ]);
  });

  it("folds Ring sub-types into Ring", () => {
    expect(
      canonicalizeCategories([
        "Ring",
        "Ring - Promise Ring",
        "Ring - Stackable",
      ]),
    ).toEqual(["Ring"]);
  });

  it("keeps Name Necklace separate from Necklace", () => {
    expect(
      canonicalizeCategories(["Necklace", "Vertical Necklace"]),
    ).toEqual(["Necklace"]);
    expect(
      canonicalizeCategories([
        "Name Necklace",
        "Thick Name Necklace",
        "Necklace",
        "Vertical Necklace",
      ]),
    ).toEqual(["Name Necklace", "Necklace"]);
  });

  it("preserves order of first canonical occurrence", () => {
    expect(
      canonicalizeCategories([
        "Bracelet - Bangle",
        "Anklet",
        "Bracelet",
        "Earring",
      ]),
    ).toEqual(["Bracelet", "Anklet", "Earrings"]);
  });

  it("handles the full live category list (28 → 17)", () => {
    const live = [
      "Accessories",
      "Accessory",
      "Anklet",
      "Bead",
      "Bracelet",
      "Bracelet - Bangle",
      "Brooch",
      "Chain",
      "Chain Extender",
      "Charm",
      "Cufflink",
      "Earring",
      "Earring - Hoop",
      "Earring - Stud",
      "Earrings",
      "Glasses Chain",
      "Keychain",
      "Men - Dog Tag",
      "Name Necklace",
      "Necklace",
      "Ornament MYKA",
      "Ring",
      "Ring - Promise Ring",
      "Ring - Stackable",
      "Set",
      "Thick Name Necklace",
      "Vertical Necklace",
      "Virtual",
    ];
    const out = canonicalizeCategories(live);
    expect(out).toHaveLength(17);
    expect(out).toContain("Earrings");
    expect(out).not.toContain("Earring");
    expect(out).not.toContain("Earring - Hoop");
    expect(out).not.toContain("Virtual");
    expect(out).not.toContain("Ornament MYKA");
    expect(out).toContain("Name Necklace");
    expect(out).toContain("Necklace");
  });

  it("returns [] for an empty input", () => {
    expect(canonicalizeCategories([])).toEqual([]);
  });
});
