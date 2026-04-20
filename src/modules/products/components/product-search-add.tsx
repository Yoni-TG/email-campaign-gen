"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProductSearch } from "@/modules/products/hooks/use-product-search";
import type { ProductSnapshot } from "@/lib/types";

interface ProductSearchAddProps {
  existingSkus: Set<string>;
  onAdd: (product: ProductSnapshot) => void;
}

export function ProductSearchAdd({
  existingSkus,
  onAdd,
}: ProductSearchAddProps) {
  const [query, setQuery] = useState("");
  const { results, isSearching } = useProductSearch(query);

  const handleAdd = (product: ProductSnapshot) => {
    onAdd(product);
    setQuery("");
  };

  const available = results.filter((p) => !existingSkus.has(p.sku));
  const showDropdown =
    query.length >= 2 && (available.length > 0 || isSearching);

  return (
    <div className="relative">
      <Input
        placeholder="Search to add products…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {showDropdown && (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border bg-popover shadow-lg">
          {isSearching && available.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">Searching…</div>
          )}
          {available.map((product) => (
            <button
              key={product.sku}
              type="button"
              className="flex w-full items-center gap-3 p-2 text-left hover:bg-muted"
              onClick={() => handleAdd(product)}
            >
              {product.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-8 w-8 rounded object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.currency} {product.salePrice || product.price}
                </p>
              </div>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
