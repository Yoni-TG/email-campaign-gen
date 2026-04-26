import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CampaignList } from "@/modules/campaigns/components/campaign-list";
import { listCampaignSummaries } from "@/modules/campaigns/utils/campaign-persistence";

// DB-backed — must render per request so new campaigns show up immediately.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const campaigns = await listCampaignSummaries();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">
            Theo Grace email campaign generator
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/blocks"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Blocks
          </Link>
          <Link
            href="/skeletons"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skeletons
          </Link>
          <Link href="/campaigns/new">
            <Button>New Campaign</Button>
          </Link>
        </div>
      </div>
      <CampaignList campaigns={campaigns} />
    </div>
  );
}
