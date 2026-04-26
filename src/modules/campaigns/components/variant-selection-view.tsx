"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVariantSelection } from "@/modules/campaigns/hooks/use-variant-selection";
import type { Campaign } from "@/lib/types";

// Step 2 minimum-viable variant picker: shows skeleton names + rationales as
// a card grid. Step 3 replaces this with three live <iframe srcDoc={previewHtml}>
// previews side-by-side per the plan.
export function VariantSelectionView({ campaign }: { campaign: Campaign }) {
  const { selected, setSelected, isSubmitting, confirm } = useVariantSelection(
    campaign.id,
  );

  if (!campaign.candidateVariants) {
    return (
      <p className="text-sm text-destructive">
        Missing candidateVariants — re-run render-candidates.
      </p>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Choose a Layout</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Pick the candidate that best carries your message. Asset uploads
        come next.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaign.candidateVariants.map((variant) => {
          const isActive = selected === variant.skeletonId;
          return (
            <button
              key={variant.skeletonId}
              type="button"
              onClick={() => setSelected(variant.skeletonId)}
              className={`relative rounded-lg border-2 p-4 text-left transition-colors ${
                isActive
                  ? "border-primary"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <p className="text-sm font-semibold">{variant.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {variant.skeletonId}
              </p>
              {variant.rationale && (
                <p className="mt-3 text-xs italic text-muted-foreground">
                  {variant.rationale}
                </p>
              )}
              {isActive && (
                <div className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={confirm}
          disabled={!selected || isSubmitting}
          size="lg"
        >
          {isSubmitting ? "Confirming…" : "Confirm Selection"}
        </Button>
      </div>
    </div>
  );
}
