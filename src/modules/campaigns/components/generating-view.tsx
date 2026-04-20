"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaignPoll } from "@/modules/campaigns/hooks/use-campaign-poll";

interface GeneratingViewProps {
  campaignId: string;
  error: string | null;
}

export function GeneratingView({ campaignId, error }: GeneratingViewProps) {
  const router = useRouter();
  // Stop polling once the server transitions away from `generating` OR the
  // error field appears (backend set an error while keeping status stable).
  useCampaignPoll(campaignId, {
    whileStatuses: error ? [] : ["generating"],
    initialError: error,
  });

  const handleRetry = async () => {
    await fetch(`/api/campaigns/${campaignId}/generate`, { method: "POST" });
    router.refresh();
  };

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-destructive">Generation failed: {error}</p>
        <Button onClick={handleRetry}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-12">
      <div className="text-center">
        <p className="mb-2 text-lg font-medium">Generating your campaign…</p>
        <p className="text-sm text-muted-foreground">
          Creating copy and selecting products. Usually 10–20 seconds.
        </p>
      </div>
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
