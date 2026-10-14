"use client"

import { formatBRL } from "@/lib/formatters"

import { useState, useMemo } from "react"
import { Booking, BarbershopService, Barber, User } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  History,
  Search,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

import type { BookingWithDetails } from "@/lib/booking-types"

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
  const [periodFilter, setPeriodFilter] = useState<
    "ALL" | "TODAY" | "WEEK" | "MONTH" | "CUSTOM"
  >("MONTH")
  const [barberFilter, setBarberFilter] = useState("ALL")
  const [referenceDate, setReferenceDate] = useState(new Date())
  const [rangeStart, setRangeStart] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  )
  const [rangeEnd, setRangeEnd] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  )
  const [page, setPage] = useState(1)
  const pageSize = 10
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
  const changeFilter = (period: typeof periodFilter) => {
    setPeriodFilter(period)
    if (period === "TODAY") setReferenceDate(new Date())
    setPage(1)
  }
  const changePeriod = (offset: number) => {
    setReferenceDate((date) =>
      periodFilter === "MONTH"
        ? addMonths(date, offset)
        : addDays(date, offset * (periodFilter === "WEEK" ? 7 : 1)),
    )
    setPage(1)
  }
  const interval = useMemo(() => {
    if (periodFilter === "ALL") return null
    if (periodFilter === "CUSTOM")
      return {
        start: new Date(rangeStart + "T00:00:00"),
        end: new Date(rangeEnd + "T23:59:59.999"),
      }
    if (periodFilter === "MONTH")
      return {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate),
      }
    if (periodFilter === "WEEK")
      return {
        start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
        end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
      }
    return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) }
  }, [periodFilter, referenceDate, rangeStart, rangeEnd])
  const rangeInvalid =
    interval &&
    (Number.isNaN(interval.start.getTime()) ||
      Number.isNaN(interval.end.getTime()) ||
      interval.start > interval.end)

  const barbers = useMemo(
    () =>
      Array.from(
        new Map(
          bookings
            .filter((booking) => booking.barber)
            .map((booking) => [booking.barber!.id, booking.barber!]),
        ).values(),
      ),
    [bookings],
  )

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const query = normalize(searchTerm)
        const searchValues = [
          b.user.name,
          b.orderNumber,
          b.id.substring(0, 7),
          b.service.name,
          b.user.phone,
          b.barber?.name,
        ]
        const matchesSearch =
          searchValues.some((value) =>
            normalize(value || "").includes(query),
          ) ||
          (!!query.replace(/\D/g, "") &&
            (b.user.phone || "")
              .replace(/\D/g, "")
              .includes(query.replace(/\D/g, "")))

        const matchesStatus =
          statusFilter === "ALL" || b.status === statusFilter

        const bookingDate = new Date(b.date)
        const matchesPeriod =
          !interval ||
          (!rangeInvalid && isWithinInterval(bookingDate, interval))

        const matchesBarber =
          barberFilter === "ALL" || b.barber?.id === barberFilter

        return matchesSearch && matchesStatus && matchesPeriod && matchesBarber
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [barberFilter, bookings, interval, rangeInvalid, searchTerm, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredBookings.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  return (
    <div className="space-y-3">
      <h1 className="sr-only">Histórico</h1>

      {/* Filtros de Busca */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Buscar agendamentos"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            placeholder="Buscar por cliente, comanda, serviço ou telefone..."
            className="h-11 bg-secondary/30 pl-9 text-sm"
          />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-2" aria-label="Filtrar período">
            {[
              ["MONTH", "Mês"],
              ["TODAY", "Hoje"],
              ["WEEK", "Semana"],
              ["CUSTOM", "Intervalo"],
              ["ALL", "Todo o período"],
            ].map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={periodFilter === value ? "default" : "outline"}
                onClick={() => changeFilter(value as typeof periodFilter)}
                className="gap-1.5"
              >
                <CalendarDays className="size-3.5" /> {label}
              </Button>
            ))}
          </div>
          <div className="flex flex-1 flex-wrap gap-2 lg:justify-end">
            <label className="sr-only" htmlFor="history-status">
              Status
            </label>
            <select
              id="history-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="min-h-11 rounded-lg border border-border bg-secondary/40 px-3 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-8 md:min-h-0"
            >
              <option value="ALL">Todos os status</option>
              <option value="DONE">Finalizados</option>
              <option value="CONFIRMED">Confirmados</option>
              <option value="CANCELLED">Cancelados</option>
            </select>
            <label className="sr-only" htmlFor="history-barber">
              Profissional
            </label>
            <select
              id="history-barber"
              value={barberFilter}
              onChange={(e) => {
                setBarberFilter(e.target.value)
                setPage(1)
              }}
              className="min-h-11 rounded-lg border border-border bg-secondary/40 px-3 text-xs font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-8 md:min-h-0"
            >
              <option value="ALL">Todos os profissionais</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {periodFilter === "CUSTOM" ? (
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="history-start">De</label>
            <Input
              id="history-start"
              type="date"
              value={rangeStart}
              onChange={(e) => {
                setRangeStart(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div>
            <label htmlFor="history-end">Até</label>
            <Input
              id="history-end"
              type="date"
              value={rangeEnd}
              min={rangeStart}
              onChange={(e) => {
                setRangeEnd(e.target.value)
                setPage(1)
              }}
            />
          </div>
          {rangeInvalid && (
            <p role="alert" className="text-sm text-destructive">
              Escolha um intervalo válido.
            </p>
          )}
        </div>
      ) : (
        interval && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Período anterior"
              onClick={() => changePeriod(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="text-sm text-muted-foreground">
              {format(interval.start, "dd/MM/yyyy")} a{" "}
              {format(interval.end, "dd/MM/yyyy")}
            </p>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próximo período"
              onClick={() => changePeriod(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )
      )}
      {/* Listagem em Cards */}
      <div className="space-y-3">
        {filteredBookings.length > 0 ? (
          pagedBookings.map((b) => {
            const isDone = b.status === "DONE"
            const isCancelled = b.status === "CANCELLED"
            const extrasCount = countStoredItems(b.extraServices)
            const productsCount = countStoredItems(b.extraProducts)

            return (
              <Card
                key={b.id}
                className="border border-border bg-card shadow-none transition-colors hover:bg-muted/45"
              >
                <CardContent className="flex min-h-[96px] flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-base font-bold text-foreground">
                        {b.user.name || "Cliente"}
                      </strong>
                      <span className="rounded bg-secondary/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        Comanda: #{b.orderNumber || b.id.substring(0, 7)}
                      </span>
                      {isDone ? (
                        <span className="flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                          <CheckCircle2 className="h-3 w-3" /> Finalizado
                        </span>
                      ) : isCancelled ? (
                        <span className="flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold text-destructive">
                          <XCircle className="h-3 w-3" /> Cancelado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-info/20 px-2 py-0.5 text-[10px] font-bold text-info">
                          <Clock className="h-3 w-3" /> Confirmado
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Serviço:{" "}
                        <strong className="text-foreground">
                          {b.service.name}
                        </strong>
                      </span>
                      <span>
                        Barbeiro:{" "}
                        <strong className="text-foreground">
                          {b.barber?.name || "Não atribuído"}
                        </strong>
                      </span>
                      {extrasCount > 0 && (
                        <span className="font-semibold text-warning">
                          +{extrasCount} extra(s)
                        </span>
                      )}
                      {productsCount > 0 && (
                        <span className="font-semibold text-info">
                          +{productsCount} produto(s)
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Telefone: {b.user.phone || "Não informado"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-1 border-t border-border/40 pt-2 sm:flex-col sm:items-end sm:justify-center sm:border-t-0 sm:pt-0">
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(new Date(b.date), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                    <strong className="text-base font-medium text-foreground">
                      {formatBRL(Number(b.totalPrice || b.service.price))}
                    </strong>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <History className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
            <p className="text-sm font-semibold text-muted-foreground">
              Nenhum atendimento encontrado
            </p>
            <p className="text-xs text-muted-foreground">
              Tente alterar o filtro ou termo pesquisado.
            </p>
          </div>
        )}
      </div>
      {filteredBookings.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {pageCount} · {filteredBookings.length}{" "}
            resultados
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
