import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// Filled-field modern pattern: muted fill + hairline border at rest,
// white (card) fill + ring-2 accent on focus. Dialled-down ring
// intensity vs the shadcn default (ring-3/50) so the amber accent
// doesn't overpower the form.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-input/60 bg-muted/30 px-3.5 py-2 text-sm transition-[background-color,border-color,box-shadow] outline-none",
        "placeholder:text-muted-foreground",
        "hover:bg-muted/50",
        "focus-visible:bg-card focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        "file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
