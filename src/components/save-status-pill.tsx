"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/modules/campaigns/utils/relative-date";
import type { AutoSaveStatus } from "@/lib/use-auto-save";

interface Props {
  status: AutoSaveStatus;
  savedAt: Date | null;
  /** Hide the pill while idle. Steps that always want a saved indicator
   *  (e.g. the design canvas after first render) can pass false to keep
   *  the slot reserved. */
  hideWhenIdle?: boolean;
}

const TICK_MS = 15_000;

// Sticky save status. Three visible states:
//   - saving  → amber dot + "Saving…"
//   - saved   → green dot + "Saved · Xs ago" (relative, ticks every 15s)
//   - error   → destructive dot + "Save failed"
// `idle` renders nothing by default — there's nothing to communicate.
export function SaveStatusPill({ status, savedAt, hideWhenIdle = true }: Props) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (status !== "saved" || !savedAt) return;
    const id = setInterval(() => forceTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [status, savedAt]);

  if (status === "idle" && hideWhenIdle) return null;

  const dotClass =
    status === "saving"
      ? "bg-warning"
      : status === "error"
        ? "bg-destructive"
        : "bg-success";

  const label =
    status === "saving"
      ? "Saving…"
      : status === "error"
        ? "Save failed"
        : status === "saved" && savedAt
          ? `Saved · ${formatRelativeTime(savedAt)}`
          : "Saved · auto";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
      <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden />
      {label}
    </span>
  );
}
