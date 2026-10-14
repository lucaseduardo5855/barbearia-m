"use client"

import {
  Barbershop,
  Barber,
  BarbershopService,
  Booking,
  FinancialTransaction,
  ProductSale,
  User,
} from "@prisma/client"
import {
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  subDays,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  UsersRound,
  WalletCards,
} from "lucide-react"
import { Button } from "@/app/_components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card"
import { AdminMetricCard } from "./admin-metric-card"
import { summarizeFinance } from "@/lib/financial-summary"

import type { BookingWithDetails } from "@/lib/booking-types"

interface OverviewTabProps {
  barbershop: Barbershop & { barbers: Barber[] }
  bookings: BookingWithDetails[]
  productSales: ProductSale[]
  transactions: FinancialTransaction[]
  onOpenAgenda: () => void
}

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  )

const statusMeta = {
  PENDING: { label: "Pendente", className: "bg-warning/15 text-warning" },
  CONFIRMED: { label: "Confirmado", className: "bg-info/15 text-primary" },
  DONE: {
    label: "Concluído",
    className: "bg-success/15 text-muted-foreground",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-destructive/10 text-destructive",
  },
} as const

export default function OverviewTab({
  barbershop,
  bookings,
  productSales,
  transactions,
  onOpenAgenda,
}: OverviewTabProps) {
  const now = new Date()
  const summary = summarizeFinance(
    bookings,
    productSales,
    transactions,
    startOfMonth(now),
    endOfMonth(now),
  )
  const appointmentRevenue = summary.serviceRevenue
  const productRevenue = summary.productRevenue
  const expenses = summary.outflows
  const projectedCommissions = summary.pendingCommissions
  const revenue = summary.revenue
  const balance = summary.balance
  const todayBookings = bookings.filter(
    (booking) =>
      isSameDay(new Date(booking.date), now) && booking.status !== "CANCELLED",
  )

  const week = Array.from({ length: 7 }, (_, index) =>
    subDays(now, 6 - index),
  ).map((day) => {
    const daily = summarizeFinance(
      bookings,
      productSales,
      transactions,
      startOfDay(day),
      endOfDay(day),
    )
    return { day, total: daily.revenue }
  })
  const highestDay = Math.max(...week.map((day) => day.total), 1)
  const recentBookings = [...bookings]
    .filter((booking) => booking.status !== "CANCELLED")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">
            Visão geral
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O movimento de {format(now, "MMMM", { locale: ptBR })} em uma
            leitura rápida.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onOpenAgenda}
          className="gap-2 self-start sm:self-auto"
        >
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Ver agenda
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          icon={ArrowUpRight}
          label="Receitas do mês"
          value={currency(revenue)}
          description={`${currency(appointmentRevenue)} em serviços e ${currency(productRevenue)} em produtos.`}
          tone="neutral"
        />
        <AdminMetricCard
          icon={WalletCards}
          label="Saldo do período"
          value={currency(balance)}
          description={`${currency(expenses)} em saídas registradas. Não representa lucro.`}
          tone={balance < 0 ? "neutral" : "primary"}
        />
        <AdminMetricCard
          icon={CalendarDays}
          label="Agenda de hoje"
          value={String(todayBookings.length)}
          description={`${todayBookings.filter((booking) => booking.status === "CONFIRMED").length} atendimentos confirmados.`}
          tone="info"
        />
        <AdminMetricCard
          icon={UsersRound}
          label="Equipe ativa"
          value={String(barbershop.barbers.length)}
          description="Profissionais visíveis para receber agendamentos na agenda."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.8fr)]">
        <Card className="border border-border bg-card py-0 shadow-none">
          <CardContent className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Resultado estimado do mês
              </p>
              <p
                className={`mt-2 text-3xl font-semibold tracking-tight ${balance < 0 ? "text-destructive" : "text-foreground"}`}
              >
                {currency(balance)}
              </p>
              <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                Entradas menos saídas registradas no período atual.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-right sm:min-w-72">
              <div className="rounded-lg bg-muted/70 p-3 text-left">
                <p className="text-[11px] text-muted-foreground">Receitas</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {currency(revenue)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/70 p-3 text-left">
                <p className="text-[11px] text-muted-foreground">Despesas</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {currency(expenses)}
                </p>
              </div>
              <div className="rounded-lg bg-muted/70 p-3 text-left">
                <p className="text-[11px] text-muted-foreground">Comissões</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  {currency(projectedCommissions)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card py-0 shadow-none">
          <CardContent className="grid h-full gap-4 p-5 sm:grid-cols-2 xl:grid-cols-1 xl:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {todayBookings.length} atendimentos hoje
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {
                    todayBookings.filter(
                      (booking) => booking.status === "CONFIRMED",
                    ).length
                  }{" "}
                  confirmados na agenda.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                <UsersRound className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {barbershop.barbers.length} profissionais ativos
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Acompanhe a agenda por profissional em um só calendário.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.8fr)]">
        <Card className="border border-border bg-card py-0 shadow-none">
          <CardHeader className="border-b border-border/70 px-5 py-4 sm:px-6">
            <CardTitle className="text-sm font-semibold">
              Receitas concluídas nos últimos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <div
              className="grid h-44 grid-cols-7 items-end gap-3 border-b border-border/70 pb-1"
              aria-label="Gráfico de receitas dos últimos sete dias"
            >
              {week.map(({ day, total }) => {
                const height = total
                  ? Math.max((total / highestDay) * 100, 12)
                  : 4
                return (
                  <div
                    key={day.toISOString()}
                    className="flex h-full flex-col justify-end gap-2"
                  >
                    <div
                      className="rounded-t-md bg-primary/85 transition-[height] duration-200"
                      style={{ height: `${height}%` }}
                      title={`${format(day, "dd/MM")}: ${currency(total)}`}
                    />
                    <span className="text-center text-[11px] font-medium text-muted-foreground">
                      {format(day, "EEE", { locale: ptBR }).replace(".", "")}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="h-2 w-2 rounded-full bg-primary"
                aria-hidden="true"
              />
              Serviços concluídos, produtos avulsos e receitas manuais.
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card py-0 shadow-none">
          <CardHeader className="border-b border-border/70 px-5 py-4 sm:px-6">
            <CardTitle className="text-sm font-semibold">
              Leitura financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <ArrowUpRight
                className="mt-0.5 h-4 w-4 text-success"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">
                  {currency(appointmentRevenue)} em serviços
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Atendimentos marcados como concluídos neste mês.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CircleDollarSign
                className="mt-0.5 h-4 w-4 text-info"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">
                  {currency(productRevenue)} em produtos
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Produtos vendidos nas comandas e no balcão.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ArrowDownRight
                className="mt-0.5 h-4 w-4 text-destructive"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold">
                  {currency(expenses)} em saídas
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Despesas, vales e comissões já lançadas no período.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border bg-card py-0 shadow-none">
        <CardHeader className="border-b border-border/70 px-5 py-4 sm:px-6">
          <CardTitle className="text-sm font-semibold">
            Atendimentos recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {recentBookings.length ? (
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-border/70 bg-muted/35 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium sm:px-6">Cliente</th>
                  <th className="px-5 py-3 font-medium">Serviço</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {recentBookings.map((booking) => {
                  const status = statusMeta[booking.status]
                  return (
                    <tr
                      key={booking.id}
                      className="transition-colors hover:bg-muted/35"
                    >
                      <td className="px-5 py-3.5 font-medium text-foreground sm:px-6">
                        {booking.user.name || "Cliente"}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {booking.service.name}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {format(new Date(booking.date), "dd MMM, HH:mm", {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-foreground sm:px-6">
                        {currency(
                          Number(booking.totalPrice ?? booking.service.price),
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-10 text-center sm:px-6">
              <p className="text-sm font-semibold">
                Ainda não há atendimentos para mostrar.
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie o primeiro horário na agenda para acompanhar a operação por
                aqui.
              </p>
              <Button size="sm" className="mt-4" onClick={onOpenAgenda}>
                Abrir agenda
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
