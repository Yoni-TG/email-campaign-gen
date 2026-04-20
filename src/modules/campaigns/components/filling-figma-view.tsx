"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaignPoll } from "@/modules/campaigns/hooks/use-campaign-poll";
import type { Campaign } from "@/lib/types";

export function FillingFigmaView({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  useCampaignPoll(campaign.id, {
    whileStatuses: campaign.error ? [] : ["filling_figma"],
  });

  const handleRetry = async () => {
    await fetch(`/api/campaigns/${campaign.id}/fill-figma`, { method: "POST" });
    router.refresh();
  };

  if (campaign.error) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-destructive">
          Figma fill failed: {campaign.error}
        </p>
        <Button onClick={handleRetry}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="py-12 text-center">
      <p className="mb-2 text-lg font-medium">Filling Figma templates…</p>
      <p className="mb-6 text-sm text-muted-foreground">
        Populating layout variants with your approved content.
      </p>
      <div className="flex justify-center gap-4">
        <Skeleton className="h-48 w-32 rounded" />
        <Skeleton className="h-48 w-32 rounded" />
        <Skeleton className="h-48 w-32 rounded" />
      </div>
    </div>
  );
}
