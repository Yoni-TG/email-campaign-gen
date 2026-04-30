"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useVariantSelection } from "@/modules/campaigns/hooks/use-variant-selection";
import { AutoSizeIframe } from "@/modules/campaigns/components/auto-size-iframe";
import { cn } from "@/lib/utils";
import type { Campaign, CandidateVariant } from "@/lib/types";
import { WizardActionBar } from "./wizard-action-bar";

interface Props {
  campaign: Campaign;
}

// Step 3 (Layout) — Direction B from the redesign brief: full-bleed
// focused preview on the left, narrow selector strip on the right with
// three mini-card thumbnails. Selecting a card swaps the focused
// preview; "Continue →" persists the pick via the existing
// /select-variant API and routes the operator on to step 4 (Images).
export function LayoutPickView({ campaign }: Props) {
  const variants = campaign.candidateVariants ?? [];
  // Default to whatever was previously chosen, else the first variant —
  // that way the right-strip always has one selected card and the
  // focused preview is never empty on first paint.
  const initial = campaign.chosenSkeletonId ?? variants[0]?.skeletonId ?? null;
  const [focusedId, setFocusedId] = useState<string | null>(initial);

  const { selected, setSelected, isSubmitting, confirm } = useVariantSelection(
    campaign.id,
    {
      // After the API records the pick, route to step 4. Until step 4
      // ships as its own per-step route, fall back to the campaign
      // detail page — the status dispatcher will land on AssetUploadView.
      onSuccess: (router) => router.push(`/campaigns/${campaign.id}`),
      // Pre-arm with the previously chosen skeleton so the operator can
      // hit Continue without re-clicking when revisiting this step.
      initialSelected: campaign.chosenSkeletonId,
    },
  );

  // Keep focused + selected in sync — picking a card both swaps the
  // preview and arms the Continue CTA.
  const onPickCard = (id: string) => {
    setFocusedId(id);
    setSelected(id);
  };

  if (variants.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-sm text-ink-3">
        Layouts haven&apos;t been generated yet.
      </div>
    );
  }

  const focused = variants.find((v) => v.skeletonId === focusedId) ?? variants[0];

  return (
    <div className="flex min-h-[calc(100vh-4rem-4rem)] flex-col">
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_208px]">
        <FocusedPreview variant={focused} />
        <SelectorStrip
          variants={variants}
          selectedId={focused.skeletonId}
          onSelect={onPickCard}
        />
      </div>
      <WizardActionBar
        backHref={`/campaigns/${campaign.id}`}
        primary={
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={!selected || isSubmitting}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Continue →"}
          </button>
        }
        helper={
          !selected ? "Pick a layout to continue" : undefined
        }
      />
    </div>
  );
}

function FocusedPreview({ variant }: { variant: CandidateVariant }) {
  return (
    <div
      className="flex items-start justify-center overflow-y-auto px-6 py-10 sm:px-10"
      style={{ backgroundColor: "#ede9e1" }}
    >
      <div className="rounded-md bg-surface shadow-[0_12px_32px_-12px_rgba(26,24,21,0.18)]">
        <AutoSizeIframe
          title={`${variant.skeletonId} focused preview`}
          srcDoc={variant.previewHtml}
          scale={0.625}
          minHeight={420}
        />
      </div>
    </div>
  );
}

function SelectorStrip({
  variants,
  selectedId,
  onSelect,
}: {
  variants: CandidateVariant[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="flex flex-col gap-3 border-l border-border bg-surface px-4 py-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
        Layouts
      </p>
      <ul className="flex flex-col gap-3">
        {variants.map((variant) => (
          <li key={variant.skeletonId}>
            <LayoutCard
              variant={variant}
              selected={variant.skeletonId === selectedId}
              onSelect={() => onSelect(variant.skeletonId)}
            />
          </li>
        ))}
      </ul>
      <RegenerateLink />
    </aside>
  );
}

function LayoutCard({
  variant,
  selected,
  onSelect,
}: {
  variant: CandidateVariant;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex w-full flex-col overflow-hidden rounded-md border-2 bg-surface text-left transition-colors",
        selected
          ? "border-brand"
          : "border-border hover:border-border-strong",
      )}
    >
      <div
        className="flex justify-center overflow-hidden px-2 pt-2"
        style={{ backgroundColor: "#f5f2ec" }}
      >
        <AutoSizeIframe
          title={`${variant.skeletonId} thumbnail`}
          srcDoc={variant.previewHtml}
          scale={0.26}
          minHeight={108}
          maxHeight={108}
          passThroughClicks
        />
      </div>
      <div className="px-3 py-2.5">
        <p
          className={cn(
            "truncate text-[13px] font-medium",
            selected ? "text-ink" : "text-ink-2",
          )}
        >
          {variant.name}
        </p>
      </div>
    </button>
  );
}

// Regenerate is intentionally inert in this pass — the underlying
// render-candidates action only runs from `rendering_candidates`, so
// re-rolling from this view needs a backend story we haven't agreed on
// yet. Shows the affordance disabled with a native hover hint.
function RegenerateLink() {
  return (
    <button
      type="button"
      disabled
      title="Coming soon"
      className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-sm text-ink-4"
    >
      <Sparkles className="size-3.5" aria-hidden />
      Regenerate
    </button>
  );
}
