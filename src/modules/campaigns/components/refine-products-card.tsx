"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  formatPrice,
  isOnSale,
} from "@/modules/products/utils/product-price";
import type { Campaign, ProductSnapshot } from "@/lib/types";

// Fine-tune card on the completed view — lets the operator swap any
// product's image without changing the SKU. Useful when the SKU is right
// but the feed-supplied photo doesn't fit the design (lifestyle vs
// studio shot, for instance). One Replace button per product. The
// /fine-tune/product-image endpoint persists the new image and re-runs
// renderFinal in one call so router.refresh() picks up the new HTML.
export function RefineProductsCard({ campaign }: { campaign: Campaign }) {
  if (!campaign.approvedProducts || campaign.approvedProducts.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold">Refine products</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Replace the image on any product without swapping the SKU. The email
        re-renders automatically.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {campaign.approvedProducts.map((product) => (
          <ProductImageRefiner
            key={product.sku}
            campaignId={campaign.id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}

function ProductImageRefiner({
  campaignId,
  product,
}: {
  campaignId: string;
  product: ProductSnapshot;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const body = new FormData();
      body.append("sku", product.sku);
      body.append("file", file);
      const res = await fetch(
        `/api/campaigns/${campaignId}/fine-tune/product-image`,
        { method: "POST", body },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Replace failed");
      }
      toast.success(`${product.name} image replaced — re-rendered.`);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Replace failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const showSale = isOnSale(product);

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
      <div className="aspect-square w-full bg-stone-100">
        {product.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-2">
        <p className="truncate text-xs font-medium" title={product.name}>
          {product.name}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
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
        <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
          {product.sku}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full text-xs"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Replacing
            </>
          ) : (
            "Replace image"
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
