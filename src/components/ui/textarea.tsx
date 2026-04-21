import * as React from "react"

import { cn } from "@/lib/utils"

// Matches the Input treatment: filled muted fill at rest, card fill on
// focus with a soft accent ring. min-h bumped so the field reads like a
// proper text area, not a collapsed single line.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 w-full rounded-lg border border-input/60 bg-muted/30 px-3.5 py-2.5 text-sm transition-[background-color,border-color,box-shadow] outline-none",
        "placeholder:text-muted-foreground",
        "hover:bg-muted/50",
        "focus-visible:bg-card focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
