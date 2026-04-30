"use client";

import Link from "next/link";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { SaveStatusPill } from "@/components/save-status-pill";
import type { AutoSaveStatus } from "@/lib/use-auto-save";
import { cn } from "@/lib/utils";
import { variantSlug } from "@/modules/campaigns/utils/variant-slug";
import { CopyHtmlButton } from "../copy-html-button";

interface Props {
  campaignId: string;
  skeletonId: string;
  savingState: AutoSaveStatus;
  savedAt: Date | null;
  /** Final rendered HTML for the Copy HTML button. Klaviyo paste-in is
   *  the v1 hand-off; the API push is deferred. */
  html: string;
}

// Sticky footer for Step 5. Three regions: Back (left), saving pill
// (center), Send test / Preview / Copy HTML / Done (right). "Done" is
// not "Send" — sending is Klaviyo's job. Done just exits the wizard
// back to the campaigns list.
export function DesignActionBar({
  campaignId,
  skeletonId,
  savingState,
  savedAt,
  html,
}: Props) {
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
          <SaveStatusPill status={savingState} savedAt={savedAt} />
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
          <CopyHtmlButton html={html} size="sm" variant="outline" />
          <Link
            href="/"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Check className="size-3.5" />
            Done
          </Link>
        </div>
      </div>
    </footer>
  );
}
