"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface UseVariantSelectionOptions {
  /** Callback after the API succeeds. Receives the router so the caller
   *  can `router.push` somewhere specific (e.g. the next wizard step).
   *  When omitted, falls back to `router.refresh()` so the legacy
   *  status-driven dispatcher swaps in the next view. */
  onSuccess?: (router: ReturnType<typeof useRouter>) => void;
  /** Optional initial pick — used when re-entering this step with an
   *  existing `chosenSkeletonId` so the Continue CTA is armed up front. */
  initialSelected?: string | null;
}

export interface UseVariantSelectionResult {
  selected: string | null;
  setSelected: (name: string) => void;
  isSubmitting: boolean;
  confirm: () => Promise<void>;
}

// Drives the variant-pick flow: local pick state + POST /select-variant
// → onSuccess (or router.refresh by default). Mirrors useReviewForm /
// useHeroUpload so the components stay pure views.
export function useVariantSelection(
  campaignId: string,
  options: UseVariantSelectionOptions = {},
): UseVariantSelectionResult {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(
    options.initialSelected ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirm = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/select-variant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skeletonId: selected }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Variant selection failed");
      }
      if (options.onSuccess) {
        options.onSuccess(router);
      } else {
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Variant selection failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { selected, setSelected, isSubmitting, confirm };
}
