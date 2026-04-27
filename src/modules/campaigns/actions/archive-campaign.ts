import type { Campaign } from "@/lib/types";
import { updateCampaign } from "@/modules/campaigns/utils/campaign-persistence";

// Soft-archive a campaign by stamping `archivedAt`. Default-list views hide
// archived rows; the operator switches to the archived scope to see them.
// Idempotent — archiving an already-archived row keeps the original
// timestamp so the audit trail isn't bumped on a duplicate click.
export async function archiveCampaign(
  campaign: Campaign,
  archived: boolean,
): Promise<{ archivedAt: Date | null }> {
  if (archived && campaign.archivedAt) {
    return { archivedAt: campaign.archivedAt };
  }
  if (!archived && campaign.archivedAt === null) {
    return { archivedAt: null };
  }
  const archivedAt = archived ? new Date() : null;
  await updateCampaign(campaign.id, { archivedAt });
  return { archivedAt };
}
