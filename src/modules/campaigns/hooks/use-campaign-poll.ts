"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Campaign, CampaignStatus } from "@/lib/types";

// Polls /api/campaigns/[id] every `intervalMs`. Once the status leaves the
// provided `while` list, it calls router.refresh() so the server component
// re-renders with the new status and the right view takes over.
export function useCampaignPoll(
  campaignId: string,
  options: { whileStatuses: CampaignStatus[]; intervalMs?: number },
): void {
  const { whileStatuses, intervalMs = 2000 } = options;
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`);
        if (!res.ok) return;
        const campaign = (await res.json()) as Campaign;
        if (!whileStatuses.includes(campaign.status)) {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // Transient fetch error — keep polling.
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [campaignId, whileStatuses, intervalMs, router]);
}
