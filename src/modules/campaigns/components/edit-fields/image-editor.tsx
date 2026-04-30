"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { shortError } from "./short-error";

interface Props {
  title: string;
  endpoint: string;
  formData: Record<string, string>;
  onSaving?: () => void;
  onSaved: () => void;
}

export function ImageEditor({
  title,
  endpoint,
  formData,
  onSaving,
  onSaved,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    onSaving?.();
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
      <p className="mb-3 pr-6 font-mono text-xs text-muted-foreground">{title}</p>
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
