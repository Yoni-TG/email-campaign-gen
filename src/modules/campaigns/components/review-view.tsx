"use client";

import { Button } from "@/components/ui/button";
import { CopyEditor } from "./copy-editor";
import { ProductGrid } from "@/modules/products/components/product-grid";
import { ProductSearchAdd } from "@/modules/products/components/product-search-add";
import { useReviewForm } from "@/modules/campaigns/hooks/use-review-form";
import type { Campaign } from "@/lib/types";

export function ReviewView({ campaign }: { campaign: Campaign }) {
  if (!campaign.generatedCopy || !campaign.generatedProducts) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-destructive">
          Campaign is missing generated copy or products — re-run generation.
        </p>
      </div>
    );
  }

  return (
    <ReviewBody
      campaign={campaign}
      generatedCopy={campaign.generatedCopy}
      generatedProducts={campaign.generatedProducts}
    />
  );
}

// Split so useReviewForm only mounts when the preconditions are satisfied.
// Keeps hook order stable across renders (no throw between hook calls).
function ReviewBody({
  campaign,
  generatedCopy,
  generatedProducts,
}: {
  campaign: Campaign;
  generatedCopy: NonNullable<Campaign["generatedCopy"]>;
  generatedProducts: NonNullable<Campaign["generatedProducts"]>;
}) {
  const {
    approvedCopy,
    setApprovedCopy,
    products,
    setProducts,
    addProduct,
    isApproving,
    approve,
  } = useReviewForm({
    campaignId: campaign.id,
    generatedCopy,
    generatedProducts,
  });

  const existingSkus = new Set(products.map((p) => p.sku));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold text-foreground">
            Campaign Copy
          </h2>
          <CopyEditor
            generatedCopy={generatedCopy}
            value={approvedCopy}
            onChange={setApprovedCopy}
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Products</h2>
            <span className="text-sm text-muted-foreground">
              {products.length} selected
            </span>
          </div>
          <div className="mb-4">
            <ProductSearchAdd existingSkus={existingSkus} onAdd={addProduct} />
          </div>
          <ProductGrid products={products} onChange={setProducts} />
        </section>
      </div>

      <div className="flex justify-end">
        <Button onClick={approve} disabled={isApproving} size="lg">
          {isApproving ? "Approving…" : "Approve & Continue"}
        </Button>
      </div>
    </div>
  );
}
