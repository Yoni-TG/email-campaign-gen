"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { ArrowUp, ImagePlus } from "lucide-react";
import { useAssetUpload } from "@/modules/campaigns/hooks/use-asset-upload";
import { loadSkeletonById } from "@/modules/email-templates/skeletons";
import type { Campaign } from "@/lib/types";
import type { AssetSlot } from "@/modules/email-templates";
import { cn } from "@/lib/utils";
import { WizardActionBar } from "./wizard-action-bar";

interface Props {
  campaign: Campaign;
}

// Step 4 (Images) — Direction A. Single centered column with one
// dropzone card per skeleton-declared asset slot, page-level drop
// handler that auto-fills empty slots in declaration order, and a
// sticky action bar that fires the existing upload-all → render-final
// chain when the operator continues.
export function ImageUploadView({ campaign }: Props) {
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
    {
      // Push to step 5. The /design route currently redirects to the
      // status dispatcher while renderResult is still null (rendering
      // in flight), so the operator transiently lands on
      // RenderingFinalView; once render completes they can navigate to
      // /design. Tightening this hand-off (poll-on-/design) is a
      // separate cross-cutting follow-up.
      onSuccess: (router) => router.push(`/campaigns/${campaign.id}/design`),
    },
  );

  if (!skeleton) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-sm text-destructive">
        Missing chosen skeleton — pick a layout first.
      </main>
    );
  }

  const filledCount = slotsList.filter(
    (s) => slots[s.key]?.file ?? campaign.assetPaths?.[s.key],
  ).length;
  const requiredPending = slotsList.filter(
    (s) => s.required && !(slots[s.key]?.file ?? campaign.assetPaths?.[s.key]),
  ).length;

  if (slotsList.length === 0) {
    return (
      <ZeroSlotState
        skeletonName={skeleton.name}
        backHref={`/campaigns/${campaign.id}/layout`}
        campaignId={campaign.id}
      />
    );
  }

  return (
    <PageDropTarget
      onFiles={(files) => fillEmptySlotsFromFiles(files, slotsList, slots, setFile)}
    >
      <div className="bg-bg pb-10">
        <main className="mx-auto w-full max-w-2xl px-6 pt-12 pb-6 sm:px-8">
          <header>
            <h1 className="font-display text-4xl leading-tight text-ink">
              Add your images
            </h1>
            <p className="mt-2 text-sm text-ink-3">
              Drop them in or click any slot. Optional slots can stay empty —
              the renderer will use placeholders.
            </p>
          </header>

          <ul className="mt-10 space-y-5">
            {slotsList.map((slot) => (
              <li key={slot.key}>
                <SlotCard
                  slot={slot}
                  file={slots[slot.key]?.file ?? null}
                  preview={slots[slot.key]?.preview ?? null}
                  persistedUrl={campaign.assetPaths?.[slot.key] ?? null}
                  onPick={(file) => setFile(slot.key, file)}
                  onClear={() => setFile(slot.key, null)}
                />
              </li>
            ))}
          </ul>

          <DropHintBanner />
        </main>

        <WizardActionBar
          backHref={`/campaigns/${campaign.id}/layout`}
          helper={
            <>
              <strong className="font-medium text-ink-2">
                {filledCount} of {slotsList.length}
              </strong>{" "}
              slot{slotsList.length === 1 ? "" : "s"} filled
              {requiredPending > 0 && (
                <>
                  {" · "}
                  {requiredPending} required pending
                </>
              )}
            </>
          }
          primary={
            <button
              type="button"
              onClick={() => void uploadAll()}
              disabled={isUploading || requiredPending > 0}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? "Uploading…" : "Generate design →"}
            </button>
          }
        />
      </div>
    </PageDropTarget>
  );
}

// ─── Slot card ───

function SlotCard({
  slot,
  file,
  preview,
  persistedUrl,
  onPick,
  onClear,
}: {
  slot: AssetSlot;
  file: File | null;
  preview: string | null;
  persistedUrl: string | null;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewSrc = preview ?? persistedUrl;
  const isFilled = Boolean(previewSrc);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0];
    if (next) onPick(next);
    e.target.value = "";
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("image/")) onPick(dropped);
  };

  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg bg-surface transition-colors",
        isFilled ? "border border-border" : "border border-border-strong",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
            {slot.label}
          </p>
          <p className="text-[11px] text-ink-4">
            {slot.required ? "Required" : "Optional"}
          </p>
        </div>
        {isFilled ? (
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-brand hover:underline"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onClear}
              className="text-ink-3 hover:text-ink"
            >
              Clear
            </button>
          </div>
        ) : null}
      </header>
      <div
        role={isFilled ? undefined : "button"}
        tabIndex={isFilled ? -1 : 0}
        onClick={isFilled ? undefined : () => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (isFilled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "relative flex min-h-[180px] items-center justify-center bg-surface-2",
          !isFilled &&
            "cursor-pointer border-t-0 border-2 border-dashed border-border-strong text-ink-3 transition-colors hover:border-ink-3 hover:text-ink-2",
        )}
      >
        {previewSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewSrc}
            alt={`${slot.label} preview`}
            className="block h-auto max-h-[360px] w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-6">
            <ImagePlus className="size-5" aria-hidden />
            <p className="text-sm font-medium">Click or drop</p>
            <p className="text-xs text-ink-4">JPG, PNG, or WebP</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
      </div>
    </article>
  );
}

// ─── Drop hint banner ───

function DropHintBanner() {
  return (
    <div className="mt-8 flex items-center gap-3 rounded-md bg-surface-2 px-4 py-3 text-sm text-ink-3">
      <ArrowUp className="size-4 text-ink-3" aria-hidden />
      Drop images anywhere on the page — we&apos;ll match them to slots
      automatically.
    </div>
  );
}

// ─── Page-level drop target ───
//
// Wraps the page so a drop anywhere fills empty slots in declaration
// order. Per-slot dropzones still capture their own drops first
// (stopPropagation on the slot's onDrop) so a deliberate drop on a slot
// stays in that slot.
function PageDropTarget({
  onFiles,
  children,
}: {
  onFiles: (files: File[]) => void;
  children: React.ReactNode;
}) {
  const [isOver, setIsOver] = useState(false);

  // Window-level dragover prevents the browser from "opening" the file
  // when the operator misses our wrapper. Without this, a stray drop
  // navigates away from the wizard.
  useEffect(() => {
    const prevent = (e: globalThis.DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("Files")) setIsOver(true);
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    // Only clear when leaving the wrapper, not crossing child boundaries.
    if (e.currentTarget === e.target) setIsOver(false);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative",
        isOver && "outline outline-2 outline-brand outline-offset-[-4px]",
      )}
    >
      {children}
    </div>
  );
}

function fillEmptySlotsFromFiles(
  files: File[],
  slotsList: AssetSlot[],
  slots: Record<string, { file: File | null }>,
  setFile: (slotKey: string, file: File | null) => void,
) {
  const empty = slotsList.filter((s) => !slots[s.key]?.file);
  for (let i = 0; i < Math.min(empty.length, files.length); i++) {
    setFile(empty[i].key, files[i]);
  }
}

// ─── 0-slot edge case ───
//
// Skeletons can declare 0 required assets (e.g. graphic-led mystery-sale).
// The current backend doesn't auto-advance these — surfacing the state
// here so the operator at least knows where they are. Bottom-bar
// Continue points back to the status dispatcher so they can use the
// legacy AssetUploadView's Continue (which has the same limitation).
function ZeroSlotState({
  skeletonName,
  backHref,
  campaignId,
}: {
  skeletonName: string;
  backHref: string;
  campaignId: string;
}) {
  return (
    <>
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl text-ink">
          No images needed for this layout
        </h1>
        <p className="mt-3 text-sm text-ink-3">
          {skeletonName} is graphic-led — there&apos;s nothing to upload here.
        </p>
      </main>
      <WizardActionBar
        backHref={backHref}
        primary={
          <a
            href={`/campaigns/${campaignId}`}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-surface transition-opacity hover:opacity-90"
          >
            Continue →
          </a>
        }
      />
    </>
  );
}
