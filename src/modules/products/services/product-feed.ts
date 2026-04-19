import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import type { DigestedProduct, FeedProduct } from "@/lib/types";
import { digestFeed } from "@/modules/products/utils/product-digest";

export type FeedSource = "remote" | "local";

const DEFAULT_LOCAL_PATH = "data/product-feed.fixture.json";

let cachedProducts: DigestedProduct[] = [];
let lastLoadedAt: Date | null = null;
let lastLoadedFrom: FeedSource | null = null;

export function resolveFeedSource(): FeedSource {
  const explicit = process.env.PRODUCT_FEED_SOURCE?.toLowerCase();
  if (explicit === "remote" || explicit === "local") return explicit;
  return process.env.PRODUCT_FEED_URL ? "remote" : "local";
}

async function fetchRemoteFeed(): Promise<FeedProduct[]> {
  const url = process.env.PRODUCT_FEED_URL;
  if (!url) {
    throw new Error(
      "PRODUCT_FEED_URL is not set. Either configure the CDN URL or set " +
        "PRODUCT_FEED_SOURCE=local with PRODUCT_FEED_LOCAL_PATH (see data/README.md).",
    );
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Feed fetch failed: ${response.status} ${response.statusText} (${url})`,
    );
  }
  return (await response.json()) as FeedProduct[];
}

async function readLocalFeed(): Promise<FeedProduct[]> {
  const configured =
    process.env.PRODUCT_FEED_LOCAL_PATH || DEFAULT_LOCAL_PATH;
  const absolutePath = isAbsolute(configured)
    ? configured
    : join(process.cwd(), configured);

  let raw: string;
  try {
    raw = await readFile(absolutePath, "utf-8");
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to read local product feed at "${absolutePath}": ${cause}. ` +
        `Place a copy at data/product-feed.fixture.json or set PRODUCT_FEED_LOCAL_PATH ` +
        `(see data/README.md).`,
    );
  }
  return JSON.parse(raw) as FeedProduct[];
}

/**
 * Fetches + digests + caches. Call once daily or on manual refresh.
 */
export async function refreshFeed(): Promise<DigestedProduct[]> {
  const source = resolveFeedSource();
  const raw =
    source === "remote" ? await fetchRemoteFeed() : await readLocalFeed();

  cachedProducts = digestFeed(raw);
  lastLoadedAt = new Date();
  lastLoadedFrom = source;
  return cachedProducts;
}

export function getCachedProducts(): DigestedProduct[] {
  return cachedProducts;
}

export function getFeedLastLoadedAt(): Date | null {
  return lastLoadedAt;
}

export function getFeedLastLoadedFrom(): FeedSource | null {
  return lastLoadedFrom;
}

/**
 * Ensures the feed is loaded. Call before any product operation.
 */
export async function ensureFeedLoaded(): Promise<void> {
  if (cachedProducts.length === 0) {
    await refreshFeed();
  }
}

export function getDistinctCategories(): string[] {
  const allTypes = new Set<string>();
  for (const product of cachedProducts) {
    for (const type of product.productType) {
      allTypes.add(type);
    }
  }
  return Array.from(allTypes).sort();
}

export function searchProducts(
  query: string,
  limit: number = 20,
): DigestedProduct[] {
  const q = query.toLowerCase();
  return cachedProducts
    .filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export function getProductBySku(sku: string): DigestedProduct | undefined {
  return cachedProducts.find((p) => p.sku === sku);
}
