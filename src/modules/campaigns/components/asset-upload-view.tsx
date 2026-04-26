"use client";

import { useRef, type ChangeEvent, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeroUpload } from "@/modules/campaigns/hooks/use-hero-upload";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import type { Campaign } from "@/lib/types";

// Step 2 minimum-viable view: lets the operator upload the next required
// asset slot declared by the chosen skeleton. Step 3 rebuilds this around
// a per-slot dynamic form.
export function AssetUploadView({ campaign }: { campaign: Campaign }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { file, preview, isUploading, setFile, upload } = useHeroUpload(
    campaign.id,
  );

  const skeleton = campaign.chosenSkeletonId
    ? loadSkeletonById(campaign.chosenSkeletonId)
    : null;
  const requiredSlots = skeleton?.requiredAssets ?? [];
  const pendingSlot = requiredSlots.find(
    (a) => a.required && !campaign.assetPaths?.[a.key],
  );

  if (!skeleton) {
    return (
      <p className="py-12 text-center text-sm text-destructive">
        Missing chosen skeleton — pick a variant first.
      </p>
    );
  }

  if (!pendingSlot) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        All required assets uploaded. Rendering final email…
      </p>
    );
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0];
    if (next) setFile(next);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("image/")) setFile(dropped);
  };

  const handleUpload = () => {
    void upload(pendingSlot.key);
  };

  return (
    <div className="mx-auto max-w-lg py-8">
      <h2 className="mb-2 text-lg font-semibold">{pendingSlot.label}</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Upload the {pendingSlot.label.toLowerCase()} for the chosen
        layout: <strong>{skeleton.name}</strong>.
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary"
      >
        {preview ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={preview}
            alt={`${pendingSlot.label} preview`}
            className="mx-auto max-h-64 rounded"
          />
        ) : (
          <div className="text-muted-foreground">
            <Upload className="mx-auto mb-2 h-8 w-8" />
            <p>Drag & drop or click to select</p>
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

      {file && (
        <div className="mt-4 flex justify-end">
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      )}
    </div>
  );
}
