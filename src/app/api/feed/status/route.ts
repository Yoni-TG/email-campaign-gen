import { NextResponse } from "next/server";
import {
  FEED_TTL_MS,
  getCachedProducts,
  getFeedExpiresAt,
  getFeedLastLoadedAt,
  getFeedLastLoadedFrom,
  resolveFeedSource,
} from "@/modules/products/services/product-feed";

export async function GET() {
  const lastLoadedAt = getFeedLastLoadedAt();
  const expiresAt = getFeedExpiresAt();

  return NextResponse.json({
    lastLoadedAt: lastLoadedAt ? lastLoadedAt.toISOString() : null,
    lastLoadedFrom: getFeedLastLoadedFrom(),
    productCount: getCachedProducts().length,
    source: resolveFeedSource(),
    ttlMs: FEED_TTL_MS,
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
  });
}
