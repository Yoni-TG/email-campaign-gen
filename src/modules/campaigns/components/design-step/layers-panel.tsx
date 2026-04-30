"use client";

import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SkeletonManifest } from "@/modules/email-templates/types";
import { BLOCK_TYPE_LABELS } from "@/modules/campaigns/utils/block-properties";

interface Props {
  skeleton: SkeletonManifest;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

// Left rail of the design editor. Lists every block in the chosen
// skeleton; the active row visually pairs with the selection state held
// by DesignStepView. Drag handle icon is decorative — drag-reorder is
// out of scope for v1 (matches the "internal QA" implementation order
// in the brief).
export function LayersPanel({ skeleton, selectedIndex, onSelect }: Props) {
  return (
    <aside className="w-[180px] shrink-0 border-r border-border bg-surface px-3 py-4">
      <h2 className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
        Sections
      </h2>
      <ul className="space-y-1">
        {skeleton.blocks.map((block, i) => {
          const active = selectedIndex === i;
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(i)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  active
                    ? "bg-brand-soft font-semibold text-brand"
                    : "text-ink-2 hover:bg-surface-2",
                )}
              >
                <GripVertical
                  className="size-3.5 shrink-0 opacity-50"
                  aria-hidden
                />
                <span className="truncate">{BLOCK_TYPE_LABELS[block.type]}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => toast.info("Adding sections is coming soon.")}
        className="mt-3 px-2 text-xs font-medium text-brand hover:underline"
      >
        + Add section
      </button>
    </aside>
  );
}
