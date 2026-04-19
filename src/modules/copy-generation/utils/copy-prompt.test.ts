import { describe, it, expect } from "vitest";
import {
  buildCopySystemPrompt,
  buildCopyUserPrompt,
  loadBrandGuide,
  loadFewShotExamples,
} from "@/modules/copy-generation/utils/copy-prompt";
import type { CreativeSeed } from "@/lib/types";

describe("loadBrandGuide", () => {
  it("returns the brand-guide markdown content", () => {
    const guide = loadBrandGuide();
    expect(guide).toContain("Theo Grace");
    expect(guide.length).toBeGreaterThan(500);
  });

  it("memoizes — repeated calls return the same string instance", () => {
    expect(loadBrandGuide()).toBe(loadBrandGuide());
  });
});

describe("loadFewShotExamples", () => {
  it("returns an array of past-campaign archives", () => {
    const examples = loadFewShotExamples();
    expect(Array.isArray(examples)).toBe(true);
    expect(examples.length).toBeGreaterThan(0);
    expect(examples[0]).toHaveProperty("campaign_name");
    expect(examples[0]).toHaveProperty("body_blocks");
    expect(examples[0]).toHaveProperty("subject_variants");
    expect(Array.isArray(examples[0].body_blocks)).toBe(true);
    expect(Array.isArray(examples[0].subject_variants)).toBe(true);
  });
});

describe("buildCopySystemPrompt", () => {
  it("includes brand-guide content", () => {
    const system = buildCopySystemPrompt();
    expect(system).toContain("Theo Grace");
  });

  it("names the output tool and references past examples", () => {
    const system = buildCopySystemPrompt();
    expect(system).toMatch(/generate_campaign_copy/);
    expect(system).toMatch(/past campaign examples|example 1/i);
  });

  it("enumerates the critical rules", () => {
    const system = buildCopySystemPrompt();
    expect(system).toMatch(/no puns|US English|do not sound like AI/i);
  });

  it("is stable across calls (cacheability)", () => {
    expect(buildCopySystemPrompt()).toBe(buildCopySystemPrompt());
  });
});

describe("buildCopyUserPrompt", () => {
  it("includes campaign type, main message, and categories", () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace", "Ring"],
      mainMessage: "Spring collection launch",
      includeSms: false,
    };
    const prompt = buildCopyUserPrompt(seed, "product_launch");
    expect(prompt).toContain("Product Launch");
    expect(prompt).toContain("Spring collection launch");
    expect(prompt).toContain("Necklace");
    expect(prompt).toContain("Ring");
  });

  it("calls out SMS when requested", () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Spring",
      includeSms: true,
    };
    expect(buildCopyUserPrompt(seed, "product_launch")).toMatch(/Include SMS/i);
  });

  it("marks no-SMS explicitly when not requested", () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Spring",
      includeSms: false,
    };
    expect(buildCopyUserPrompt(seed, "product_launch")).toMatch(/No SMS/i);
  });

  it("omits optional fields when absent", () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Spring",
      includeSms: false,
    };
    const prompt = buildCopyUserPrompt(seed, "product_launch");
    expect(prompt).not.toMatch(/Secondary message:/);
    expect(prompt).not.toMatch(/Promo details:/);
    expect(prompt).not.toMatch(/Additional notes:/);
  });

  it("includes optional fields when supplied", () => {
    const seed: CreativeSeed = {
      targetCategories: ["Necklace"],
      mainMessage: "Summer sale",
      secondaryMessage: "30% off",
      promoDetails: "Use code SUMMER",
      additionalNotes: "Keep it bright",
      includeSms: true,
    };
    const prompt = buildCopyUserPrompt(seed, "sale_promo");
    expect(prompt).toMatch(/Secondary message:/);
    expect(prompt).toMatch(/Promo details:/);
    expect(prompt).toMatch(/Additional notes:/);
    expect(prompt).toContain("30% off");
    expect(prompt).toContain("Use code SUMMER");
    expect(prompt).toContain("Keep it bright");
  });
});
