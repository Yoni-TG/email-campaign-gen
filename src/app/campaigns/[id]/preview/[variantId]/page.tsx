import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AutoSizeIframe } from "@/modules/campaigns/components/auto-size-iframe";
import { CopyHtmlButton } from "@/modules/campaigns/components/copy-html-button";
import { getCampaign } from "@/modules/campaigns/utils/campaign-persistence";

// Stable preview URL for the operator + stakeholders. variantId is the
// skeleton id with slashes replaced by "__" so it survives URL routing.
//
// Resolves in this order:
//   1. final render — when campaign.renderResult.skeletonId matches
//   2. candidate preview — when a CandidateVariant in candidateVariants matches
//   3. 404
//
// Final renders include the operator-uploaded assets; candidate previews
// use placeholders.

interface PageProps {
  params: Promise<{ id: string; variantId: string }>;
}

function decodeVariantId(slug: string): string {
  return slug.replace(/__/g, "/");
}

export default async function PreviewPage({ params }: PageProps) {
  const { id, variantId } = await params;
  const skeletonId = decodeVariantId(variantId);
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const finalMatch =
    campaign.renderResult?.skeletonId === skeletonId
      ? campaign.renderResult
      : null;
  const candidateMatch = !finalMatch
    ? campaign.candidateVariants?.find((v) => v.skeletonId === skeletonId) ??
      null
    : null;

  if (!finalMatch && !candidateMatch) notFound();

  const html = finalMatch ? finalMatch.html : candidateMatch!.previewHtml;
  const phaseLabel = finalMatch ? "Final render" : "Candidate preview";
  const variantName = candidateMatch?.name ?? skeletonId;

  return (
    <div>
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/campaigns/${id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to campaign
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {phaseLabel}
            </p>
            <p className="text-sm font-semibold">{variantName}</p>
            <p className="font-mono text-[11px] text-muted-foreground">
              {skeletonId}
            </p>
          </div>
          <CopyHtmlButton html={html} />
        </div>
      </header>

      <AutoSizeIframe
        title={`${skeletonId} preview`}
        srcDoc={html}
        className="block w-full rounded-lg border border-border bg-white"
        minHeight={900}
      />

      {finalMatch && (
        <p className="mt-3 text-xs text-muted-foreground">
          Rendered {new Date(finalMatch.renderedAt).toLocaleString()}.
        </p>
      )}
    </div>
  );
}
