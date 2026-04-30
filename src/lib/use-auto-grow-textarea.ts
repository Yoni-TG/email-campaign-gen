"use client";

import { useLayoutEffect, useRef } from "react";

// Resizes a textarea to fit its content. Returns a ref to attach to the
// element. Height resets to auto first so shrinking on delete works,
// then snaps to scrollHeight. Caller should pair this with
// `style={{ overflow: 'hidden' }}` and drop `resize-y` so manual drag
// doesn't fight the layout effect.
export function useAutoGrowTextarea(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return ref;
}
