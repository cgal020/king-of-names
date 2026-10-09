import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-24 py-3 leading-relaxed w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-[1.0625rem] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:opacity-40 aria-invalid:border-destructive aria-invalid:shadow-[inset_0_0_0_1px_var(--destructive)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
