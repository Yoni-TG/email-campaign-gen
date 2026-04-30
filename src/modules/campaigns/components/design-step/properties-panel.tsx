"use client";

import { Sparkles } from "lucide-react";
import type { Campaign } from "@/lib/types";
import type { SkeletonManifest } from "@/modules/email-templates/types";
import {
  BLOCK_TYPE_LABELS,
  resolveBlockProperties,
} from "@/modules/campaigns/utils/block-properties";
import { TextEditor } from "../edit-fields/text-editor";
import { ImageEditor } from "../edit-fields/image-editor";
import { BackgroundEditor } from "../edit-fields/background-editor";

// Selection state shared with DesignStepView. A block selection drives
// the layers panel + the bind-walking properties view; a product
// selection points at a single approvedProducts row for image swap and
// has no corresponding skeleton block.
export type Selection =
  | {
      kind: "block";
      index: number;
      target: string | null;
      rect: { x: number; y: number; w: number; h: number } | null;
    }
  | {
      kind: "product";
      sku: string;
      target: string;
      rect: { x: number; y: number; w: number; h: number } | null;
    };

interface Props {
  campaign: Campaign;
  skeleton: SkeletonManifest;
  selection: Selection | null;
  onSaving: () => void;
  onSaved: () => void;
}

// Right rail of the design editor. Empty-state when nothing is selected;
// otherwise lists the editable fields for the selected block. Each field
// component already speaks the fine-tune endpoints and toasts on its
// own — this panel just plumbs the saving/saved callbacks up to
// DesignStepView so the action bar's pill can show progress.
export function PropertiesPanel({
  campaign,
  skeleton,
  selection,
  onSaving,
  onSaved,
}: Props) {
  if (selection === null) {
    return (
      <aside className="w-[240px] shrink-0 border-l border-border bg-surface px-4 py-5">
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          Selected
        </h2>
        <p className="text-xs text-ink-3">Click a block to edit it.</p>
      </aside>
    );
  }

  if (selection.kind === "product") {
    return (
      <ProductPanel
        campaign={campaign}
        sku={selection.sku}
        onSaving={onSaving}
        onSaved={onSaved}
      />
    );
  }

  const block = skeleton.blocks[selection.index];
  if (!block) return null;
  const fields = resolveBlockProperties(skeleton, selection.index);

  return (
    <aside className="w-[240px] shrink-0 border-l border-border bg-surface px-4 py-5">
      <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        Selected
      </h2>
      <p className="mb-4 text-sm font-semibold text-ink">
        {BLOCK_TYPE_LABELS[block.type]}
      </p>

      <div className="space-y-5">
        {fields.map((field, i) => {
          if (field.kind === "text") {
            return (
              <FieldGroup key={i} label={field.label}>
                <TextEditor
                  path={field.path}
                  multiline={field.multiline}
                  campaign={campaign}
                  onSaving={onSaving}
                  onSaved={onSaved}
                />
              </FieldGroup>
            );
          }
          if (field.kind === "image:asset") {
            const currentUrl = campaign.assetPaths?.[field.slotKey] ?? null;
            return (
              <FieldGroup key={i} label={field.label}>
                {currentUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentUrl}
                    alt=""
                    className="mb-2 h-20 w-full rounded object-cover"
                  />
                ) : null}
                <ImageEditor
                  title={`Replace · ${field.slotKey}`}
                  endpoint={`/api/campaigns/${campaign.id}/fine-tune/asset`}
                  formData={{ slotKey: field.slotKey }}
                  onSaving={onSaving}
                  onSaved={onSaved}
                />
              </FieldGroup>
            );
          }
          if (field.kind === "bg") {
            const currentBg =
              (campaign.blockOverrides?.[field.blockIndex]?.background as
                | string
                | undefined) ?? null;
            return (
              <FieldGroup key={i} label={field.label}>
                <BackgroundEditor
                  campaignId={campaign.id}
                  blockIndex={field.blockIndex}
                  currentBackground={currentBg}
                  onSaving={onSaving}
                  onSaved={onSaved}
                />
              </FieldGroup>
            );
          }
          return null;
        })}
      </div>

      <div className="mt-6 rounded-md bg-brand-soft p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-brand">
          <Sparkles className="size-3" aria-hidden /> Suggestions
        </p>
        <p className="mt-1 text-xs text-ink-3">
          Suggestions are coming soon.
        </p>
      </div>
    </aside>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-ink-2">{label}</p>
      {children}
    </div>
  );
}

// Per-product panel: the operator clicked one cell in a product grid
// and wants to swap that product's image. Shows current thumbnail +
// product name, then the same ImageEditor used for asset slots, but
// pointed at the product-image fine-tune endpoint with the SKU.
function ProductPanel({
  campaign,
  sku,
  onSaving,
  onSaved,
}: {
  campaign: Campaign;
  sku: string;
  onSaving: () => void;
  onSaved: () => void;
}) {
  const product =
    campaign.approvedProducts?.find((p) => p.sku === sku) ?? null;

  return (
    <aside className="w-[240px] shrink-0 border-l border-border bg-surface px-4 py-5">
      <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        Selected
      </h2>
      <p className="mb-4 text-sm font-semibold text-ink">Product</p>

      {product ? (
        <div className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="mb-2 h-32 w-full rounded object-cover"
          />
          <p className="text-sm font-medium text-ink">{product.name}</p>
          <p className="font-mono text-[11px] text-ink-3">{product.sku}</p>
        </div>
      ) : (
        <p className="mb-4 text-xs text-destructive">
          Product {sku} not found in approvedProducts.
        </p>
      )}

      <FieldGroup label="Replace image">
        <ImageEditor
          title={`Replace · ${sku}`}
          endpoint={`/api/campaigns/${campaign.id}/fine-tune/product-image`}
          formData={{ sku }}
          onSaving={onSaving}
          onSaved={onSaved}
        />
      </FieldGroup>
    </aside>
  );
}
