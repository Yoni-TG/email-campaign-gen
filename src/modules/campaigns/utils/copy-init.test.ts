import { describe, expect, it } from "vitest";
import { initApprovedCopy } from "./copy-init";
import type { GeneratedCopy } from "@/lib/types";

const base: GeneratedCopy = {
  campaign_id: "cmp_1",
  free_top_text: "TIMELESS",
  body_blocks: [
    { title: "For Mom", description: "Pieces she'll love", cta: "Shop Now" },
    { title: null, description: "Extra", cta: null },
  ],
  subject_variants: [
    { subject: "A", preheader: "pa" },
    { subject: "B", preheader: "pb" },
  ],
  sms: "Hi {link}",
};

describe("initApprovedCopy", () => {
  it("picks the first subject variant", () => {
    const out = initApprovedCopy(base);
    expect(out.subject_variant).toEqual({ subject: "A", preheader: "pa" });
  });

  it("copies fields 1:1", () => {
    const out = initApprovedCopy(base);
    expect(out.campaign_id).toBe("cmp_1");
    expect(out.free_top_text).toBe("TIMELESS");
    expect(out.sms).toBe("Hi {link}");
  });

  it("deep-clones body blocks so edits don't mutate the source", () => {
    const out = initApprovedCopy(base);
    out.body_blocks[0].title = "Edited";
    expect(base.body_blocks[0].title).toBe("For Mom");
  });

  it("clones the chosen subject variant", () => {
    const out = initApprovedCopy(base);
    out.subject_variant.subject = "Edited";
    expect(base.subject_variants[0].subject).toBe("A");
  });

  it("throws if there are no subject variants", () => {
    expect(() =>
      initApprovedCopy({ ...base, subject_variants: [] }),
    ).toThrowError(/no subject_variants/);
  });
});
