"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import type { Campaign } from "@/lib/types";

// Fine-tune card on the completed view — lets the operator swap any asset
// slot (the chosen skeleton's requiredAssets) without leaving the page.
// One file picker per slot. On upload we POST to /fine-tune/asset which
// updates assetPaths AND re-runs the final render server-side, so the
// router.refresh() picks up new HTML in one round trip.
export function RefineAssetsCard({ campaign }: { campaign: Campaign }) {
  if (!campaign.chosenSkeletonId) return null;
  const skeleton = loadSkeletonById(campaign.chosenSkeletonId);
  if (!skeleton || skeleton.requiredAssets.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold">Refine assets</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Swap any image and the email re-renders automatically. Useful when a
        hero or closing photo doesn&apos;t feel right.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skeleton.requiredAssets.map((slot) => (
          <SlotRefiner
            key={slot.key}
            campaignId={campaign.id}
            slotKey={slot.key}
            slotLabel={slot.label}
            currentUrl={campaign.assetPaths?.[slot.key] ?? null}
          />
        ))}
      </div>
    </section>
  );
}

function SlotRefiner({
  campaignId,
  slotKey,
  slotLabel,
  currentUrl,
}: {
  campaignId: string;
  slotKey: string;
  slotLabel: string;
  currentUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("slotKey", slotKey);
      body.append("file", file);
      const res = await fetch(`/api/campaigns/${campaignId}/fine-tune/asset`, {
        method: "POST",
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Replace failed");
      }
      toast.success(`${slotLabel} replaced — re-rendered.`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Replace failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
      // Reset input so picking the *same* filename twice still triggers change.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg border border-border/60 bg-background p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{slotLabel}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            slot: {slotKey}
          </p>
        </div>
      </div>
      <div className="mb-3 aspect-[16/9] overflow-hidden rounded bg-stone-100">
        {currentUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentUrl}
            alt={`Current ${slotLabel}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No asset uploaded
          </div>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" />
            Replacing…
          </>
        ) : (
          "Replace image"
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
