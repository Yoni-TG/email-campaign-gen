"use client";

import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
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
import {
  loadSkeletonById,
  maxProductsRendered,
} from "@/modules/email-templates";
import { AutoSizeIframe } from "./auto-size-iframe";
import { CopyHtmlButton } from "./copy-html-button";
import { EditableEmailFrame } from "./editable-email-frame";

function variantSlug(skeletonId: string): string {
  return skeletonId.replace(/\//g, "__");
}

interface CompletedViewProps {
  campaign: Campaign;
  /** Server-rendered editable HTML — when present, the email below is
   *  click-to-edit. Falls back to the static iframe when null. */
  editableHtml: string | null;
}

export function CompletedView({ campaign, editableHtml }: CompletedViewProps) {
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

      <FinalEmailCard
        campaign={campaign}
        render={campaign.renderResult}
        editableHtml={editableHtml}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BriefCard campaign={campaign} />
        <CopyCard copy={campaign.approvedCopy} />
      </div>

      <ProductsCard
        products={campaign.approvedProducts}
        chosenSkeletonId={campaign.chosenSkeletonId}
      />
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
  hint,
}: {
  title: string;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {hint}
      </header>
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

function ProductsCard({
  products,
  chosenSkeletonId,
}: {
  products: ProductSnapshot[];
  chosenSkeletonId: string | null;
}) {
  // The chosen skeleton's grids cap how many of approvedProducts actually
  // render in the email — anything beyond that lives as reserve in case
  // the operator wants to swap one in. Show only the rendered set; the
  // reserve count is mentioned in the card title so it's not surprising.
  const skeleton = chosenSkeletonId ? loadSkeletonById(chosenSkeletonId) : null;
  const cap = skeleton ? maxProductsRendered(skeleton) : products.length;
  const visible = products.slice(0, cap);
  const reserveCount = products.length - visible.length;

  return (
    <Card
      title={
        reserveCount > 0
          ? `Products in email (${visible.length} · ${reserveCount} held in reserve)`
          : `Products (${visible.length})`
      }
    >
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((product) => {
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

function FinalEmailCard({
  campaign,
  render,
  editableHtml,
}: {
  campaign: Campaign;
  render: FinalRenderResult;
  editableHtml: string | null;
}) {
  return (
    <Card
      title="Final Email"
      hint={
        editableHtml ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Pencil className="h-3 w-3" />
            Click any image, headline, body or CTA to fine-tune
          </span>
        ) : null
      }
    >
      {editableHtml ? (
        <EditableEmailFrame
          campaign={campaign}
          editableHtml={editableHtml}
        />
      ) : (
        <AutoSizeIframe
          title={`final-${render.skeletonId}`}
          srcDoc={render.html}
          className="w-full rounded border border-border/60"
          minHeight={900}
        />
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Rendered {new Date(render.renderedAt).toLocaleString()} · skeleton:{" "}
        {render.skeletonId}
      </p>
    </Card>
  );
}
