"use client";

import { useState } from "react";
import { toast } from "sonner";
import { shortError } from "./short-error";

const BG_OPTIONS: Array<{ key: string; label: string; swatch: string }> = [
  { key: "white", label: "White", swatch: "#FFFFFF" },
  { key: "baby_blue", label: "Baby Blue", swatch: "#BEDFF7" },
  { key: "pale_blue", label: "Pale Blue", swatch: "#E6F0F8" },
  { key: "mid_blue", label: "Mid Blue", swatch: "#76A4C4" },
];

interface Props {
  campaignId: string;
  blockIndex: number;
  currentBackground: string | null;
  onSaving?: () => void;
  onSaved: () => void;
}

export function BackgroundEditor({
  campaignId,
  blockIndex,
  currentBackground,
  onSaving,
  onSaved,
}: Props) {
  const [busy, setBusy] = useState(false);

  const save = async (background: string) => {
    onSaving?.();
    setBusy(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/fine-tune/block-bg`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockIndex, background }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast.success("Background updated — re-rendered.");
      onSaved();
    } catch (err) {
      toast.error(shortError(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-3 pr-6 font-mono text-xs text-muted-foreground">
        background · block {blockIndex}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {BG_OPTIONS.map((opt) => {
          const active = currentBackground === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              disabled={busy}
              onClick={() => save(opt.key)}
              className={`flex items-center gap-2 rounded-md border p-2 text-left text-xs transition-colors ${
                active
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <span
                className="size-6 shrink-0 rounded border border-border/60"
                style={{ backgroundColor: opt.swatch }}
                aria-hidden
              />
              <span className="font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Click a swatch to apply and re-render.
      </p>
    </div>
  );
}
