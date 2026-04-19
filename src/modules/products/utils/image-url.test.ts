import { describe, it, expect } from "vitest";
import {
  getProductImageUrl,
  extractSlugFromLink,
} from "@/modules/products/utils/image-url";

describe("extractSlugFromLink", () => {
  it("extracts slug from standard product URL", () => {
    expect(
      extractSlugFromLink(
        "https://www.theograce.com/products/script-name-ring-in-18k-rose-gold-plating",
      ),
    ).toBe("script-name-ring-in-18k-rose-gold-plating");
  });

  it("handles URLs with trailing slash", () => {
    expect(
      extractSlugFromLink("https://www.theograce.com/products/heart-necklace/"),
    ).toBe("heart-necklace");
  });

  it("handles URLs with query params", () => {
    expect(
      extractSlugFromLink(
        "https://www.theograce.com/products/heart-necklace?variant=123",
      ),
    ).toBe("heart-necklace");
  });

  it("handles URLs with hash fragments", () => {
    expect(
      extractSlugFromLink(
        "https://www.theograce.com/products/heart-necklace#reviews",
      ),
    ).toBe("heart-necklace");
  });

  it("handles URLs without www subdomain", () => {
    expect(
      extractSlugFromLink("https://theograce.com/products/heart-necklace"),
    ).toBe("heart-necklace");
  });

  it("returns null for non-product URLs", () => {
    expect(extractSlugFromLink("https://www.theograce.com/about")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(extractSlugFromLink("")).toBeNull();
  });

  it("returns null for unrelated domains", () => {
    expect(
      extractSlugFromLink("https://example.com/products/heart-necklace"),
    ).toBeNull();
  });
});

describe("getProductImageUrl", () => {
  it("builds CDN URL from product link with default image number", () => {
    expect(
      getProductImageUrl(
        "https://www.theograce.com/products/script-name-ring-in-18k-rose-gold-plating",
      ),
    ).toBe(
      "https://cdn.theograce.com/digital-asset/product/script-name-ring-in-18k-rose-gold-plating-1.jpg?w=750",
    );
  });

  it("builds CDN URL with custom image number", () => {
    expect(
      getProductImageUrl(
        "https://www.theograce.com/products/heart-necklace",
        2,
      ),
    ).toBe(
      "https://cdn.theograce.com/digital-asset/product/heart-necklace-2.jpg?w=750",
    );
  });

  it("respects trailing slashes and query params", () => {
    expect(
      getProductImageUrl(
        "https://www.theograce.com/products/heart-necklace/?variant=123",
        3,
      ),
    ).toBe(
      "https://cdn.theograce.com/digital-asset/product/heart-necklace-3.jpg?w=750",
    );
  });

  it("returns null for non-product URLs", () => {
    expect(getProductImageUrl("https://www.theograce.com/about")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(getProductImageUrl("")).toBeNull();
  });
});
