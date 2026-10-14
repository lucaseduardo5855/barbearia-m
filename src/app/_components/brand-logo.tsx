import { Scissors } from "lucide-react"

export function BrandLogo() {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
        <Scissors className="size-4" />
      </span>
      <span className="font-display text-sm font-medium tracking-[0.03em] text-foreground">
        Barber-M
      </span>
    </span>
  )
}
