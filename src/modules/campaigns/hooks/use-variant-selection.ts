"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface UseVariantSelectionResult {
  selected: string | null;
  setSelected: (name: string) => void;
  isSubmitting: boolean;
  confirm: () => Promise<void>;
}

// Drives the variant-pick flow: local pick state + POST /select-variant →
// router.refresh so CompletedView takes over. Mirrors useReviewForm /
// useHeroUpload so the components stay pure views.
export function useVariantSelection(
  campaignId: string,
): UseVariantSelectionResult {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
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
          body: JSON.stringify({ variantName: selected }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Variant selection failed");
      }
      router.refresh();
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
