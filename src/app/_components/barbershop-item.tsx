import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "./ui/card"
import Image from "next/image"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { StarIcon } from "lucide-react"
import Link from "next/link"

interface BarbershopItemProps {
  barbershop: Barbershop
}

const BarbershopItem = ({ barbershop }: BarbershopItemProps) => {
  return (
    <Card className="min-w-[159px] overflow-hidden rounded-2xl">
      <CardContent className="p-0 px-2">
        {/* IMAGEM */}
        <div className="relative h-[159px] w-full">
          <Image
            alt={barbershop.name}
            fill
            className="rounded-2xl object-cover"
            src={barbershop.imageUrl}
          />

          <Badge
            className="absolute left-2 top-2 space-x-1 rounded-xl"
            variant="secondary"
          >
            <StarIcon size={12} className="fill-primary text-primary" />
            <p className="text-xs font-semibold">5,0</p>
          </Badge>
        </div>

        {/* NOME e ENDEREÇO */}
        <div className="px-1 py-3">
          <h3 className="overflow-hidden truncate text-ellipsis text-nowrap font-semibold">
            {barbershop.name}
          </h3>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir o endereço da ${barbershop.name} no Google Maps`}
            className="block overflow-hidden truncate text-sm text-gray-400 hover:text-primary hover:underline"
          >
            {barbershop.address}
          </a>
          <Button variant="secondary" asChild className="mt-3 w-full">
            <Link href={`/${barbershop.slug}`}>Ver perfil</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default BarbershopItem
