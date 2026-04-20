"use client";

import { Button } from "@/components/ui/button";
import { CopyEditor } from "./copy-editor";
import { ProductGrid } from "@/modules/products/components/product-grid";
import { ProductSearchAdd } from "@/modules/products/components/product-search-add";
import { useReviewForm } from "@/modules/campaigns/hooks/use-review-form";
import type { Campaign } from "@/lib/types";

export function ReviewView({ campaign }: { campaign: Campaign }) {
  const {
    approvedCopy,
    setApprovedCopy,
    products,
    setProducts,
    addProduct,
    isApproving,
    approve,
  } = useReviewForm(campaign);

  const existingSkus = new Set(products.map((p) => p.sku));

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Campaign Copy</h2>
          <CopyEditor
            generatedCopy={campaign.generatedCopy!}
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
