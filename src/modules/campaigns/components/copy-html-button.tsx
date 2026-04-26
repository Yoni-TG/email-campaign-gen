"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Small client-side button that copies a (potentially huge) HTML string
// to the clipboard. Used on the standalone preview route and the completed
// view. We keep a 2s "Copied" state to confirm the action visually since
// nothing else changes on the page.
export function CopyHtmlButton({ html }: { html: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      toast.success("HTML copied — paste into Klaviyo's email editor.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed — your browser blocked clipboard access.");
    }
  };

  return (
    <Button onClick={handleClick} className="inline-flex gap-1.5">
      <Copy className="h-3.5 w-3.5" />
      {copied ? "Copied" : "Copy HTML"}
    </Button>
  );
}
