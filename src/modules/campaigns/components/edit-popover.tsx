"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Campaign } from "@/lib/types";
import { TextEditor } from "./edit-fields/text-editor";
import { ImageEditor } from "./edit-fields/image-editor";
import { BackgroundEditor } from "./edit-fields/background-editor";

// Floating contextual editor anchored to the clicked element on the
// EditableEmailFrame iframe. One popover at a time — a fresh click on
// another editable element replaces this one (parent unmounts and
// re-mounts).
//
// Decodes the data-edit-target string into an edit kind + payload:
//   image:asset:<key>          → asset re-upload via /fine-tune/asset
//   image:product:<sku>        → product image re-upload via /fine-tune/product-image
//   text:<path-into-approvedCopy> → patches one field of approvedCopy and re-renders

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Props {
  target: string;
  rect: Rect;
  campaign: Campaign;
  onClose: () => void;
  onSaved: () => void;
}

export function EditPopover({ target, rect, campaign, onClose, onSaved }: Props) {
  // Popover uses `position: fixed` so coordinates are viewport-relative.
  // Default placement is below the clicked element; if it would overflow
  // the bottom of the viewport we flip it above. Horizontally we clamp
  // inside the viewport with a 16px gutter.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number }>({
    left: rect.left,
    top: rect.top + rect.height + 8,
  });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const popoverHeight = el.offsetHeight;
    const popoverWidth = el.offsetWidth;
    const belowTop = rect.top + rect.height + 8;
    const fitsBelow = belowTop + popoverHeight <= window.innerHeight - 8;
    setCoords({
      left: Math.max(
        16,
        Math.min(rect.left, window.innerWidth - popoverWidth - 16),
      ),
      top: fitsBelow ? belowTop : Math.max(16, rect.top - popoverHeight - 8),
    });
  }, [rect.left, rect.top, rect.width, rect.height]);

  // Escape closes; click outside (on the backdrop) closes too.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  let body: ReactNode;
  if (target.startsWith("image:asset:")) {
    const slotKey = target.slice("image:asset:".length);
    body = (
      <ImageEditor
        title={`Replace asset · ${slotKey}`}
        endpoint={`/api/campaigns/${campaign.id}/fine-tune/asset`}
        formData={{ slotKey }}
        onSaved={onSaved}
      />
    );
  } else if (target.startsWith("image:product:")) {
    const sku = target.slice("image:product:".length);
    body = (
      <ImageEditor
        title={`Replace product image · ${sku}`}
        endpoint={`/api/campaigns/${campaign.id}/fine-tune/product-image`}
        formData={{ sku }}
        onSaved={onSaved}
      />
    );
  } else if (target.startsWith("text:")) {
    const path = target.slice("text:".length);
    body = (
      <TextEditor
        path={path}
        campaign={campaign}
        onSaved={onSaved}
      />
    );
  } else if (target.startsWith("bg:block:")) {
    const blockIndex = parseInt(target.slice("bg:block:".length), 10);
    body = (
      <BackgroundEditor
        campaignId={campaign.id}
        blockIndex={blockIndex}
        currentBackground={
          (campaign.blockOverrides?.[blockIndex]?.background as
            | string
            | undefined) ?? null
        }
        onSaved={onSaved}
      />
    );
  } else {
    body = (
      <p className="text-sm text-muted-foreground">
        Unknown edit target: <code>{target}</code>
      </p>
    );
  }

  return (
    <>
      {/* Backdrop — invisible but catches outside-clicks. */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={wrapperRef}
        className="fixed z-50 w-80 rounded-lg border border-border bg-card p-4 shadow-2xl ring-1 ring-black/5"
        style={{ left: coords.left, top: coords.top }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close editor"
          onClick={onClose}
          className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        {body}
      </div>
    </>
  );
}
