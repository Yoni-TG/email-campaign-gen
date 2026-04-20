"use client";

import { useRef, type ChangeEvent, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeroUpload } from "@/modules/campaigns/hooks/use-hero-upload";
import type { Campaign } from "@/lib/types";

export function HeroUploadView({ campaign }: { campaign: Campaign }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { file, preview, isUploading, setFile, upload } = useHeroUpload(
    campaign.id,
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0];
    if (next) setFile(next);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("image/")) setFile(dropped);
  };

  return (
    <div className="mx-auto max-w-lg py-8">
      <h2 className="mb-2 text-lg font-semibold">Upload Hero Image</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Choose the hero/lifestyle image for this campaign.
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Hero preview"
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
          <Button onClick={upload} disabled={isUploading}>
            {isUploading ? "Uploading…" : "Continue"}
          </Button>
        </div>
      )}
    </div>
  );
}
