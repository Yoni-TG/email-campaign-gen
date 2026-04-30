import { describe, it, expect } from "vitest";
import {
  SMS_HARD_CAP,
  smsExceedsCap,
  smsRenderedLength,
} from "./sms";

describe("smsRenderedLength", () => {
  it("returns 0 for nullish input", () => {
    expect(smsRenderedLength(null)).toBe(0);
    expect(smsRenderedLength(undefined)).toBe(0);
    expect(smsRenderedLength("")).toBe(0);
  });

  it("matches raw length when there's no {link}", () => {
    expect(smsRenderedLength("Hello world")).toBe(11);
  });

  it("expands {link} to its reserved width", () => {
    // "Shop {link}" — raw length 11, {link} = 6 → rendered = 11 + 18 = 29
    expect(smsRenderedLength("Shop {link}")).toBe(29);
  });

  it("counts every occurrence of {link}", () => {
    expect(smsRenderedLength("{link} and {link}")).toBe(
      "{link} and {link}".length + 2 * 18,
    );
  });
});

describe("smsExceedsCap", () => {
  it("returns false at exactly the hard cap", () => {
    const padding = "x".repeat(SMS_HARD_CAP);
    expect(smsExceedsCap(padding)).toBe(false);
  });

  it("counts {link} expansion when checking the cap", () => {
    // 113 chars + {link} = 113 + 24 = 137 rendered → over the 130 cap.
    const sms = "x".repeat(113) + " {link}";
    expect(smsExceedsCap(sms)).toBe(true);
  });
});
