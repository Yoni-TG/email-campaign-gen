"use client";

import { useEffect, useState } from "react";
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
  /** Initial approved copy / products to seed the form with. Defaults
   *  derive from `generatedCopy`/`generatedProducts`. Passed in when the
   *  operator returns to the step after a prior approve, so we don't
   *  reset their edits. */
  initialApprovedCopy?: ApprovedCopy | null;
  initialApprovedProducts?: ProductSnapshot[] | null;
  /** Override the default `router.refresh()` post-approval. Used by the
   *  wizard step to `router.push` to the next step instead. */
  onSuccess?: (router: ReturnType<typeof useRouter>) => void;
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
  initialApprovedCopy,
  initialApprovedProducts,
  onSuccess,
}: UseReviewFormInput): UseReviewFormResult {
  const router = useRouter();
  const [approvedCopy, setApprovedCopyState] = useState<ApprovedCopy>(
    () => initialApprovedCopy ?? initApprovedCopy(generatedCopy),
  );
  const [products, setProductsState] = useState<ProductSnapshot[]>(
    initialApprovedProducts ?? generatedProducts,
  );
  const [isApproving, setIsApproving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Browser-level navigation guard. Next.js client-side navigation does not
  // fire beforeunload, so this only catches reload / tab-close — good enough
  // for the "you have unsaved review edits" warning.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const setApprovedCopy = (copy: ApprovedCopy) => {
    setApprovedCopyState(copy);
    setDirty(true);
  };

  const setProducts = (next: ProductSnapshot[]) => {
    setProductsState(next);
    setDirty(true);
  };

  const addProduct = (product: ProductSnapshot) => {
    setProductsState((prev) =>
      prev.some((p) => p.sku === product.sku) ? prev : [...prev, product],
    );
    setDirty(true);
  };

  const removeProduct = (sku: string) => {
    setProductsState((prev) => prev.filter((p) => p.sku !== sku));
    setDirty(true);
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
      setDirty(false);
      if (onSuccess) {
        onSuccess(router);
      } else {
        router.refresh();
      }
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
