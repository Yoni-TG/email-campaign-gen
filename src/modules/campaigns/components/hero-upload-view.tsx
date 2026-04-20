"use client";

import type { Campaign } from "@/lib/types";

// Replaced in phase 14.
export function HeroUploadView({ campaign }: { campaign: Campaign }) {
  return (
    <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
      Hero upload for <span className="font-medium">{campaign.name}</span> — TODO (phase 14).
    </div>
  );
}
