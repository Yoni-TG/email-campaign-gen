import Link from "next/link";
import { AppTopNav } from "@/modules/campaigns/components/app-top-nav";
import {
  loadAllSkeletons,
  renderSkeleton,
} from "@/modules/email-templates";
import { sampleBlueprint } from "@/modules/email-templates/dev";
import type { CampaignType } from "@/lib/types";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/types";

// Dev catalog of every skeleton in the library, rendered with sample copy +
// products + assets. Mirrors what the operator sees on variant_selection
// during a real campaign — but from a single browsable page.

export const dynamic = "force-static";

export const metadata = {
  title: "Skeleton Catalog · Theo Grace",
};

interface RenderedSkeleton {
  id: string;
  name: string;
  campaignTypes: CampaignType[];
  description: string;
  tags: string[];
  html: string;
}

async function loadRendered(): Promise<RenderedSkeleton[]> {
  const blueprint = sampleBlueprint(true);
  const skeletons = loadAllSkeletons();
  return Promise.all(
    skeletons.map(async (s) => {
      const { html } = await renderSkeleton(s, blueprint, { withAssets: true });
      return {
        id: s.id,
        name: s.name,
        campaignTypes: s.campaignTypes,
        description: s.description,
        tags: s.tags,
        html,
      };
    }),
  );
}

export default async function SkeletonsPage() {
  const rendered = await loadRendered();
  const grouped = new Map<CampaignType, RenderedSkeleton[]>();
  for (const r of rendered) {
    for (const type of r.campaignTypes) {
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type)!.push(r);
    }
  }

  return (
    <>
      <AppTopNav />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
          Email-templates dev catalog
        </p>
        <h1 className="font-serif text-3xl">Skeleton Catalog</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {rendered.length} skeletons grouped by campaign type. Rendered with
          sample copy, products, and asset URLs.{" "}
          <Link href="/blocks" className="underline">
            See blocks →
          </Link>
        </p>
      </header>

      <div className="space-y-10">
        {Array.from(grouped.entries()).map(([type, items]) => (
          <section key={type}>
            <h2 className="mb-4 font-mono text-sm uppercase tracking-widest text-muted-foreground">
              {CAMPAIGN_TYPE_LABELS[type]} · {items.length} skeletons
            </h2>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {items.map((s) => (
                <article
                  key={s.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <header className="border-b border-border/60 p-4">
                    <p className="font-semibold">{s.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {s.id}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {s.description}
                    </p>
                    {s.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </header>
                  <iframe
                    title={s.id}
                    srcDoc={s.html}
                    className="block h-[680px] w-full border-0 bg-white"
                  />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      </div>
    </>
  );
}
