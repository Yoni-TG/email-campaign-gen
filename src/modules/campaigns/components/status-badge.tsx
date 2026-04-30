import type { CampaignStatus } from "@/lib/types";
import { CAMPAIGN_STATUS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

// Tone palette is small on purpose — neutral / info / warning / success
// covers every state without colour-soup. Pulse only on truly in-flight
// states so it stays meaningful.
type Tone = "neutral" | "info" | "warning" | "success";

interface StatusStyle {
  tone: Tone;
  pulse?: boolean;
}

const STATUS_STYLES: Record<CampaignStatus, StatusStyle> = {
  draft: { tone: "neutral" },
  generating: { tone: "info", pulse: true },
  review: { tone: "warning" },
  rendering_candidates: { tone: "info", pulse: true },
  variant_selection: { tone: "info" },
  asset_upload: { tone: "warning" },
  rendering_final: { tone: "info", pulse: true },
  completed: { tone: "success" },
};

const TONE_PILL: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-3",
  info: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

const TONE_DOT: Record<Tone, string> = {
  neutral: "bg-ink-4",
  info: "bg-info",
  warning: "bg-warning",
  success: "bg-success",
};

// Returns the colour family for the row's left status stripe — same tone
// vocabulary as the pill so the row reads as a single visual unit.
export function statusStripeClass(status: CampaignStatus): string {
  const tone = STATUS_STYLES[status].tone;
  return TONE_DOT[tone];
}

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_PILL[style.tone],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          TONE_DOT[style.tone],
          style.pulse && "animate-pulse",
        )}
        aria-hidden
      />
      {CAMPAIGN_STATUS_LABELS[status]}
    </span>
  );
}
