"use client"

import { useRef, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HorizontalRail({
  title,
  description,
  children,
  action,
}: {
  title: string
  description?: string
  children: ReactNode
  action?: ReactNode
}) {
  const rail = useRef<HTMLDivElement>(null)
  const scroll = (direction: number) =>
    rail.current?.scrollBy({
      left: direction * Math.max(260, rail.current.clientWidth * 0.7),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    })
  return (
    <section className="mt-8 min-w-0">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          <Button
            variant="outline"
            size="icon"
            aria-label={`Voltar em ${title}`}
            onClick={() => scroll(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Avançar em ${title}`}
            onClick={() => scroll(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <div
        ref={rail}
        className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3"
      >
        {children}
      </div>
    </section>
  )
}
