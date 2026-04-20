"use client";

import type { CampaignStatus } from "@/lib/types";
import { CAMPAIGN_STATUS_DESCRIPTIONS } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "./status-badge";

// Client wrapper that adds a tooltip with the status description. Use this
// on interactive surfaces (the home-page list) where hover discovery pays
// off; use the plain StatusBadge in headers / summary views where the
// status is already contextualised.
export function StatusBadgeWithTooltip({ status }: { status: CampaignStatus }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <span {...props}>
            <StatusBadge status={status} />
          </span>
        )}
      />
      <TooltipContent>{CAMPAIGN_STATUS_DESCRIPTIONS[status]}</TooltipContent>
    </Tooltip>
  );
}
