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

const toneClasses: Record<MetricTone, { card: string; icon: string; text: string }> = {
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
    <Card className={cn("min-h-40 justify-between border py-0 shadow-none transition-colors hover:bg-muted/60", classes.card)}>
      <CardContent className="flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", classes.icon)}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-6">
          <p className="text-2xl font-extrabold tracking-[-0.02em] tabular-nums">{value}</p>
          <p className={cn("mt-2 text-xs leading-5", classes.text)}>{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
