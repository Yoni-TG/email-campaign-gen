"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface UseHeroUploadResult {
  file: File | null;
  preview: string | null;
  isUploading: boolean;
  setFile: (file: File | null) => void;
  upload: () => Promise<void>;
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

  const upload = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("hero", file);

      const res = await fetch(`/api/campaigns/${campaignId}/hero`, {
        method: "POST",
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }

      // Fire-and-forget: the filling view polls for the transition.
      void fetch(`/api/campaigns/${campaignId}/fill-figma`, { method: "POST" });
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
