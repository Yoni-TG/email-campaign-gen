import Link from "next/link";
import { CreativeSeedForm } from "@/modules/campaigns/components/creative-seed-form";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to campaigns
        </Link>
        <h1 className="mt-2 text-2xl font-bold">New Campaign</h1>
        <p className="text-muted-foreground">
          Fill in the creative brief to generate your campaign.
        </p>
      </div>
      <CreativeSeedForm />
    </div>
  );
}
