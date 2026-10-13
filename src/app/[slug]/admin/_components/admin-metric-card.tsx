import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/app/_components/ui/card"
import { cn } from "@/lib/utils"

type MetricTone = "primary" | "success" | "info" | "neutral"

type AdminMetricCardProps = {
  icon: LucideIcon
  label: string
  value: string
  description: string
  tone?: MetricTone
}

const toneClasses: Record<
  MetricTone,
  { card: string; icon: string; text: string }
> = {
  primary: {
    card: "border-primary/20 bg-card",
    icon: "bg-primary/10 text-primary",
    text: "text-muted-foreground",
  },
  success: {
    card: "bg-card",
    icon: "bg-success/12 text-success",
    text: "text-muted-foreground",
  },
  info: {
    card: "bg-card",
    icon: "bg-info/12 text-info",
    text: "text-muted-foreground",
  },
  neutral: {
    card: "bg-card",
    icon: "bg-secondary text-primary",
    text: "text-muted-foreground",
  },
}

export function AdminMetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "neutral",
}: AdminMetricCardProps) {
  const classes = toneClasses[tone]
  return (
    <Card
      className={cn(
        "min-h-44 justify-between overflow-hidden border py-0 shadow-none transition-[border-color,background-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/40 hover:shadow-[0_18px_50px_-32px_hsl(var(--foreground)/0.32)]",
        classes.card,
      )}
    >
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex min-h-10 items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              classes.icon,
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-6">
          <p className="text-[1.75rem] font-semibold tabular-nums tracking-[-0.025em]">
            {value}
          </p>
          <p className={cn("mt-2 text-sm leading-5", classes.text)}>
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
