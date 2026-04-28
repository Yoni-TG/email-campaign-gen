"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProductSearch } from "@/modules/products/hooks/use-product-search";
import { ProductSearchSkeleton } from "./product-search-skeleton";
import type { ProductSnapshot } from "@/lib/types";

interface ProductPickerProps {
  selected: ProductSnapshot[];
  onChange: (products: ProductSnapshot[]) => void;
}

export function ProductPicker({ selected, onChange }: ProductPickerProps) {
  const [query, setQuery] = useState("");
  const { results, isSearching } = useProductSearch(query);
  const selectedSkus = new Set(selected.map((p) => p.sku));

  const addProduct = (product: ProductSnapshot) => {
    if (!selectedSkus.has(product.sku)) {
      onChange([...selected, product]);
    }
    setQuery("");
  };

  const removeProduct = (sku: string) => {
    onChange(selected.filter((p) => p.sku !== sku));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Input
          placeholder="Search products by name or SKU…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query.length >= 2 && (results.length > 0 || isSearching) && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover shadow-lg">
            {isSearching && results.length === 0 && (
              <ProductSearchSkeleton />
            )}
            {results.map((product) => (
              <button
                key={product.sku}
                type="button"
                className="flex w-full items-center gap-3 p-2 text-left hover:bg-muted disabled:opacity-50"
                disabled={selectedSkus.has(product.sku)}
                onClick={() => addProduct(product)}
              >
                {product.imageUrl && (
                  // Remote CDN — keeping <img> to avoid next/image remotePatterns config mid-phase.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.sku} · {product.currency} {product.salePrice || product.price}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((product) => (
            <li
              key={product.sku}
              className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm"
            >
              <span>{product.name}</span>
              <button
                type="button"
                onClick={() => removeProduct(product.sku)}
                aria-label={`Remove ${product.name}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
