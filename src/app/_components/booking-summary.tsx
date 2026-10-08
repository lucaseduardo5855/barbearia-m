import { format } from "date-fns/format"
import { Card, CardContent } from "./ui/card"
import { ptBR } from "date-fns/locale/pt-BR"
import { Barber, Barbershop, BarbershopService } from "@prisma/client"

interface BookingSummaryProps {
  service: Pick<BarbershopService, "name" | "price">
  barbershop: Pick<Barbershop, "name">
  selectDay: Date
  barber?: Pick<Barber, "name"> | null
  paymentMethod?: string
}

const BookingSummary = ({
  service,
  barbershop,
  selectDay,
  barber,
  paymentMethod = "Pagar no local",
}: BookingSummaryProps) => {
  return (
      <Card className="gap-0 bg-muted/45 shadow-none ring-1 ring-border">
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">{service.name}</h2>
            <p className="text-base font-semibold text-foreground">
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(service.price))}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm text-muted-foreground">Data</h2>
            <p className="text-sm">
              {format(selectDay, "d 'de' MMMM", {
                locale: ptBR,
              })}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm text-muted-foreground">Horário</h2>
            <p className="text-sm">{format(selectDay, "HH:mm")}</p>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm text-muted-foreground">Barbearia</h2>
            <p className="text-sm">{barbershop.name}</p>
          </div>

          {barber && (
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-muted-foreground">Profissional</h2>
              <p className="text-sm">{barber.name}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <h2 className="text-sm text-muted-foreground">Forma de pagamento</h2>
            <p className="text-sm font-medium text-success">{paymentMethod}</p>
          </div>
        </CardContent>
      </Card>
  )
}

export default BookingSummary
