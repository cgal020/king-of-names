import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-13 py-1 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-[1.0625rem] transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:opacity-40 aria-invalid:border-destructive aria-invalid:shadow-[inset_0_0_0_1px_var(--destructive)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
