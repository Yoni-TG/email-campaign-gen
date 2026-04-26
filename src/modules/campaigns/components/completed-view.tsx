"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Pencil } from "lucide-react";
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
import { cn } from "@/lib/utils";
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

// Email-first layout. The rendered email is the page's hero — full-width,
// dominant — with all action affordances (Copy HTML, sharable preview)
// pinned to its top toolbar. Brief / approved copy / products are
// collapsed into a single Reference section below the email, default
// closed. The campaign name + status already live in the page header
// (app/campaigns/[id]/page.tsx) so we don't repeat them here.

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
      <FinalEmailCard
        campaign={campaign}
        render={campaign.renderResult}
        editableHtml={editableHtml}
      />
      <ReferenceSection
        campaign={campaign}
        approvedCopy={campaign.approvedCopy}
        approvedProducts={campaign.approvedProducts}
      />
    </div>
  );
}

// ─── Final email card (the hero) ───────────────────────────────

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
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Final Email
          </p>
          {editableHtml ? (
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Pencil className="h-3 w-3" />
              Click any image, headline, body or CTA to fine-tune
            </p>
          ) : (
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
              {render.skeletonId} · rendered{" "}
              {new Date(render.renderedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/campaigns/${campaign.id}/preview/${variantSlug(render.skeletonId)}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Sharable preview
          </Link>
          <CopyHtmlButton html={render.html} />
        </div>
      </header>
      <div className="p-4">
        {editableHtml ? (
          <EditableEmailFrame campaign={campaign} editableHtml={editableHtml} />
        ) : (
          <AutoSizeIframe
            title={`final-${render.skeletonId}`}
            srcDoc={render.html}
            className="w-full rounded border border-border/60"
            minHeight={900}
          />
        )}
      </div>
    </section>
  );
}

// ─── Reference (collapsible) ────────────────────────────────────
//
// Single accordion holding the brief, approved copy, and the products
// list. Default closed so the page lands clean on the email; the
// operator opens it on demand. Inside, items render in a vertical
// stack rather than a 2-up grid — keeps copy readable instead of
// fighting for column space against the brief.

function ReferenceSection({
  campaign,
  approvedCopy,
  approvedProducts,
}: {
  campaign: Campaign;
  approvedCopy: ApprovedCopy;
  approvedProducts: ProductSnapshot[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
        aria-expanded={open}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Reference
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Brief · approved copy · {approvedProducts.length} products
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="space-y-6 border-t border-border/60 p-6">
          <BriefBlock campaign={campaign} />
          <CopyBlock copy={approvedCopy} />
          <ProductsBlock
            products={approvedProducts}
            chosenSkeletonId={campaign.chosenSkeletonId}
          />
        </div>
      )}
    </section>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </h3>
  );
}

function BriefBlock({ campaign }: { campaign: Campaign }) {
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
    <section>
      <SectionHeading>Brief</SectionHeading>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {visible.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[110px_1fr] gap-3 border-t border-border/60 pt-2 first:border-t-0 first:pt-0"
          >
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="min-w-0 break-words">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function CopyBlock({ copy }: { copy: ApprovedCopy }) {
  return (
    <section>
      <SectionHeading>Approved Copy</SectionHeading>
      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
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
          <div className="sm:col-span-2">
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
        <div className="sm:col-span-2">
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
          <div className="sm:col-span-2">
            <p className="text-xs uppercase text-muted-foreground">SMS</p>
            <p>{copy.sms}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductsBlock({
  products,
  chosenSkeletonId,
}: {
  products: ProductSnapshot[];
  chosenSkeletonId: string | null;
}) {
  const skeleton = chosenSkeletonId ? loadSkeletonById(chosenSkeletonId) : null;
  const cap = skeleton ? maxProductsRendered(skeleton) : products.length;
  const visible = products.slice(0, cap);
  const reserveCount = products.length - visible.length;

  return (
    <section>
      <SectionHeading>
        {reserveCount > 0
          ? `Products in email · ${visible.length} (· ${reserveCount} held in reserve)`
          : `Products · ${visible.length}`}
      </SectionHeading>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {visible.map((product) => {
          const showSale = isOnSale(product);
          return (
            <li
              key={product.sku}
              className="overflow-hidden rounded-lg border border-border/60 bg-background"
            >
              {product.imageUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="aspect-square w-full object-cover"
                />
              )}
              <div className="p-2">
                <p className="truncate text-[11px] font-medium">{product.name}</p>
                <p className="text-[11px] text-muted-foreground">
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
    </section>
  );
}
