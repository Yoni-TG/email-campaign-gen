"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVariantSelection } from "@/modules/campaigns/hooks/use-variant-selection";
import type { Campaign } from "@/lib/types";

export function VariantSelectionView({ campaign }: { campaign: Campaign }) {
  const { selected, setSelected, isSubmitting, confirm } = useVariantSelection(
    campaign.id,
  );

  if (!campaign.figmaResult) {
    // Shouldn't happen: the state machine guarantees figmaResult exists here.
    return (
      <p className="text-sm text-destructive">
        Missing figmaResult — re-run the Figma fill.
      </p>
    );
  }

  const { variants } = campaign.figmaResult;

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Choose a Layout</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Pick the variant to hand off to retention for Klaviyo slicing.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {variants.map((variant) => {
          const isActive = selected === variant.variantName;
          return (
            <button
              key={variant.variantName}
              type="button"
              onClick={() => setSelected(variant.variantName)}
              className={`relative overflow-hidden rounded-lg border-2 transition-colors ${
                isActive
                  ? "border-primary"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={variant.thumbnailUrl}
                alt={variant.variantName}
                className="w-full"
              />
              <div className="p-2 text-center text-sm font-medium">
                {variant.variantName}
              </div>
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
