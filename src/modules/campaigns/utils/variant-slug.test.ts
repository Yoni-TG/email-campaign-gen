import { describe, expect, it } from "vitest";
import { variantSlug } from "./variant-slug";

describe("variantSlug", () => {
  it("replaces a single slash with a double underscore", () => {
    expect(variantSlug("sale-promo/mystery-tiles")).toBe(
      "sale-promo__mystery-tiles",
    );
  });

  it("replaces every slash, not just the first", () => {
    expect(variantSlug("a/b/c")).toBe("a__b__c");
  });

  it("passes through ids with no slash unchanged", () => {
    expect(variantSlug("plain-id")).toBe("plain-id");
  });

  it("preserves underscores already in the id", () => {
    expect(variantSlug("a_b/c_d")).toBe("a_b__c_d");
  });
});
