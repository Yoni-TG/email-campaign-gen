"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  CAMPAIGN_TYPE_LABELS,
  LEAD_PERSONALITY_LABELS,
  LEAD_VALUE_LABELS,
} from "@/lib/types";
import type {
  ApprovedCopy,
  Campaign,
  FinalRenderResult,
  ProductSnapshot,
} from "@/lib/types";
import {
  formatPrice,
  isOnSale,
} from "@/modules/products/utils/product-price";
import { AutoSizeIframe } from "./auto-size-iframe";
import { CopyHtmlButton } from "./copy-html-button";

function variantSlug(skeletonId: string): string {
  return skeletonId.replace(/\//g, "__");
}

export function CompletedView({ campaign }: { campaign: Campaign }) {
  if (
    !campaign.approvedCopy ||
    !campaign.approvedProducts ||
    !campaign.renderResult
  ) {
    return (
      <p className="text-sm text-destructive">
        Campaign is missing approved data or final render. Try re-running
        render-final.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PreviewBanner campaign={campaign} render={campaign.renderResult} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BriefCard campaign={campaign} />
        <CopyCard copy={campaign.approvedCopy} />
      </div>

      <ProductsCard products={campaign.approvedProducts} />
      <FinalEmailCard render={campaign.renderResult} />
    </div>
  );
}

function PreviewBanner({
  campaign,
  render,
}: {
  campaign: Campaign;
  render: FinalRenderResult;
}) {
  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Selected Layout
        </p>
        <p className="truncate text-base font-semibold">{render.skeletonId}</p>
        <p className="text-sm text-muted-foreground">
          {CAMPAIGN_TYPE_LABELS[campaign.campaignType]} · {campaign.createdBy}
        </p>
      </div>
      <Link
        href={`/campaigns/${campaign.id}/preview/${variantSlug(render.skeletonId)}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Sharable preview
      </Link>
      <CopyHtmlButton html={render.html} />
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function BriefCard({ campaign }: { campaign: Campaign }) {
  const rows: Array<[string, string | null]> = [
    ["Type", CAMPAIGN_TYPE_LABELS[campaign.campaignType]],
    ["Lead value", LEAD_VALUE_LABELS[campaign.seed.leadValue]],
    [
      "Personalities",
      campaign.seed.leadPersonalities
        .map((p) => LEAD_PERSONALITY_LABELS[p])
        .join(", "),
    ],
    ["Categories", campaign.seed.targetCategories.join(", ")],
    ["Main message", campaign.seed.mainMessage],
    ["Promo", campaign.seed.promoDetails ?? null],
    ["Secondary", campaign.seed.secondaryMessage ?? null],
    ["Notes", campaign.seed.additionalNotes ?? null],
  ];
  const visible = rows.filter(([, v]) => v && v.length > 0);

  return (
    <Card title="Brief">
      <dl className="space-y-3 text-sm">
        {visible.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[110px_1fr] gap-3 border-t border-border/60 pt-3 first:border-t-0 first:pt-0"
          >
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="min-w-0 break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function CopyCard({ copy }: { copy: ApprovedCopy }) {
  return (
    <Card title="Approved Copy">
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Subject</p>
          <p className="font-medium">{copy.subject_variant.subject}</p>
          <p className="text-muted-foreground">
            {copy.subject_variant.preheader}
          </p>
        </div>

        {copy.free_top_text && (
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              Free Top Text
            </p>
            <p>{copy.free_top_text}</p>
          </div>
        )}

        {copy.nicky_quote && (
          <div>
            <p className="text-xs uppercase text-muted-foreground">
              Nicky Quote
            </p>
            <p className="italic">&ldquo;{copy.nicky_quote.quote}&rdquo;</p>
            <p className="text-muted-foreground">
              — Nicky Hilton
              {copy.nicky_quote.response && (
                <span> | {copy.nicky_quote.response}</span>
              )}
            </p>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs uppercase text-muted-foreground">
            Body Blocks
          </p>
          <ol className="space-y-2">
            {copy.body_blocks.map((block, i) => (
              <li
                key={i}
                className="rounded-md border border-border/60 bg-muted/30 p-3"
              >
                {block.title && <p className="font-medium">{block.title}</p>}
                {block.description && (
                  <p className="mt-1 text-muted-foreground">
                    {block.description}
                  </p>
                )}
                {block.cta && (
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide">
                    CTA: {block.cta}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>

        {copy.sms && (
          <div>
            <p className="text-xs uppercase text-muted-foreground">SMS</p>
            <p>{copy.sms}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function ProductsCard({ products }: { products: ProductSnapshot[] }) {
  return (
    <Card title={`Products (${products.length})`}>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          const showSale = isOnSale(product);
          return (
            <li
              key={product.sku}
              className="overflow-hidden rounded-lg border border-border/60 bg-card"
            >
              {product.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-32 w-full object-cover"
                />
              )}
              <div className="p-2">
                <p className="truncate text-xs font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {showSale ? (
                    <>
                      <span className="line-through">
                        {formatPrice(product.price, product.currency)}
                      </span>{" "}
                      {formatPrice(product.salePrice, product.currency)}
                    </>
                  ) : (
                    formatPrice(product.price, product.currency)
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function FinalEmailCard({ render }: { render: FinalRenderResult }) {
  return (
    <Card title="Final Email">
      <AutoSizeIframe
        title={`final-${render.skeletonId}`}
        srcDoc={render.html}
        className="w-full rounded border border-border/60"
        minHeight={900}
      />
      <p className="mt-3 text-xs text-muted-foreground">
        Rendered {new Date(render.renderedAt).toLocaleString()} · skeleton:{" "}
        {render.skeletonId}
      </p>
    </Card>
  );
}
