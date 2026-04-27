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
import { buttonVariants } from "@/components/ui/button";
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

// Email-first layout. The rendered email is the page's hero — pinned to
// its real ~640px width inside a tinted "inbox" backdrop so it reads as a
// rendered email, not a stretched white box. Toolbar above the email:
// editing-state chip + skeleton id on the left, secondary Preview link
// + primary Copy HTML on the right. Brief / approved copy / products
// collapse into a single Reference section below, default closed.

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
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">Final email</h2>
          {editableHtml ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-inset ring-emerald-200">
              <Pencil className="h-3 w-3" />
              Editing enabled
            </span>
          ) : null}
          <span
            className="hidden truncate font-mono text-[11px] text-muted-foreground sm:inline"
            title={`Rendered ${new Date(render.renderedAt).toLocaleString()}`}
          >
            {render.skeletonId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/campaigns/${campaign.id}/preview/${variantSlug(render.skeletonId)}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            title="Open sharable preview in a new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </Link>
          <CopyHtmlButton html={render.html} />
        </div>
      </header>
      {editableHtml ? (
        <EditableEmailFrame campaign={campaign} editableHtml={editableHtml} />
      ) : (
        <AutoSizeIframe
          title={`final-${render.skeletonId}`}
          srcDoc={render.html}
          className="block w-full bg-white"
          minHeight={900}
        />
      )}
    </section>
  );
}

// ─── Reference (collapsible + segmented tabs) ───────────────────
//
// Single accordion with a segmented control inside — Brief / Approved
// Copy / Products. Default closed so the page lands clean on the email;
// the operator opens it on demand. The segmented control reads as
// "switch view" more clearly than a flat tab-bar.

type ReferenceTab = "brief" | "copy" | "products";

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
  const [tab, setTab] = useState<ReferenceTab>("brief");
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-5 py-3 text-left hover:bg-muted/40"
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
        <span className="text-sm font-semibold text-foreground">Reference</span>
        <span className="truncate text-sm text-muted-foreground">
          Brief · Approved copy · {approvedProducts.length} products
        </span>
      </button>
      {open && (
        <div className="border-t border-border/60">
          <div className="px-5 pt-4">
            <div
              role="tablist"
              className="inline-flex rounded-lg bg-muted p-1 text-sm"
            >
              <SegmentButton
                active={tab === "brief"}
                onClick={() => setTab("brief")}
              >
                Brief
              </SegmentButton>
              <SegmentButton
                active={tab === "copy"}
                onClick={() => setTab("copy")}
              >
                Approved copy
              </SegmentButton>
              <SegmentButton
                active={tab === "products"}
                onClick={() => setTab("products")}
              >
                Products · {approvedProducts.length}
              </SegmentButton>
            </div>
          </div>
          <div className="px-5 pb-6 pt-5">
            {tab === "brief" && <BriefBlock campaign={campaign} />}
            {tab === "copy" && <CopyBlock copy={approvedCopy} />}
            {tab === "products" && (
              <ProductsBlock
                products={approvedProducts}
                chosenSkeletonId={campaign.chosenSkeletonId}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
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
    <dl className="divide-y divide-border/60 text-sm">
      {visible.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[140px_1fr] gap-4 py-3 first:pt-0 last:pb-0">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function CopyBlock({ copy }: { copy: ApprovedCopy }) {
  return (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Subject">
          <p className="font-medium">{copy.subject_variant.subject}</p>
          <p className="mt-0.5 text-muted-foreground">
            {copy.subject_variant.preheader}
          </p>
        </Field>
        {copy.free_top_text && (
          <Field label="Free Top Text">
            <p>{copy.free_top_text}</p>
          </Field>
        )}
      </div>

      {copy.nicky_quote && (
        <Field label="Nicky Quote">
          <p className="italic">&ldquo;{copy.nicky_quote.quote}&rdquo;</p>
          <p className="mt-0.5 text-muted-foreground">
            — Nicky Hilton
            {copy.nicky_quote.response && (
              <span> · {copy.nicky_quote.response}</span>
            )}
          </p>
        </Field>
      )}

      <Field label="Body Blocks">
        <ol className="space-y-2">
          {copy.body_blocks.map((block, i) => (
            <li
              key={i}
              className="rounded-md border border-border/60 bg-muted/30 p-3"
            >
              {block.title && <p className="font-medium">{block.title}</p>}
              {block.description && (
                <p className="mt-1 text-muted-foreground">{block.description}</p>
              )}
              {block.cta && (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide">
                  CTA: {block.cta}
                </p>
              )}
            </li>
          ))}
        </ol>
      </Field>

      {copy.sms && (
        <Field label="SMS">
          <p>{copy.sms}</p>
        </Field>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
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
    <div className="space-y-3">
      {reserveCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {visible.length} in email · {reserveCount} held in reserve
        </p>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
              <div className="p-2.5">
                <p className="truncate text-xs font-medium">{product.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
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
    </div>
  );
}
