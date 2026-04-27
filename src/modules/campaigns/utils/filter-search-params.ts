import { CAMPAIGN_STATUSES, CAMPAIGN_TYPES } from "@/lib/types";
import type { CampaignStatus, CampaignType } from "@/lib/types";
import type { ListScope } from "./campaign-persistence";
import {
  CAMPAIGN_SORTS,
  DEFAULT_FILTERS,
  type CampaignFilters,
  type CampaignSort,
} from "./filter-campaigns";

const VALID_SCOPES: ListScope[] = ["active", "archived"];

export interface ParsedListQuery {
  scope: ListScope;
  filters: CampaignFilters;
}

// Parse Next.js `searchParams` into typed list state. Anything unknown
// or malformed falls back to defaults — the URL is just a hint.
export function parseListSearchParams(
  raw: Record<string, string | string[] | undefined>,
): ParsedListQuery {
  return {
    scope: parseScope(raw.scope),
    filters: {
      search: parseString(raw.q),
      type: parseEnum(raw.type, CAMPAIGN_TYPES) ?? "all",
      status: parseEnum(raw.status, CAMPAIGN_STATUSES) ?? "all",
      sort: parseEnum(raw.sort, CAMPAIGN_SORTS) ?? DEFAULT_FILTERS.sort,
    },
  };
}

// Serialize the inverse — used by the client filter bar to push the
// next URL. Only non-default values land in the query string so URLs
// stay clean.
export function serializeListQuery(query: ParsedListQuery): string {
  const params = new URLSearchParams();
  if (query.scope !== "active") params.set("scope", query.scope);
  if (query.filters.search) params.set("q", query.filters.search);
  if (query.filters.type !== "all") params.set("type", query.filters.type);
  if (query.filters.status !== "all")
    params.set("status", query.filters.status);
  if (query.filters.sort !== DEFAULT_FILTERS.sort)
    params.set("sort", query.filters.sort);
  return params.toString();
}

function parseString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  return "";
}

function parseScope(v: string | string[] | undefined): ListScope {
  return typeof v === "string" && (VALID_SCOPES as string[]).includes(v)
    ? (v as ListScope)
    : "active";
}

function parseEnum<T extends string>(
  v: string | string[] | undefined,
  valid: readonly T[],
): T | null {
  if (typeof v !== "string") return null;
  return (valid as readonly string[]).includes(v) ? (v as T) : null;
}

// Re-exports for convenience at call sites.
export type { CampaignFilters, CampaignSort };
export type { CampaignStatus, CampaignType };
