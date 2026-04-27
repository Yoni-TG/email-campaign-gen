"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaignPoll } from "@/modules/campaigns/hooks/use-campaign-poll";
import type { Campaign } from "@/lib/types";

// rendering_final loading view. Auto-kicks /render-final on mount so the
// transition isn't stuck waiting for an external trigger. Polls for the
// completed transition.
export function RenderingFinalView({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const kickedOff = useRef(false);

  useCampaignPoll(campaign.id, {
    whileStatuses: campaign.error ? [] : ["rendering_final"],
    initialError: campaign.error,
  });

  useEffect(() => {
    if (kickedOff.current || campaign.error) return;
    kickedOff.current = true;
    void fetch(`/api/campaigns/${campaign.id}/render-final`, { method: "POST" });
  }, [campaign.id, campaign.error]);

  const handleRetry = async () => {
    await fetch(`/api/campaigns/${campaign.id}/render-final`, { method: "POST" });
    router.refresh();
  };

  if (campaign.error) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-destructive">
          Final render failed: {campaign.error}
        </p>
        <Button onClick={handleRetry}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <p className="mb-2 text-lg font-medium">Rendering final email…</p>
      <p className="mb-6 text-sm text-muted-foreground">
        Combining your assets into the chosen layout.
      </p>
      <Skeleton className="mx-auto h-48 w-64 rounded" />
    </div>
  );
}
