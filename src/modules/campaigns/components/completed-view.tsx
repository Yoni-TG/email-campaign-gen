"use client";

import { ExternalLink } from "lucide-react";
import {
  CAMPAIGN_TYPE_LABELS,
  LEAD_PERSONALITY_LABELS,
  LEAD_VALUE_LABELS,
} from "@/lib/types";
import type {
  ApprovedCopy,
  Campaign,
  FigmaResult,
  ProductSnapshot,
} from "@/lib/types";
import {
  formatPrice,
  isOnSale,
} from "@/modules/products/utils/product-price";

export function CompletedView({ campaign }: { campaign: Campaign }) {
  if (
    !campaign.approvedCopy ||
    !campaign.approvedProducts ||
    !campaign.figmaResult
  ) {
    return (
      <p className="text-sm text-destructive">
        Campaign is missing approved data. This shouldn&apos;t happen — try
        re-running fill-figma.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <HeroBanner campaign={campaign} figma={campaign.figmaResult} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BriefCard campaign={campaign} />
        <CopyCard copy={campaign.approvedCopy} />
      </div>

      <ProductsCard products={campaign.approvedProducts} />
      <VariantsCard figma={campaign.figmaResult} />
    </div>
  );
}

// Top banner: hero thumbnail (if uploaded) + the chosen variant + a
// one-click path back to the Figma file.
function HeroBanner({
  campaign,
  figma,
}: {
  campaign: Campaign;
  figma: FigmaResult;
}) {
  const selected = figma.variants.find(
    (v) => v.variantName === figma.selectedVariant,
  );

  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
      {campaign.heroImagePath && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={campaign.heroImagePath}
          alt="Campaign hero"
          className="h-24 w-full shrink-0 rounded-md object-cover sm:w-32"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Selected Layout
        </p>
        <p className="truncate text-base font-semibold">
          {selected?.variantName ?? "—"}
        </p>
        <p className="text-sm text-muted-foreground">
          {CAMPAIGN_TYPE_LABELS[campaign.campaignType]} · {campaign.createdBy}
        </p>
      </div>
      {selected && (
        <a
          href={selected.figmaFrameUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open in Figma
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
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
                // eslint-disable-next-line @next/next/no-img-element
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

function VariantsCard({ figma }: { figma: FigmaResult }) {
  return (
    <Card title="All Variants">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {figma.variants.map((variant) => {
          const isSelected = variant.variantName === figma.selectedVariant;
          return (
            <li
              key={variant.variantName}
              className={`overflow-hidden rounded-lg border ${
                isSelected ? "border-2 border-accent" : "border-border/60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={variant.thumbnailUrl}
                alt={variant.variantName}
                className="w-full"
              />
              <p className="p-2 text-center text-sm">
                {variant.variantName}
                {isSelected && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (selected)
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
