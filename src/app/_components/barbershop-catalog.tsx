"use client"

import { useRef, useState } from "react"
import type { Barbershop } from "@prisma/client"
import { ChevronLeft, ChevronRight, LayoutGrid, Columns3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import BarbershopItem from "./barbershop-item"

export function BarbershopCatalog({
  barbershops,
}: {
  barbershops: Pick<
    Barbershop,
    "id" | "name" | "address" | "imageUrl" | "slug"
  >[]
}) {
  const [layout, setLayout] = useState<"grid" | "rail">("grid")
  const rail = useRef<HTMLDivElement>(null)
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {barbershops.length} barbearia(s) nesta página
        </span>
        <div className="flex gap-1">
          <Button
            variant={layout === "grid" ? "secondary" : "ghost"}
            size="icon"
            aria-label="Mostrar em grade"
            aria-pressed={layout === "grid"}
            onClick={() => setLayout("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={layout === "rail" ? "secondary" : "ghost"}
            size="icon"
            aria-label="Mostrar em faixa horizontal"
            aria-pressed={layout === "rail"}
            onClick={() => setLayout("rail")}
          >
            <Columns3 className="size-4" />
          </Button>
          {layout === "rail" && (
            <>
              <Button
                variant="outline"
                size="icon"
                aria-label="Barbearias anteriores"
                onClick={() =>
                  rail.current?.scrollBy({ left: -320, behavior: "smooth" })
                }
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Próximas barbearias"
                onClick={() =>
                  rail.current?.scrollBy({ left: 320, behavior: "smooth" })
                }
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <div
        ref={rail}
        className={
          layout === "rail"
            ? "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
            : "grid grid-cols-1 gap-5 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
        }
      >
        {barbershops.map((barbershop) => (
          <BarbershopItem
            key={barbershop.id}
            barbershop={barbershop}
            layout={layout === "rail" ? "rail" : "grid"}
          />
        ))}
      </div>
      {layout === "rail" && (
        <p className="mt-2 text-sm text-muted-foreground">
          Deslize para o lado ou use as setas para explorar.
        </p>
      )}
    </>
  )
}
