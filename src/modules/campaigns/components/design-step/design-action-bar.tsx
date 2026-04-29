"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { variantSlug } from "@/modules/campaigns/utils/variant-slug";

export type SavingState = "idle" | "saving" | "saved";

interface Props {
  campaignId: string;
  skeletonId: string;
  savingState: SavingState;
}

// Sticky footer for Step 5. Three regions: Back (left), saving pill
// (center), Send test + Preview (right). Send for approval is
// intentionally absent per product direction.
export function DesignActionBar({ campaignId, skeletonId, savingState }: Props) {
  return (
    <footer className="sticky bottom-0 z-20 border-t border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-6 sm:px-8">
        <Link
          href={`/campaigns/${campaignId}/images`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>

        <div className="mx-auto">
          <SavingPill state={savingState} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Test sends are coming soon.")}
          >
            Send test
          </Button>
          <Link
            href={`/campaigns/${campaignId}/preview/${variantSlug(skeletonId)}`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <ExternalLink className="size-3.5" />
            Preview
          </Link>
        </div>
      </div>
    </footer>
  );
}

function SavingPill({ state }: { state: SavingState }) {
  if (state === "idle") return null;
  const isSaved = state === "saved";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
      <span
        className={cn(
          "size-1.5 rounded-full",
          isSaved ? "bg-success" : "bg-warning",
        )}
        aria-hidden
      />
      {isSaved ? "Saved · auto" : "Saving…"}
    </span>
  );
}
