"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type RefreshResult = {
  productCount: number;
  loadedAt: string;
  source: "remote" | "local" | null;
};

export function RefreshFeedButton() {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/feed/refresh", { method: "POST" });
      const body = (await res.json()) as RefreshResult | { error?: string };

      if (!res.ok) {
        const error =
          (body as { error?: string }).error ?? `HTTP ${res.status}`;
        toast.error(`Feed refresh failed — ${error}`);
        return;
      }

      const ok = body as RefreshResult;
      toast.success(
        `Feed refreshed — ${ok.productCount} products (${ok.source ?? "unknown"}).`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      toast.error(`Feed refresh failed — ${message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex gap-1.5"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Refreshing…" : "Refresh feed"}
    </Button>
  );
}
