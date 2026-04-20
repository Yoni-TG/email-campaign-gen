"use client";

import { Separator } from "@/components/ui/separator";
import {
  CAMPAIGN_TYPE_LABELS,
  LEAD_PERSONALITY_LABELS,
  LEAD_VALUE_LABELS,
} from "@/lib/types";
import type { Campaign } from "@/lib/types";

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

  const copy = campaign.approvedCopy;
  const products = campaign.approvedProducts;
  const figma = campaign.figmaResult;
  const selectedVariant = figma.variants.find(
    (v) => v.variantName === figma.selectedVariant,
  );

  return (
    <div className="space-y-8">
      {selectedVariant && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h3 className="mb-1 font-semibold">
            Selected Layout: {selectedVariant.variantName}
          </h3>
          <a
            href={selectedVariant.figmaFrameUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Open in Figma →
          </a>
        </div>
      )}

      <section>
        <h3 className="mb-2 font-semibold">Campaign Brief</h3>
        <dl className="space-y-1 text-sm text-muted-foreground">
          <div>
            <dt className="inline font-medium">Type:</dt>{" "}
            <dd className="inline">
              {CAMPAIGN_TYPE_LABELS[campaign.campaignType]}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Lead value:</dt>{" "}
            <dd className="inline">
              {LEAD_VALUE_LABELS[campaign.seed.leadValue]}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Personalities:</dt>{" "}
            <dd className="inline">
              {campaign.seed.leadPersonalities
                .map((p) => LEAD_PERSONALITY_LABELS[p])
                .join(", ")}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Categories:</dt>{" "}
            <dd className="inline">
              {campaign.seed.targetCategories.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium">Main message:</dt>{" "}
            <dd className="inline">{campaign.seed.mainMessage}</dd>
          </div>
          {campaign.seed.promoDetails && (
            <div>
              <dt className="inline font-medium">Promo:</dt>{" "}
              <dd className="inline">{campaign.seed.promoDetails}</dd>
            </div>
          )}
        </dl>
      </section>

      {campaign.heroImagePath && (
        <>
          <Separator />
          <section>
            <h3 className="mb-2 font-semibold">Hero Image</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campaign.heroImagePath}
              alt="Campaign hero"
              className="max-h-64 rounded border"
            />
          </section>
        </>
      )}

      <Separator />

      <section>
        <h3 className="mb-3 font-semibold">Approved Copy</h3>
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
            <p className="text-xs uppercase text-muted-foreground">
              Body Blocks
            </p>
            <ol className="mt-1 space-y-3">
              {copy.body_blocks.map((block, i) => (
                <li key={i} className="rounded border bg-gray-50 p-3">
                  {block.title && (
                    <p className="font-medium">{block.title}</p>
                  )}
                  {block.description && (
                    <p className="mt-1 text-muted-foreground">
                      {block.description}
                    </p>
                  )}
                  {block.cta && (
                    <p className="mt-1 text-xs font-medium uppercase">
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
      </section>

      <Separator />

      <section>
        <h3 className="mb-3 font-semibold">Products ({products.length})</h3>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const showSale =
              product.salePrice && product.salePrice !== product.price;
            return (
              <li
                key={product.sku}
                className="overflow-hidden rounded-lg border bg-white"
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
                          {product.currency} {product.price}
                        </span>{" "}
                        {product.currency} {product.salePrice}
                      </>
                    ) : (
                      `${product.currency} ${product.price}`
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <Separator />

      <section>
        <h3 className="mb-3 font-semibold">All Variants</h3>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {figma.variants.map((variant) => {
            const isSelected = variant.variantName === figma.selectedVariant;
            return (
              <li
                key={variant.variantName}
                className={`overflow-hidden rounded-lg border ${
                  isSelected ? "border-2 border-primary" : ""
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
                  {isSelected && " (selected)"}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
