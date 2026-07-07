"use client"

import { useMemo } from "react"
import { Booking, BarbershopService, Barber, User } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"

type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

interface FinanceiroTabProps {
  bookings: BookingWithDetails[]
}

export default function FinanceiroTab({ bookings }: FinanceiroTabProps) {
  // --- LÓGICA DO FINANCEIRO (Calculada no filho!) ---
  const financeData = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    // Filtra agendamentos do mês atual que não estejam cancelados
    const monthlyBookings = bookings.filter((b) => {
      const date = new Date(b.date)
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        b.status !== "CANCELLED"
      );
    })

    const faturamentoEstimado = monthlyBookings.reduce((sum, b) => sum + Number(b.service.price), 0)

    // Faturamento Real: Apenas serviços concluídos (DONE), pagos online (PAID) ou que passaram da data sem serem cancelados
    const faturamentoReal = monthlyBookings
      .filter((b) => {
        const isPast = new Date(b.date) < new Date()
        return b.status === "DONE" || b.paymentStatus === "PAID" || (isPast && b.status !== "CANCELLED")
      })
      .reduce((sum, b) => sum + Number(b.service.price), 0)

    const pagamentosOnline = monthlyBookings
      .filter((b) => b.paymentMethod === "ONLINE" && b.paymentStatus === "PAID")
      .reduce((sum, b) => sum + Number(b.service.price), 0)

    const pagamentosNoLocal = monthlyBookings
      .filter((b) => b.paymentMethod === "ON_SITE")
      .reduce((sum, b) => sum + Number(b.service.price), 0)

    return {
      faturamentoEstimado,
      faturamentoReal,
      totalAgendamentos: monthlyBookings.length,
      pagamentosOnline,
      pagamentosNoLocal,
    }
  }, [bookings])

  // --- DESEMPENHO DA EQUIPE (Calculado no filho!) ---
  const barbersPerformance = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const contagem: Record<string, number> = {}

    bookings.forEach((b) => {
      const date = new Date(b.date)
      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        b.status !== "CANCELLED"
      ) {
        const barberName = b.barber?.name || "Qualquer Profissional"
        contagem[barberName] = (contagem[barberName] || 0) + 1
      }
    })

    return Object.entries(contagem).map(([name, qtd]) => ({ name, qtd }))
  }, [bookings])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Painel de Valores</h2>
        <p className="text-xs text-muted-foreground">Métricas estimadas do faturamento obtido através dos agendamentos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Estimado */}
        <Card className="border-secondary bg-secondary/20">
          <CardContent className="p-5 space-y-2">
            <span className="text-xs text-gray-400 font-semibold uppercase">Faturamento Estimado</span>
            <p className="text-3xl font-bold text-gray-300">
              R$ {financeData.faturamentoEstimado.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-500">Soma de todos os agendamentos ativos do mês.</p>
          </CardContent>
        </Card>

        {/* Card 2: Faturamento Real (Concluído/Pago) */}
        <Card className="border-green-600/20 bg-green-950/10">
          <CardContent className="p-5 space-y-2">
            <span className="text-xs text-green-400 font-semibold uppercase">Faturamento Real</span>
            <p className="text-3xl font-bold text-green-500">
              R$ {financeData.faturamentoReal.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-500">Serviços concluídos, pagos online ou realizados.</p>
          </CardContent>
        </Card>

        {/* Card 3: Total de Agendamentos */}
        <Card className="border-secondary bg-secondary/20">
          <CardContent className="p-5 space-y-2">
            <span className="text-xs text-gray-400 font-semibold uppercase">Total de Agendamentos</span>
            <p className="text-3xl font-bold text-gray-200">
              {financeData.totalAgendamentos}
            </p>
            <p className="text-[10px] text-gray-500">Agendamentos marcados (exclui cancelados).</p>
          </CardContent>
        </Card>

        {/* Card 4: Pagamentos Online */}
        <Card className="border-secondary bg-secondary/20">
          <CardContent className="p-5 space-y-2">
            <span className="text-xs text-gray-400 font-semibold uppercase">Pagos Online</span>
            <p className="text-3xl font-bold text-primary">
              R$ {financeData.pagamentosOnline.toFixed(2)}
            </p>
            <p className="text-[10px] text-gray-500">Valor processado e compensado via internet.</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-secondary/20 border border-secondary p-5 rounded-xl space-y-3">
        <h3 className="font-bold text-sm text-gray-200">Divisão Detalhada (Mês Corrente)</h3>
        <div className="flex justify-between text-xs py-1 border-b border-secondary/50">
          <span className="text-gray-400">Total a receber no local (Dinheiro/Máquina):</span>
          <span className="font-semibold text-gray-200">R$ {financeData.pagamentosNoLocal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs py-1">
          <span className="text-gray-400">Total recebido em cartões online:</span>
          <span className="font-semibold text-gray-200">R$ {financeData.pagamentosOnline.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-secondary/20 border border-secondary p-5 rounded-xl space-y-3">
        <h3 className="font-bold text-sm text-gray-200">Desempenho da Equipe (Cortes por Profissional)</h3>
        {barbersPerformance.length > 0 ? (
          <div className="space-y-2 pt-1">
            {barbersPerformance.map((item) => (
              <div key={item.name} className="flex justify-between text-xs py-1 border-b border-secondary/30 last:border-b-0">
                <span className="text-gray-400">{item.name}:</span>
                <span className="font-semibold text-primary">{item.qtd} corte(s) / serviço(s)</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum serviço realizado por profissionais este mês.</p>
        )}
      </div>
    </div>
  )
}
