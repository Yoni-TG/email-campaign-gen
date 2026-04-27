import { NextResponse } from "next/server";
import {
  KlaviyoApiError,
  KlaviyoConfigError,
} from "@/modules/klaviyo/services/klaviyo-client";
import { syncKlaviyoMetrics } from "@/modules/klaviyo/services/metric-sync";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const expected = process.env.KLAVIYO_SYNC_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "KLAVIYO_SYNC_SECRET is not configured." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncKlaviyoMetrics();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof KlaviyoConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof KlaviyoApiError) {
      return NextResponse.json(
        { error: err.message, status: err.status },
        { status: 502 },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
