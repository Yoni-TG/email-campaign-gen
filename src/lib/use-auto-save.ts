"use client";

import { useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutoSaveResult {
  status: AutoSaveStatus;
  savedAt: Date | null;
}

// Debounced auto-save. Fires `save(value)` `delay`ms after the last change
// to `value`. Caller is responsible for surfacing errors (toast, etc.) —
// this hook only reports status; on failure we drop back to "error" so
// the pill can render an indicator without re-throwing.
export function useAutoSave<T>(
  value: T,
  save: (next: T) => Promise<void>,
  delay = 800,
): AutoSaveResult {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const isFirstRun = useRef(true);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    const timer = setTimeout(async () => {
      setStatus("saving");
      try {
        await saveRef.current(value);
        setSavedAt(new Date());
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return { status, savedAt };
}
