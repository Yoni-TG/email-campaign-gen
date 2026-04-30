import { describe, expect, it } from "vitest";
import { formatRelativeDate, formatRelativeTime } from "./relative-date";

const NOW = new Date("2026-04-29T12:00:00Z");

describe("formatRelativeDate", () => {
  it("returns 'today' for the same calendar day", () => {
    expect(formatRelativeDate(new Date("2026-04-29T08:00:00Z"), NOW)).toBe(
      "today",
    );
  });

  it("returns 'yesterday' for the previous day", () => {
    expect(formatRelativeDate(new Date("2026-04-28T18:00:00Z"), NOW)).toBe(
      "yesterday",
    );
  });

  it("returns 'tomorrow' for the next day", () => {
    expect(formatRelativeDate(new Date("2026-04-30T08:00:00Z"), NOW)).toBe(
      "tomorrow",
    );
  });

  it("returns 'in Nd' for future dates inside the window", () => {
    expect(formatRelativeDate(new Date("2026-05-04T12:00:00Z"), NOW)).toBe(
      "in 5d",
    );
  });

  it("returns 'Nd ago' for past dates inside the window", () => {
    expect(formatRelativeDate(new Date("2026-04-17T12:00:00Z"), NOW)).toBe(
      "12d ago",
    );
  });

  it("falls back to short date beyond the window", () => {
    expect(formatRelativeDate(new Date("2026-03-15T12:00:00Z"), NOW)).toBe(
      "Mar 15",
    );
  });
});

describe("formatRelativeTime", () => {
  it("returns empty string for null", () => {
    expect(formatRelativeTime(null, NOW)).toBe("");
  });

  it("returns 'just now' under 5 seconds", () => {
    expect(
      formatRelativeTime(new Date("2026-04-29T11:59:58Z"), NOW),
    ).toBe("just now");
  });

  it("returns seconds for 5–59 seconds", () => {
    expect(
      formatRelativeTime(new Date("2026-04-29T11:59:48Z"), NOW),
    ).toBe("12s ago");
  });

  it("returns minutes under an hour", () => {
    expect(
      formatRelativeTime(new Date("2026-04-29T11:57:00Z"), NOW),
    ).toBe("3m ago");
  });

  it("returns hours past an hour", () => {
    expect(
      formatRelativeTime(new Date("2026-04-29T09:00:00Z"), NOW),
    ).toBe("3h ago");
  });
});
