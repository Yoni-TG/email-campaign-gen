"use client";

import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVariantSelection } from "@/modules/campaigns/hooks/use-variant-selection";
import { AutoSizeIframe } from "./auto-size-iframe";
import type { Campaign, CandidateVariant } from "@/lib/types";

// Three live iframes side-by-side. Click a card to expand to a full-size
// preview, then "Choose this" to commit. Picking writes chosenSkeletonId
// and advances to asset_upload — see actions/select-variant.ts.

export function VariantSelectionView({ campaign }: { campaign: Campaign }) {
  const { selected, setSelected, isSubmitting, confirm } = useVariantSelection(
    campaign.id,
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!campaign.candidateVariants || campaign.candidateVariants.length === 0) {
    return (
      <p className="text-sm text-destructive">
        Missing candidateVariants — re-run render-candidates.
      </p>
    );
  }

  const expanded = expandedId
    ? campaign.candidateVariants.find((v) => v.skeletonId === expandedId)
    : null;

  if (expanded) {
    return (
      <ExpandedPreview
        variant={expanded}
        onBack={() => setExpandedId(null)}
        onChoose={() => {
          setSelected(expanded.skeletonId);
          setExpandedId(null);
        }}
        chosen={selected === expanded.skeletonId}
      />
    );
  }

  return (
    <div>
      <header className="mb-6">
        <h2 className="text-lg font-semibold">Choose a Layout</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Three candidates rendered with your approved copy and products.
          Pick the one that carries your message best — you&apos;ll upload
          assets next.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {campaign.candidateVariants.map((variant) => (
          <VariantCard
            key={variant.skeletonId}
            variant={variant}
            isSelected={selected === variant.skeletonId}
            onSelect={() => setSelected(variant.skeletonId)}
            onExpand={() => setExpandedId(variant.skeletonId)}
          />
        ))}
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

function VariantCard({
  variant,
  isSelected,
  onSelect,
  onExpand,
}: {
  variant: CandidateVariant;
  isSelected: boolean;
  onSelect: () => void;
  onExpand: () => void;
}) {
  return (
    <article
      className={`overflow-hidden rounded-xl border bg-card transition-colors ${
        isSelected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-muted-foreground/40"
      }`}
    >
      <button
        type="button"
        onClick={onExpand}
        className="flex w-full items-start justify-center bg-stone-50 p-3"
        aria-label={`Expand preview of ${variant.name}`}
      >
        <AutoSizeIframe
          title={`${variant.skeletonId} preview`}
          srcDoc={variant.previewHtml}
          className="bg-white shadow-sm"
          scale={0.45}
          minHeight={600}
          passThroughClicks
        />
      </button>
      <div className="border-t border-border/60 p-4">
        <p className="text-sm font-semibold">{variant.name}</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {variant.skeletonId}
        </p>
        {variant.rationale && (
          <p className="mt-2 text-xs italic text-muted-foreground">
            {variant.rationale}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onExpand}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            Full preview
          </button>
          <Button
            type="button"
            size="sm"
            variant={isSelected ? "default" : "outline"}
            onClick={onSelect}
          >
            {isSelected ? (
              <>
                <Check className="mr-1 h-3.5 w-3.5" />
                Selected
              </>
            ) : (
              "Pick this"
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}

function ExpandedPreview({
  variant,
  onBack,
  onChoose,
  chosen,
}: {
  variant: CandidateVariant;
  onBack: () => void;
  onChoose: () => void;
  chosen: boolean;
}) {
  return (
    <div>
      <header className="mb-4 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to all variants
        </Button>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold">{variant.name}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {variant.skeletonId}
            </p>
          </div>
          <Button type="button" onClick={onChoose} disabled={chosen}>
            {chosen ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                Selected
              </>
            ) : (
              "Pick this"
            )}
          </Button>
        </div>
      </header>
      {variant.rationale && (
        <p className="mb-4 text-sm italic text-muted-foreground">
          {variant.rationale}
        </p>
      )}
      <AutoSizeIframe
        title={`${variant.skeletonId} expanded`}
        srcDoc={variant.previewHtml}
        className="block w-full rounded-lg border border-border bg-white"
        minHeight={900}
      />
    </div>
  );
}
