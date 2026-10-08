import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { StarIcon } from "lucide-react"
import Link from "next/link"

interface BarbershopItemProps {
  barbershop: Barbershop
  layout?: "grid" | "rail"
}

const BarbershopItem = ({ barbershop, layout = "grid" }: BarbershopItemProps) => {
  return (
    <Card
      className={
        layout === "rail"
          ? "w-48 shrink-0 snap-start overflow-hidden rounded-xl md:w-56"
          : "w-full min-w-0 overflow-hidden rounded-xl"
      }
    >
      <CardContent className="p-0">
        {/* IMAGEM */}
        <div className="relative aspect-[4/3] w-full">
          <Image
            alt={barbershop.name}
            fill
            className="object-cover"
            src={barbershop.imageUrl}
            sizes="(min-width: 1024px) 220px, (min-width: 768px) 30vw, 78vw"
          />

          <Badge
            className="absolute left-2 top-2 space-x-1 rounded-md"
            variant="secondary"
          >
            <StarIcon size={12} className="fill-primary text-primary" />
            <p className="text-xs font-semibold">5,0</p>
          </Badge>
        </div>

        {/* NOME e ENDEREÇO */}
        <div className="p-3">
          <h3 className="overflow-hidden truncate text-ellipsis text-nowrap font-semibold">
            {barbershop.name}
          </h3>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir o endereço da ${barbershop.name} no Google Maps`}
            className="block overflow-hidden truncate text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            {barbershop.address}
          </a>
          <Button variant="default" size="sm" asChild className="mt-3 w-full rounded-xl">
            <Link href={`/${barbershop.slug}`}>Ver perfil</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default BarbershopItem
