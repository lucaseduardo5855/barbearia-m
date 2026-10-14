import { forwardRef, type ComponentProps } from "react"
import { cn } from "@/lib/utils"
export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 h-11 min-h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2 text-base text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    )
  },
)
