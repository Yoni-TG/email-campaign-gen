"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Link as LinkIcon, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  campaignId: string;
  archived: boolean;
}

// Per-row overflow menu. Sits inside the list link as a sibling — but
// since clicking the menu trigger or any item inside a Next.js <Link>
// would also navigate, the trigger swallows the click via
// stopPropagation + preventDefault. The menu renders in a portal so
// vertical scroll inside the list doesn't clip it.
export function CampaignRowMenu({ campaignId, archived }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const toggleArchive = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !archived }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Archive failed");
      }
      toast.success(archived ? "Campaign restored." : "Campaign archived.");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Archive failed";
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}/campaigns/${campaignId}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied.");
    } catch {
      toast.error("Copy failed — clipboard access blocked.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <button
            {...props}
            type="button"
            aria-label="Campaign actions"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.onClick?.(e);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      />
      <DropdownMenuContent align="end" sideOffset={4} className="min-w-44">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            void copyLink();
          }}
        >
          <LinkIcon className="h-3.5 w-3.5" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            void toggleArchive();
          }}
        >
          {archived ? (
            <>
              <ArchiveRestore className="h-3.5 w-3.5" />
              Unarchive
            </>
          ) : (
            <>
              <Archive className="h-3.5 w-3.5" />
              Archive
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
