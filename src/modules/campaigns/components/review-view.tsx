"use client";

import type { Campaign } from "@/lib/types";

// Replaced in phase 13.
export function ReviewView({ campaign }: { campaign: Campaign }) {
  return (
    <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
      Review UI for <span className="font-medium">{campaign.name}</span> — TODO (phase 13).
    </div>
  );
}
