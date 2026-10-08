"use client"

import { useState, useMemo } from "react"
import { Booking, BarbershopService, Barber, User } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { endOfWeek, format, isToday, isWithinInterval, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { History, Search, CalendarDays, CheckCircle2, XCircle, Clock } from "lucide-react"
import { AdminPageHeader } from "./admin-page-header"

type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

interface HistoricoTabProps {
  bookings: BookingWithDetails[]
}

function countStoredItems(value: string | null) {
  if (!value) return 0
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

export default function HistoricoTab({ bookings }: HistoricoTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [periodFilter, setPeriodFilter] = useState<"ALL" | "TODAY" | "WEEK">("ALL")
  const [barberFilter, setBarberFilter] = useState("ALL")

  const barbers = useMemo(
    () => Array.from(new Map(bookings.filter((booking) => booking.barber).map((booking) => [booking.barber!.id, booking.barber!])).values()),
    [bookings],
  )

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        (b.user.name && b.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.orderNumber && b.orderNumber.includes(searchTerm)) ||
        (b.service.name && b.service.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (b.user.phone && b.user.phone.includes(searchTerm))

      const matchesStatus =
        statusFilter === "ALL" || b.status === statusFilter

      const bookingDate = new Date(b.date)
      const matchesPeriod = periodFilter === "ALL"
        || (periodFilter === "TODAY" && isToday(bookingDate))
        || (periodFilter === "WEEK" && isWithinInterval(bookingDate, {
          start: startOfWeek(new Date(), { weekStartsOn: 1 }),
          end: endOfWeek(new Date(), { weekStartsOn: 1 }),
        }))

      const matchesBarber = barberFilter === "ALL" || b.barber?.id === barberFilter

      return matchesSearch && matchesStatus && matchesPeriod && matchesBarber
    })
  }, [barberFilter, bookings, periodFilter, searchTerm, statusFilter])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={History}
        title="Histórico de agendamentos"
        description="Consulte atendimentos concluídos, cancelados e confirmados pela data ou por profissional."
        actions={<span className="rounded-full bg-secondary px-3 py-2 text-xs font-bold text-muted-foreground">{filteredBookings.length} resultado{filteredBookings.length === 1 ? "" : "s"}</span>}
      />

      {/* Filtros de Busca */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, comanda, serviço ou telefone..."
            className="h-11 bg-secondary/30 pl-9 text-sm"
          />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2" aria-label="Filtrar período">
            {[
              ["ALL", "Todo o período"],
              ["TODAY", "Hoje"],
              ["WEEK", "Esta semana"],
            ].map(([value, label]) => <Button key={value} type="button" size="sm" variant={periodFilter === value ? "default" : "outline"} onClick={() => setPeriodFilter(value as typeof periodFilter)} className="gap-1.5"><CalendarDays className="size-3.5" /> {label}</Button>)}
          </div>
          <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
            <label className="sr-only" htmlFor="history-status">Status</label>
            <select id="history-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-11 rounded-lg border border-border bg-secondary/40 px-3 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-0 md:h-8">
              <option value="ALL">Todos os status</option><option value="DONE">Finalizados</option><option value="CONFIRMED">Confirmados</option><option value="CANCELLED">Cancelados</option>
            </select>
            <label className="sr-only" htmlFor="history-barber">Profissional</label>
            <select id="history-barber" value={barberFilter} onChange={(e) => setBarberFilter(e.target.value)} className="min-h-11 rounded-lg border border-border bg-secondary/40 px-3 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-0 md:h-8">
              <option value="ALL">Todos os profissionais</option>{barbers.map((barber) => <option key={barber.id} value={barber.id}>{barber.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Listagem em Cards */}
      <div className="space-y-3">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((b) => {
            const isDone = b.status === "DONE"
            const isCancelled = b.status === "CANCELLED"
            const extrasCount = countStoredItems(b.extraServices)
            const productsCount = countStoredItems(b.extraProducts)

            return (
              <Card key={b.id} className="border border-border bg-card shadow-none transition-colors hover:bg-muted/45">
                <CardContent className="flex min-h-[116px] flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-base font-bold text-foreground">
                        {b.user.name || "Cliente"}
                      </strong>
                      <span className="font-mono text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                        Comanda: #{b.orderNumber || b.id.substring(0, 7)}
                      </span>
                      {isDone ? (
                        <span className="text-[10px] bg-success/20 text-success font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Finalizado
                        </span>
                      ) : isCancelled ? (
                        <span className="text-[10px] bg-destructive/20 text-destructive font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Cancelado
                        </span>
                      ) : (
                        <span className="text-[10px] bg-info/20 text-info font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Confirmado
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>Serviço: <strong className="text-foreground">{b.service.name}</strong></span>
                      <span>Barbeiro: <strong className="text-foreground">{b.barber?.name || "Geral"}</strong></span>
                      {extrasCount > 0 && (
                        <span className="text-warning font-semibold">+{extrasCount} extra(s)</span>
                      )}
                      {productsCount > 0 && (
                        <span className="text-info font-semibold">+{productsCount} produto(s)</span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Telefone: {b.user.phone || "Não informado"}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40 gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground font-medium">
                      {format(new Date(b.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <strong className="text-base font-bold text-success">
                      R$ {Number(b.totalPrice || b.service.price).toFixed(2).replace(".", ",")}
                    </strong>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <History className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-muted-foreground">Nenhum atendimento encontrado</p>
            <p className="text-xs text-muted-foreground">Tente alterar o filtro ou termo pesquisado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
