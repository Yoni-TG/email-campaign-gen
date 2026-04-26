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

// ─── Reference (collapsible + tabs) ─────────────────────────────
//
// Single accordion with three tabs inside — Brief / Approved Copy /
// Products. Tabs solve the "everything packed together" problem of a
// flat stack: only one section paints at a time, giving each its own
// breathing room. Default closed so the page lands clean on the
// email; the operator opens it on demand.

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
        <div className="border-t border-border/60">
          <nav
            role="tablist"
            className="flex gap-1 border-b border-border/60 px-4 pt-3"
          >
            <TabButton
              active={tab === "brief"}
              onClick={() => setTab("brief")}
            >
              Brief
            </TabButton>
            <TabButton
              active={tab === "copy"}
              onClick={() => setTab("copy")}
            >
              Approved Copy
            </TabButton>
            <TabButton
              active={tab === "products"}
              onClick={() => setTab("products")}
            >
              Products · {approvedProducts.length}
            </TabButton>
          </nav>
          <div className="p-6">
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

function TabButton({
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
        "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
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
