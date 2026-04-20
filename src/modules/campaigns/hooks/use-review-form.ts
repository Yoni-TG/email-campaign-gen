"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ApprovedCopy, Campaign, ProductSnapshot } from "@/lib/types";
import { initApprovedCopy } from "@/modules/campaigns/utils/copy-init";

export interface UseReviewFormResult {
  approvedCopy: ApprovedCopy;
  setApprovedCopy: (copy: ApprovedCopy) => void;
  products: ProductSnapshot[];
  setProducts: (products: ProductSnapshot[]) => void;
  addProduct: (product: ProductSnapshot) => void;
  removeProduct: (sku: string) => void;
  isApproving: boolean;
  approve: () => Promise<void>;
}

// Drives the review-view state: initial copy + products seeded from the
// generation output, editable in place, and a submit that hits /approve and
// refreshes the server component so the next stage takes over.
export function useReviewForm(campaign: Campaign): UseReviewFormResult {
  const router = useRouter();

  if (!campaign.generatedCopy || !campaign.generatedProducts) {
    throw new Error(
      `Campaign ${campaign.id} reached review without generatedCopy/generatedProducts.`,
    );
  }

  const [approvedCopy, setApprovedCopy] = useState<ApprovedCopy>(() =>
    initApprovedCopy(campaign.generatedCopy!),
  );
  const [products, setProducts] = useState<ProductSnapshot[]>(
    campaign.generatedProducts,
  );
  const [isApproving, setIsApproving] = useState(false);

  const addProduct = (product: ProductSnapshot) => {
    setProducts((prev) =>
      prev.some((p) => p.sku === product.sku) ? prev : [...prev, product],
    );
  };

  const removeProduct = (sku: string) => {
    setProducts((prev) => prev.filter((p) => p.sku !== sku));
  };

  const approve = async () => {
    if (isApproving) return;
    setIsApproving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedCopy,
          approvedProducts: products,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Approval failed");
      }
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Approval failed";
      toast.error(message);
      setIsApproving(false);
    }
  };

  return {
    approvedCopy,
    setApprovedCopy,
    products,
    setProducts,
    addProduct,
    removeProduct,
    isApproving,
    approve,
  };
}
