"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Campaign, CampaignStatus } from "@/lib/types";

// Polls /api/campaigns/[id] every `intervalMs`. Refreshes the server
// component (so the correct status-view takes over) whenever either:
//   - status leaves the `whileStatuses` list, or
//   - the `error` field changes from its initial value — catches the case
//     where the backend fails mid-generation, keeps status="generating",
//     but stamps an error onto the row. Without the error check the
//     polling view would spin forever and the user never sees Retry.
// A materialised key is used for whileStatuses so callers can pass a
// literal array each render without resetting the interval.
export function useCampaignPoll(
  campaignId: string,
  options: {
    whileStatuses: CampaignStatus[];
    initialError?: string | null;
    intervalMs?: number;
  },
): void {
  const { whileStatuses, initialError = null, intervalMs = 2000 } = options;
  const router = useRouter();
  const statusesKey = whileStatuses.join(",");

  useEffect(() => {
    if (whileStatuses.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}`);
        if (!res.ok) return;
        const campaign = (await res.json()) as Campaign;

        const statusLeft = !whileStatuses.includes(campaign.status);
        const errorChanged = campaign.error !== initialError;

        if (statusLeft || errorChanged) {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // Transient fetch error — keep polling.
      }
    }, intervalMs);

    return () => clearInterval(interval);
    // whileStatuses is intentionally keyed via statusesKey so a fresh literal
    // array each render doesn't reset the interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, statusesKey, initialError, intervalMs, router]);
}
