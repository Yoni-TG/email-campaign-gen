import { NextResponse } from "next/server";
import {
  ensureFeedLoaded,
  getDistinctCategories,
} from "@/modules/products/services/product-feed";

export async function GET() {
  await ensureFeedLoaded();
  return NextResponse.json(getDistinctCategories());
}
