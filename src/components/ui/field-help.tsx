"use client"
import { useId } from "react"
import { Info } from "lucide-react"
export function FieldHelp({ text }: { text: string }) {
  const id = useId()
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        aria-describedby={id}
        className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-3.5" />
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 hidden w-56 rounded-lg border border-border bg-popover p-3 text-left text-xs font-normal leading-5 text-popover-foreground shadow-sm group-focus-within:block group-hover:block"
      >
        {text}
      </span>
    </span>
  )
}
