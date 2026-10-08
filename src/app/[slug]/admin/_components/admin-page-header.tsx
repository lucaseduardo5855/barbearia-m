import type { ComponentProps, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type AdminPageHeaderProps = {
  icon: LucideIcon
  title: string
  description: string
  actions?: ReactNode
  className?: string
} & ComponentProps<"div">

export function AdminPageHeader({
  icon: Icon,
  title,
  description,
  actions,
  className,
  ...props
}: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-[-0.02em] text-foreground sm:text-2xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </div>
  )
}
