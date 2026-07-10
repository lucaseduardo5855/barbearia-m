"use client"

import { useMemo, useState } from "react"
import { Booking, BarbershopService, Barber, User } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"

type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

interface FinanceiroTabProps {
  bookings: BookingWithDetails[]
}

export default function FinanceiroTab({ bookings }: FinanceiroTabProps) {
  const [commissionPercent, setCommissionPercent] = useState<number>(50)
  const [barberCommissions, setBarberCommissions] = useState<Record<string, number>>({})
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
    const contagem: Record<string, {qtd: number; faturamento: number}> = {}

    bookings.forEach((b) => {
      const date = new Date(b.date)
      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        b.status !== "CANCELLED"
      ) {
        const barberName = b.barber?.name || "Qualquer Profissional"
        if(!contagem[barberName]) {
          contagem[barberName] = {
            qtd: 0,
            faturamento: 0
          }
        }
        contagem[barberName].qtd +=1
        contagem[barberName].faturamento += Number(b.service.price)
      }
    })

    return Object.entries(contagem).map(([name, data]) => ({ name, qtd: data.qtd, faturamento: data.faturamento}))
  }, [bookings])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Painel de Valores</h2>
        <p className="text-xs text-muted-foreground">Métricas estimadas do faturamento obtido através dos agendamentos.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <p className="text-[10px] text-gray-500">Serviços concluídos e realizados.</p>
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
      </div>

      <div className="bg-secondary/20 border border-secondary p-5 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-secondary/30">
          <div>
            <h3 className="font-bold text-sm text-gray-200">Desempenho da Equipe e Comissões</h3>
            <p className="text-[10px] text-muted-foreground">Relatório de repasse financeiro por profissional.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">Comissão Padrão:</span>
            <div className="relative w-20">
              <Input 
                type="number" 
                min="0" 
                max="100" 
                value={commissionPercent} 
                onChange={(e) => setCommissionPercent(Number(e.target.value))} 
                className="h-8 pr-5 text-right font-bold text-xs"
              />
              <span className="absolute right-2 top-1.5 text-xs text-gray-400 font-bold">%</span>
            </div>
          </div>
        </div>

        {barbersPerformance.length > 0 ? (
          <div className="space-y-3 pt-1">
            {barbersPerformance.map((item) => {
              // Obtém a comissão específica deste barbeiro ou cai na comissão padrão
              const currentCommission = barberCommissions[item.name] !== undefined 
                ? barberCommissions[item.name] 
                : commissionPercent
              const valorComissao = (item.faturamento * currentCommission) / 100
              
              return (
                <div key={item.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-secondary/10 border border-secondary/30 rounded-lg text-xs animate-in fade-in">
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-200">{item.name}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">Comissão Individual:</span>
                      <div className="relative w-16">
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          value={currentCommission} 
                          onChange={(e) => {
                            const val = Number(e.target.value)
                            setBarberCommissions((prev) => ({
                              ...prev,
                              [item.name]: val
                            }))
                          }} 
                          className="h-6 pr-4 text-right font-semibold text-[10px] bg-secondary/30"
                        />
                        <span className="absolute right-1.5 top-1 text-[10px] text-gray-500 font-bold">%</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-500">Realizou {item.qtd} corte(s) este mês</p>
                  </div>
                  
                  <div className="flex gap-4 text-right">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-semibold">Faturamento Bruto</p>
                      <p className="font-bold text-gray-300">R$ {item.faturamento.toFixed(2)}</p>
                    </div>
                    <div className="border-l border-secondary/50 pl-4 text-left sm:text-right">
                      <p className="text-[9px] text-green-500 uppercase font-semibold">Comissão ({currentCommission}%)</p>
                      <p className="font-bold text-green-500">R$ {valorComissao.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">Nenhum serviço realizado por profissionais este mês.</p>
        )}
      </div>
    </div>
  )
}
