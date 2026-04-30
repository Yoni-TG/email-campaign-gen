"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  BUTTON_COLORS,
  buttonColorHex,
  type ButtonColor,
} from "@/modules/email-templates/blocks/theme";
import { cn } from "@/lib/utils";
import { shortError } from "./short-error";

interface Props {
  campaignId: string;
  blockIndex: number;
  current: ButtonColor;
  onSaving?: () => void;
  onSaved: () => void;
}

const LABELS: Record<ButtonColor, string> = {
  ink: "Ink",
  accent: "Accent",
  green: "Green",
  blue: "Blue",
};

// Four-swatch row — selected swatch gets a 2px brand border per the brief.
// Sends value through the generic block-style fine-tune endpoint.
export function ButtonColorEditor({
  campaignId,
  blockIndex,
  current,
  onSaving,
  onSaved,
}: Props) {
  const [busy, setBusy] = useState(false);

  const save = async (next: ButtonColor) => {
    if (next === current) return;
    onSaving?.();
    setBusy(true);
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/fine-tune/block-style`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockIndex,
            key: "buttonColor",
            value: next,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast.success("Button colour updated — re-rendered.");
      onSaved();
    } catch (err) {
      toast.error(shortError(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {BUTTON_COLORS.map((color) => {
        const active = current === color;
        return (
          <button
            key={color}
            type="button"
            aria-label={`Button colour ${LABELS[color]}`}
            aria-pressed={active}
            disabled={busy}
            onClick={() => void save(color)}
            className={cn(
              "size-7 rounded-full border-2 transition-transform",
              active ? "border-brand scale-110" : "border-transparent",
              busy && "cursor-not-allowed opacity-50",
              !active && "hover:scale-105",
            )}
            style={{ backgroundColor: buttonColorHex(color) }}
          />
        );
      })}
    </div>
  );
}
