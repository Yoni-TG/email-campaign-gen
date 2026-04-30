"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Campaign } from "@/lib/types";
import {
  readPath,
  writePath,
  stripCampaignId,
  pathIsMultiline,
} from "./path-helpers";
import { shortError } from "./short-error";

interface Props {
  path: string;
  campaign: Campaign;
  /** Override the path-based multiline heuristic when the caller knows
   *  which form factor it wants. */
  multiline?: boolean;
  /** Fired once before the fetch starts. Optional. */
  onSaving?: () => void;
  onSaved: () => void;
}

export function TextEditor({
  path,
  campaign,
  multiline,
  onSaving,
  onSaved,
}: Props) {
  const initial = readPath(campaign.approvedCopy, path) ?? "";
  const isMultiline = multiline ?? pathIsMultiline(path);
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!campaign.approvedCopy) return;
    onSaving?.();
    setBusy(true);
    try {
      const next = writePath(campaign.approvedCopy, path, value.trim() || null);
      const res = await fetch(`/api/campaigns/${campaign.id}/fine-tune/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedCopy: stripCampaignId(next) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }
      toast.success("Copy updated — re-rendered.");
      onSaved();
    } catch (err) {
      toast.error(shortError(err, "Save failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {isMultiline ? (
        <Textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="text-sm"
        />
      ) : (
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void save();
            }
          }}
        />
      )}
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save & Re-render"}
        </Button>
      </div>
    </div>
  );
}
