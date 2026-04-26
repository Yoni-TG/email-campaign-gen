"use client";

import { useMemo, useRef, type ChangeEvent, type DragEvent } from "react";
import { Check, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAssetUpload } from "@/modules/campaigns/hooks/use-asset-upload";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import type { Campaign } from "@/lib/types";
import type { AssetSlot } from "@/modules/email-templates";

// Multi-slot asset_upload form. Renders one drop-zone per slot the chosen
// skeleton declared as required (and any optional slots), shows a thumbnail
// preview the moment a file is picked, and fires uploadAll to commit them
// in sequence — the action layer auto-advances to rendering_final once all
// required slots are filled.

export function AssetUploadView({ campaign }: { campaign: Campaign }) {
  const skeleton = campaign.chosenSkeletonId
    ? loadSkeletonById(campaign.chosenSkeletonId)
    : null;

  const slotsList: AssetSlot[] = useMemo(
    () => skeleton?.requiredAssets ?? [],
    [skeleton],
  );
  const slotKeys = useMemo(() => slotsList.map((s) => s.key), [slotsList]);

  const { slots, isUploading, setFile, uploadAll } = useAssetUpload(
    campaign.id,
    slotKeys,
  );

  if (!skeleton) {
    return (
      <p className="py-12 text-center text-sm text-destructive">
        Missing chosen skeleton — pick a variant first.
      </p>
    );
  }

  if (slotsList.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          The chosen layout doesn&apos;t need any uploads. Continuing…
        </p>
        <div className="mt-4">
          <Button onClick={uploadAll} disabled={isUploading}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  const allRequiredReady = slotsList.every((slot) => {
    if (!slot.required) return true;
    return Boolean(slots[slot.key]?.file ?? campaign.assetPaths?.[slot.key]);
  });

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Upload assets
        </p>
        <h2 className="mt-1 text-lg font-semibold">{skeleton.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The chosen layout needs {slotsList.length} asset
          {slotsList.length === 1 ? "" : "s"}. Required slots are marked.
          Optional slots can be skipped — the renderer will use placeholders.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {slotsList.map((slot) => {
          const persisted = campaign.assetPaths?.[slot.key] ?? null;
          return (
            <SlotPicker
              key={slot.key}
              slot={slot}
              file={slots[slot.key]?.file ?? null}
              preview={slots[slot.key]?.preview ?? null}
              persistedUrl={persisted}
              onPick={(file) => setFile(slot.key, file)}
            />
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {allRequiredReady
            ? "All required assets ready."
            : "Pick a file for each required slot to continue."}
        </p>
        <Button
          onClick={uploadAll}
          disabled={!allRequiredReady || isUploading}
          size="lg"
        >
          {isUploading ? "Uploading…" : "Upload & Render Final"}
        </Button>
      </div>
    </div>
  );
}

function SlotPicker({
  slot,
  file,
  preview,
  persistedUrl,
  onPick,
}: {
  slot: AssetSlot;
  file: File | null;
  preview: string | null;
  persistedUrl: string | null;
  onPick: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0];
    if (next) onPick(next);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("image/")) onPick(dropped);
  };

  const previewSrc = preview ?? persistedUrl;
  const isCommitted = !file && Boolean(persistedUrl);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{slot.label}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            slot: {slot.key}
            {slot.required ? " · required" : " · optional"}
          </p>
        </div>
        {isCommitted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 ring-1 ring-emerald-200">
            <Check className="h-3 w-3" />
            Uploaded
          </span>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors hover:border-primary"
      >
        {previewSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewSrc}
            alt={`${slot.label} preview`}
            className="mx-auto max-h-48 rounded"
          />
        ) : (
          <div className="text-muted-foreground">
            <Upload className="mx-auto mb-2 h-7 w-7" />
            <p className="text-sm">Drag & drop or click to select</p>
            <p className="mt-1 text-xs">JPG, PNG, or WebP</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
