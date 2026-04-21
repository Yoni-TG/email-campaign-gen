import { describe, expect, it } from "vitest";
import { initApprovedCopy } from "./copy-init";
import type { GeneratedCopy } from "@/lib/types";

const base: GeneratedCopy = {
  campaign_id: "cmp_1",
  free_top_text: "Happy New Year",
  body_blocks: [
    { title: "For Mom", description: "Pieces she'll love", cta: "Shop Now" },
    { title: null, description: "Extra", cta: null },
  ],
  subject_variants: [
    { subject: "A", preheader: "pa" },
    { subject: "B", preheader: "pb" },
  ],
  sms: "Hi {link}",
  nicky_quote: { quote: "I love it.", response: "Thanks Nicky!" },
};

describe("initApprovedCopy", () => {
  it("picks the first subject variant", () => {
    const out = initApprovedCopy(base);
    expect(out.subject_variant).toEqual({ subject: "A", preheader: "pa" });
  });

  it("copies scalar fields 1:1", () => {
    const out = initApprovedCopy(base);
    expect(out.campaign_id).toBe("cmp_1");
    expect(out.free_top_text).toBe("Happy New Year");
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

  it("clones the nicky_quote when present", () => {
    const out = initApprovedCopy(base);
    expect(out.nicky_quote).toEqual({
      quote: "I love it.",
      response: "Thanks Nicky!",
    });
    out.nicky_quote!.quote = "Edited";
    expect(base.nicky_quote!.quote).toBe("I love it.");
  });

  it("preserves null nicky_quote", () => {
    const out = initApprovedCopy({ ...base, nicky_quote: null });
    expect(out.nicky_quote).toBeNull();
  });

  it("throws if there are no subject variants", () => {
    expect(() =>
      initApprovedCopy({ ...base, subject_variants: [] }),
    ).toThrowError(/no subject_variants/);
  });
});
