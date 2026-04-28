import { NextResponse } from "next/server";
import {
  getFeedLastLoadedFrom,
  refreshFeed,
} from "@/modules/products/services/product-feed";

export async function POST() {
  try {
    const products = await refreshFeed();
    return NextResponse.json({
      productCount: products.length,
      loadedAt: new Date().toISOString(),
      source: getFeedLastLoadedFrom(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `Feed refresh failed: ${message}` },
      { status: 502 },
    );
  }
}
