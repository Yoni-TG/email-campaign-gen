"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaignPoll } from "@/modules/campaigns/hooks/use-campaign-poll";
import type { Campaign } from "@/lib/types";

// Polls during the rendering_candidates phase. Auto-kicks the
// /render-candidates endpoint on mount so the operator doesn't see a stuck
// "rendering…" without something happening server-side. Step 3 will rebuild
// the loading visuals around the iframes-side-by-side variant selector.
export function RenderingCandidatesView({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const kickedOff = useRef(false);

  useCampaignPoll(campaign.id, {
    whileStatuses: campaign.error ? [] : ["rendering_candidates"],
    initialError: campaign.error,
  });

  useEffect(() => {
    if (kickedOff.current || campaign.error) return;
    kickedOff.current = true;
    void fetch(`/api/campaigns/${campaign.id}/render-candidates`, {
      method: "POST",
    });
  }, [campaign.id, campaign.error]);

  const handleRetry = async () => {
    await fetch(`/api/campaigns/${campaign.id}/render-candidates`, {
      method: "POST",
    });
    router.refresh();
  };

  if (campaign.error) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-destructive">
          Candidate render failed: {campaign.error}
        </p>
        <Button onClick={handleRetry}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <p className="mb-2 text-lg font-medium">Building 3 candidate layouts…</p>
      <p className="mb-6 text-sm text-muted-foreground">
        Pouring your approved copy and products into matching skeletons.
      </p>
      <div className="flex justify-center gap-4">
        <Skeleton className="h-48 w-32 rounded" />
        <Skeleton className="h-48 w-32 rounded" />
        <Skeleton className="h-48 w-32 rounded" />
      </div>
    </div>
  );
}
