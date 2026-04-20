"use client";

import { Button } from "@/components/ui/button";
import { CopyEditor } from "./copy-editor";
import { ProductGrid } from "@/modules/products/components/product-grid";
import { ProductSearchAdd } from "@/modules/products/components/product-search-add";
import { useReviewForm } from "@/modules/campaigns/hooks/use-review-form";
import type { Campaign } from "@/lib/types";

export function ReviewView({ campaign }: { campaign: Campaign }) {
  if (!campaign.generatedCopy || !campaign.generatedProducts) {
    // State machine should prevent this, but render a safe fallback so we
    // never mount useReviewForm without its required data.
    return (
      <p className="text-sm text-destructive">
        Campaign is missing generated copy or products — re-run generation.
      </p>
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
    <div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Campaign Copy</h2>
          <CopyEditor
            generatedCopy={generatedCopy}
            value={approvedCopy}
            onChange={setApprovedCopy}
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Products ({products.length})
          </h2>
          <div className="mb-4">
            <ProductSearchAdd existingSkus={existingSkus} onAdd={addProduct} />
          </div>
          <ProductGrid products={products} onChange={setProducts} />
        </section>
      </div>

      <div className="mt-8 flex justify-end border-t pt-6">
        <Button onClick={approve} disabled={isApproving} size="lg">
          {isApproving ? "Approving…" : "Approve & Continue"}
        </Button>
      </div>
    </div>
  );
}
