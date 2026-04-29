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

interface Props {
  campaign: Campaign;
  skeleton: SkeletonManifest;
  selectedIndex: number | null;
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
  selectedIndex,
  onSaving,
  onSaved,
}: Props) {
  if (selectedIndex === null) {
    return (
      <aside className="w-[240px] shrink-0 border-l border-border bg-surface px-4 py-5">
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          Selected
        </h2>
        <p className="text-xs text-ink-3">Click a block to edit it.</p>
      </aside>
    );
  }

  const block = skeleton.blocks[selectedIndex];
  if (!block) return null;
  const fields = resolveBlockProperties(skeleton, selectedIndex);

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
