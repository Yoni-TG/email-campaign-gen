"use client";

import { useEffect, useState } from "react";
import type { ProductSearchResult } from "@/modules/products/utils/product-api-shape";

interface UseProductSearchResult {
  results: ProductSearchResult[];
  isSearching: boolean;
}

// Debounced GET /api/products?q=... — returns the live results for the current
// query. Empty query (shorter than minLength) returns [] without hitting the
// API. Resets automatically when the query changes or the component unmounts.
export function useProductSearch(
  query: string,
  minLength = 2,
  debounceMs = 300,
): UseProductSearchResult {
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < minLength) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/products?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setResults([]);
          return;
        }
        setResults((await res.json()) as ProductSearchResult[]);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, minLength, debounceMs]);

  return { results, isSearching };
}
