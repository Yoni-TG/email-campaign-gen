"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/lib/types";

export function VariantSelectionView({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!campaign.figmaResult) {
    // Shouldn't happen: state machine guarantees figmaResult exists here.
    return (
      <p className="text-sm text-destructive">
        Missing figmaResult — re-run the Figma fill.
      </p>
    );
  }

  const { variants } = campaign.figmaResult;

  const handleConfirm = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaign.id}/select-variant`,
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
      setIsSubmitting(false);
    }
  };

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
                  : "border-gray-200 hover:border-gray-300"
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
          onClick={handleConfirm}
          disabled={!selected || isSubmitting}
          size="lg"
        >
          {isSubmitting ? "Confirming…" : "Confirm Selection"}
        </Button>
      </div>
    </div>
  );
}
