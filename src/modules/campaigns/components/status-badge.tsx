import { Badge } from "@/components/ui/badge";
import type { CampaignStatus } from "@/lib/types";
import { CAMPAIGN_STATUS_LABELS } from "@/lib/types";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// Variant is purely visual — the label itself lives on CAMPAIGN_STATUS_LABELS
// so the detail/review pages can reuse it without importing the badge.
const STATUS_VARIANTS: Record<CampaignStatus, BadgeVariant> = {
  draft: "outline",
  generating: "secondary",
  review: "default",
  hero_upload: "default",
  filling_figma: "secondary",
  variant_selection: "default",
  completed: "outline",
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {CAMPAIGN_STATUS_LABELS[status]}
    </Badge>
  );
}
