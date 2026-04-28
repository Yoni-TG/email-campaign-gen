"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { checkUploadSize } from "@/lib/uploads";

export interface UseHeroUploadResult {
  file: File | null;
  preview: string | null;
  isUploading: boolean;
  setFile: (file: File | null) => void;
  /** slotKey defaults to "hero" — pass another slot when the chosen
   *  skeleton declares a different asset key. */
  upload: (slotKey?: string) => Promise<void>;
}

// Holds the selected file + object-URL preview and runs the two-step submit:
// upload the file, then fire the fill-figma trigger. router.refresh() pulls
// the new server state so the FillingFigmaView takes over.
//
// The live preview URL is tracked on a ref so the unmount cleanup can
// revoke whichever URL is active *at unmount time* — without it the
// cleanup closed over the initial null and leaked the last picked URL.
export function useHeroUpload(campaignId: string): UseHeroUploadResult {
  const router = useRouter();
  const [file, setFileState] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const previewRef = useRef<string | null>(null);

  const setFile = (next: File | null) => {
    if (next) {
      const tooBig = checkUploadSize(next);
      if (tooBig) {
        toast.error(tooBig);
        return;
      }
    }
    setFileState(next);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const nextUrl = next ? URL.createObjectURL(next) : null;
    previewRef.current = nextUrl;
    setPreview(nextUrl);
  };

  // Revoke the URL that's active when the component unmounts.
  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
        previewRef.current = null;
      }
    };
  }, []);

  const upload = async (slotKey: string = "hero") => {
    if (!file || isUploading) return;
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("slotKey", slotKey);
      body.append("file", file);

      const res = await fetch(`/api/campaigns/${campaignId}/asset`, {
        method: "POST",
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }

      const out = (await res.json()) as { status: string };
      if (out.status === "rendering_final") {
        // Last required asset uploaded — kick off the final render.
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

  return { file, preview, isUploading, setFile, upload };
}
