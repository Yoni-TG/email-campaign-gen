"use client";

import type { Campaign } from "@/lib/types";

// Replaced in phase 15.
export function CompletedView({ campaign }: { campaign: Campaign }) {
  return (
    <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
      Completed view for <span className="font-medium">{campaign.name}</span> — TODO (phase 15).
    </div>
  );
}
