import type { CampaignStatus } from "@/lib/types";
import { CAMPAIGN_STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusStyle {
  bg: string;
  text: string;
  ring: string;
  dot: string;
  /** Whether the dot should pulse — reserve for "AI is working" states. */
  pulse?: boolean;
}

// Bookends neutral/green. Automated-in-progress cool (sky/violet). User-
// action warm (amber/rose/indigo). All pairs are ≥4.5:1 on white.
const STATUS_STYLES: Record<CampaignStatus, StatusStyle> = {
  draft: {
    bg: "bg-stone-100",
    text: "text-stone-700",
    ring: "ring-stone-200",
    dot: "bg-stone-400",
  },
  generating: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    ring: "ring-sky-200",
    dot: "bg-sky-500",
    pulse: true,
  },
  review: {
    bg: "bg-amber-50",
    text: "text-amber-900",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
  },
  rendering_candidates: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    ring: "ring-violet-200",
    dot: "bg-violet-500",
    pulse: true,
  },
  variant_selection: {
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    ring: "ring-indigo-200",
    dot: "bg-indigo-500",
  },
  asset_upload: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    ring: "ring-rose-200",
    dot: "bg-rose-500",
  },
  rendering_final: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    ring: "ring-violet-200",
    dot: "bg-violet-500",
    pulse: true,
  },
  completed: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
  },
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        s.bg,
        s.text,
        s.ring,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          s.dot,
          s.pulse && "animate-pulse",
        )}
        aria-hidden
      />
      {CAMPAIGN_STATUS_LABELS[status]}
    </span>
  );
}
