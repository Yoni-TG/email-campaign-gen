"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useCampaignPoll } from "@/modules/campaigns/hooks/use-campaign-poll";

interface Props {
  campaignId: string;
  error: string | null;
}

// Wizard-styled wait state for the brief moment between Step 4's
// uploadAll and the final render landing. Polls the campaign row;
// router.refresh fires once status leaves `rendering_final`, which
// makes the parent server component re-fetch and switch to the full
// editor. Also auto-kicks /render-final defensively in case the
// upload-side fire-and-forget didn't go through.
export function DesignPendingView({ campaignId, error }: Props) {
  const kickedOff = useRef(false);

  useCampaignPoll(campaignId, {
    whileStatuses: error ? [] : ["rendering_final"],
    initialError: error,
  });

  useEffect(() => {
    if (kickedOff.current || error) return;
    kickedOff.current = true;
    void fetch(`/api/campaigns/${campaignId}/render-final`, { method: "POST" });
  }, [campaignId, error]);

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <p className="text-sm text-destructive">Final render failed: {error}</p>
        <button
          type="button"
          onClick={() => {
            void fetch(`/api/campaigns/${campaignId}/render-final`, {
              method: "POST",
            });
          }}
          className="mt-4 inline-flex h-9 items-center rounded-md bg-brand px-4 text-sm font-medium text-surface"
        >
          Retry render
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <Sparkles className="size-5 animate-pulse text-brand" aria-hidden />
      <h1 className="mt-4 font-display text-3xl text-ink">
        Building your design
      </h1>
      <p className="mt-2 text-sm text-ink-3">
        Combining the layout, copy, products, and your uploaded images. Usually
        a few seconds.
      </p>
    </main>
  );
}
