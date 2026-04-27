import { describe, expect, it } from "vitest";
import {
  parseListSearchParams,
  serializeListQuery,
} from "./filter-search-params";

describe("parseListSearchParams", () => {
  it("returns defaults on empty input", () => {
    const out = parseListSearchParams({});
    expect(out).toEqual({
      scope: "active",
      filters: {
        search: "",
        type: "all",
        status: "all",
        sort: "newest",
      },
    });
  });

  it("parses valid params", () => {
    const out = parseListSearchParams({
      scope: "archived",
      q: "spring",
      type: "sale_promo",
      status: "completed",
      sort: "name",
    });
    expect(out.scope).toBe("archived");
    expect(out.filters).toEqual({
      search: "spring",
      type: "sale_promo",
      status: "completed",
      sort: "name",
    });
  });

  it("falls back to defaults for invalid enum values", () => {
    const out = parseListSearchParams({
      scope: "trash",
      type: "made_up_type",
      status: "made_up_status",
      sort: "random",
    });
    expect(out.scope).toBe("active");
    expect(out.filters.type).toBe("all");
    expect(out.filters.status).toBe("all");
    expect(out.filters.sort).toBe("newest");
  });

  it("ignores array params", () => {
    const out = parseListSearchParams({ q: ["a", "b"], type: ["x"] });
    expect(out.filters.search).toBe("");
    expect(out.filters.type).toBe("all");
  });
});

describe("serializeListQuery", () => {
  it("omits defaults for clean URLs", () => {
    expect(
      serializeListQuery({
        scope: "active",
        filters: {
          search: "",
          type: "all",
          status: "all",
          sort: "newest",
        },
      }),
    ).toBe("");
  });

  it("emits only the non-default keys", () => {
    const qs = serializeListQuery({
      scope: "archived",
      filters: {
        search: "spring",
        type: "sale_promo",
        status: "all",
        sort: "name",
      },
    });
    const params = new URLSearchParams(qs);
    expect(params.get("scope")).toBe("archived");
    expect(params.get("q")).toBe("spring");
    expect(params.get("type")).toBe("sale_promo");
    expect(params.get("status")).toBeNull();
    expect(params.get("sort")).toBe("name");
  });
});
