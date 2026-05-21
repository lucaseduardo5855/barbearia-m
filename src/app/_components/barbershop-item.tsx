import { Barbershop } from "@prisma/client"

interface BarbershopItemProps {
  barbershop: Barbershop
}

const BarbershopItem = ({ barbershop }: BarbershopItemProps) => {
  return <h1>{barbershop.name}</h1>
}

export default BarbershopItem
