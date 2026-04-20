"use client";

import { useEffect, useState } from "react";
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
export function useHeroUpload(campaignId: string): UseHeroUploadResult {
  const router = useRouter();
  const [file, setFileState] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const setFile = (next: File | null) => {
    setFileState(next);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next ? URL.createObjectURL(next) : null;
    });
  };

  // Revoke the last preview URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setIsUploading(false);
    }
  };

  return { file, preview, isUploading, setFile, upload };
}
