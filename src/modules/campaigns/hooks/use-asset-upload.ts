"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { checkUploadSize } from "@/lib/uploads";

interface SlotState {
  file: File | null;
  preview: string | null;
}

export interface UseAssetUploadResult {
  /** Per-slot file + object-URL preview state. */
  slots: Record<string, SlotState>;
  /** True while any upload in the queue is in flight. */
  isUploading: boolean;
  /** Sets the file for one slot, replacing any previous selection. */
  setFile: (slotKey: string, file: File | null) => void;
  /** Uploads every slot that has a file, in order. The chained
   *  /render-final trigger fires automatically when the server reports
   *  the campaign has advanced (i.e. all required slots filled). */
  uploadAll: () => Promise<void>;
}

// Drives the multi-slot asset_upload form. Each requiredAsset key on the
// chosen skeleton gets one entry. setFile holds object-URL previews on a
// ref so unmount cleanup can revoke them. uploadAll iterates the queue,
// posts each file via /api/asset, and kicks /render-final the moment the
// server reports the status flipped to rendering_final.
export function useAssetUpload(
  campaignId: string,
  slotKeys: string[],
): UseAssetUploadResult {
  const router = useRouter();
  const [slots, setSlots] = useState<Record<string, SlotState>>(() =>
    Object.fromEntries(slotKeys.map((k) => [k, { file: null, preview: null }])),
  );
  const [isUploading, setIsUploading] = useState(false);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const setFile = (slotKey: string, next: File | null) => {
    if (next) {
      const tooBig = checkUploadSize(next);
      if (tooBig) {
        toast.error(tooBig);
        return;
      }
    }
    setSlots((prev) => {
      const previous = prev[slotKey];
      if (previous?.preview) {
        URL.revokeObjectURL(previous.preview);
        previewUrlsRef.current.delete(previous.preview);
      }
      const nextUrl = next ? URL.createObjectURL(next) : null;
      if (nextUrl) previewUrlsRef.current.add(nextUrl);
      return {
        ...prev,
        [slotKey]: { file: next, preview: nextUrl },
      };
    });
  };

  // Revoke any URLs still active at unmount.
  useEffect(() => {
    return () => {
      for (const url of previewUrlsRef.current) URL.revokeObjectURL(url);
      previewUrlsRef.current.clear();
    };
  }, []);

  const uploadAll = async () => {
    if (isUploading) return;
    const pending = Object.entries(slots).filter(([, s]) => s.file);
    if (pending.length === 0) return;
    setIsUploading(true);
    try {
      let lastStatus: string | null = null;
      for (const [slotKey, slot] of pending) {
        if (!slot.file) continue;
        const body = new FormData();
        body.append("slotKey", slotKey);
        body.append("file", slot.file);

        const res = await fetch(`/api/campaigns/${campaignId}/asset`, {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Upload failed for slot "${slotKey}"`);
        }
        const out = (await res.json()) as { status: string };
        lastStatus = out.status;
      }

      if (lastStatus === "rendering_final") {
        // Fire-and-forget: the rendering_final view polls for completion.
        void fetch(`/api/campaigns/${campaignId}/render-final`, {
          method: "POST",
        });
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return { slots, isUploading, setFile, uploadAll };
}
