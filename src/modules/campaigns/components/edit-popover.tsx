"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApprovedCopy, Campaign } from "@/lib/types";
import {
  readPath,
  writePath,
  stripCampaignId,
  pathIsMultiline,
} from "./edit-fields/path-helpers";
import { shortError } from "./edit-fields/short-error";

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

// ─── Image editor ────────────────────────────────────────────────

function ImageEditor({
  title,
  endpoint,
  formData,
  onSaved,
}: {
  title: string;
  endpoint: string;
  formData: Record<string, string>;
  onSaved: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const body = new FormData();
      for (const [k, v] of Object.entries(formData)) body.append(k, v);
      body.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }
      toast.success("Image replaced — re-rendered.");
      onSaved();
    } catch (err) {
      toast.error(shortError(err, "Upload failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-3 pr-6 text-xs font-mono text-muted-foreground">{title}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : "Choose new image"}
      </Button>
      <p className="mt-2 text-[11px] text-muted-foreground">
        JPG, PNG, or WebP. Re-renders on upload.
      </p>
    </div>
  );
}

// ─── Text editor ─────────────────────────────────────────────────

function TextEditor({
  path,
  campaign,
  onSaved,
}: {
  path: string;
  campaign: Campaign;
  onSaved: () => void;
}) {
  const initial = readPath(campaign.approvedCopy, path) ?? "";
  const isMultiline = pathIsMultiline(path);
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!campaign.approvedCopy) return;
    setBusy(true);
    try {
      const next = writePath(campaign.approvedCopy, path, value.trim() || null);
      const res = await fetch(`/api/campaigns/${campaign.id}/fine-tune/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedCopy: stripCampaignId(next) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast.success("Copy updated — re-rendered.");
      onSaved();
    } catch (err) {
      toast.error(shortError(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-3 pr-6 text-xs font-mono text-muted-foreground">{path}</p>
      {isMultiline ? (
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="text-sm"
        />
      ) : (
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void save();
            }
          }}
        />
      )}
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save & Re-render"}
        </Button>
      </div>
    </div>
  );
}

// ─── Background editor ──────────────────────────────────────────

const BG_OPTIONS: Array<{ key: string; label: string; swatch: string }> = [
  { key: "white", label: "White", swatch: "#FFFFFF" },
  { key: "baby_blue", label: "Baby Blue", swatch: "#BEDFF7" },
  { key: "pale_blue", label: "Pale Blue", swatch: "#E6F0F8" },
  { key: "mid_blue", label: "Mid Blue", swatch: "#76A4C4" },
];

function BackgroundEditor({
  campaignId,
  blockIndex,
  currentBackground,
  onSaved,
}: {
  campaignId: string;
  blockIndex: number;
  currentBackground: string | null;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const save = async (background: string) => {
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
      <p className="mb-3 pr-6 text-xs font-mono text-muted-foreground">
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
                className="h-6 w-6 shrink-0 rounded border border-border/60"
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
