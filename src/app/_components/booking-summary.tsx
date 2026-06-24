import { format } from "date-fns/format"
import { Card, CardContent } from "./ui/card"
import { ptBR } from "date-fns/locale/pt-BR"
import { Barber, Barbershop, BarbershopService } from "@prisma/client"

interface BookingSummaryProps {
  service: Pick<BarbershopService, "name" | "price">
  barbershop: Pick<Barbershop, "name">
  selectDay: Date
  barber?: Pick<Barber, "name"> | null
}

const BookingSummary = ({
  service,
  barbershop,
  selectDay,
  barber,
}: BookingSummaryProps) => {
  return (
    <>
      <Card className="bg-background">
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{service.name}</h2>
            <p className="text-sm font-semibold">
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(service.price))}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm text-gray-400">Data</h2>
            <p className="text-sm">
              {format(selectDay, "d 'de' MMMM", {
                locale: ptBR,
              })}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm text-gray-400">Horário</h2>
            <p className="text-sm">{format(selectDay, "HH:mm")}</p>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm text-gray-400">Barbearia</h2>
            <p className="text-sm">{barbershop.name}</p>
          </div>

          {barber && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-gray-400">Profissional</h2>
              <p className="text-sm">{barber.name}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default BookingSummary
