import * as React from "react"

import { cn } from "@/lib/utils"

const PICKER_ONLY_TYPES = new Set([
  "date",
  "datetime-local",
  "month",
  "week",
  "time",
])

function Input({
  className,
  type,
  onKeyDown,
  onPaste,
  onBeforeInput,
  inputMode,
  autoComplete,
  ...props
}: React.ComponentProps<"input">) {
  const isPickerOnly = typeof type === "string" && PICKER_ONLY_TYPES.has(type)

  return (
    <input
      {...props}
      type={type}
      data-slot="input"
      inputMode={isPickerOnly ? "none" : inputMode}
      autoComplete={isPickerOnly ? "off" : autoComplete}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        isPickerOnly && "cursor-pointer",
        className
      )}
      onKeyDown={(e) => {
        if (isPickerOnly) {
          // Block typing/editing; keep Tab/Escape. Calendar picker still works via click/tap.
          const allow = e.key === "Tab" || e.key === "Escape"
          if (!allow) e.preventDefault()
        }
        onKeyDown?.(e)
      }}
      onPaste={(e) => {
        if (isPickerOnly) e.preventDefault()
        onPaste?.(e)
      }}
      onBeforeInput={(e) => {
        if (isPickerOnly) e.preventDefault()
        onBeforeInput?.(e)
      }}
    />
  )
}

export { Input }
