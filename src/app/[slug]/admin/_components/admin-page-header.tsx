import type { ComponentProps, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type AdminPageHeaderProps = {
  icon: LucideIcon
  title: string
  description?: string
  compact?: boolean
  actions?: ReactNode
  className?: string
} & ComponentProps<"div">

export function AdminPageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
  compact = false,
  ...props
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        compact ? "pb-0" : "border-b border-border pb-4",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1
            className={cn(
              "font-medium tracking-[-0.025em] text-foreground",
              compact ? "text-xl" : "text-2xl",
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  )
}
