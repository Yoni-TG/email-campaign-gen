import { NextRequest, NextResponse } from "next/server";
import {
  ensureFeedLoaded,
  searchProducts,
} from "@/modules/products/services/product-feed";
import { toProductSearchResult } from "@/modules/products/utils/product-api-shape";

const DEFAULT_LIMIT = 20;

export async function GET(request: NextRequest) {
  await ensureFeedLoaded();

  const query = request.nextUrl.searchParams.get("q") ?? "";
  const limitParam = request.nextUrl.searchParams.get("limit");
  const parsedLimit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? parsedLimit
      : DEFAULT_LIMIT;

  if (!query) return NextResponse.json([]);

  const results = searchProducts(query, limit).map(toProductSearchResult);
  return NextResponse.json(results);
}
