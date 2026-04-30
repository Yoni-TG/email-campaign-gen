"use client";

import { useState } from "react";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { toast } from "sonner";
import {
  BLOCK_ALIGNMENTS,
  type BlockAlignment,
} from "@/modules/email-templates/blocks/theme";
import { cn } from "@/lib/utils";
import { shortError } from "./short-error";

const ICONS: Record<BlockAlignment, typeof AlignLeft> = {
  left: AlignLeft,
  center: AlignCenter,
  right: AlignRight,
};

interface Props {
  campaignId: string;
  blockIndex: number;
  current: BlockAlignment;
  onSaving?: () => void;
  onSaved: () => void;
}

// Segmented L/C/R control. Selected button is the brand fill, others are
// muted — matches the brief's "ink fill, white text" callout for the
// active option.
export function AlignmentEditor({
  campaignId,
  blockIndex,
  current,
  onSaving,
  onSaved,
}: Props) {
  const [busy, setBusy] = useState(false);

  const save = async (next: BlockAlignment) => {
    if (next === current) return;
    onSaving?.();
    setBusy(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/fine-tune/block-style`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockIndex, key: "align", value: next }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast.success("Alignment updated — re-rendered.");
      onSaved();
    } catch (err) {
      toast.error(shortError(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Block alignment"
      className="inline-flex rounded-md border border-border bg-surface p-0.5"
    >
      {BLOCK_ALIGNMENTS.map((value) => {
        const Icon = ICONS[value];
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={busy}
            onClick={() => void save(value)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded transition-colors",
              active
                ? "bg-ink text-surface"
                : "text-ink-3 hover:bg-surface-2 hover:text-ink",
              busy && "cursor-not-allowed opacity-50",
            )}
          >
            <Icon className="size-3.5" aria-label={`Align ${value}`} />
          </button>
        );
      })}
    </div>
  );
}
