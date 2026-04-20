"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  ApprovedCopy,
  GeneratedCopy,
  ProductSnapshot,
} from "@/lib/types";
import { initApprovedCopy } from "@/modules/campaigns/utils/copy-init";

export interface UseReviewFormInput {
  campaignId: string;
  generatedCopy: GeneratedCopy;
  generatedProducts: ProductSnapshot[];
}

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

// Drives the review-view state: seeds ApprovedCopy + product list from the
// generation output, edits them in place, and submits /approve followed by
// router.refresh so the next stage takes over.
//
// Input is narrowed to non-nullable fields — the caller is responsible for
// the "has generation data" precondition, so hook calls here are
// unconditional and never re-order across renders.
export function useReviewForm({
  campaignId,
  generatedCopy,
  generatedProducts,
}: UseReviewFormInput): UseReviewFormResult {
  const router = useRouter();
  const [approvedCopy, setApprovedCopy] = useState<ApprovedCopy>(() =>
    initApprovedCopy(generatedCopy),
  );
  const [products, setProducts] =
    useState<ProductSnapshot[]>(generatedProducts);
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
      const res = await fetch(`/api/campaigns/${campaignId}/approve`, {
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
    } finally {
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
