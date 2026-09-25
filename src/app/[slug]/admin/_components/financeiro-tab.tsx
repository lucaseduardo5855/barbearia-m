"use client"

import { useMemo, useState, useEffect } from "react"
import { Booking, BarbershopService, Barber, User, SubscriptionPayment } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Badge } from "@/app/_components/ui/badge"
import { getSubscriptionPayments } from "@/app/_actions/payment-actions"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { QrCodeIcon, ShieldCheckIcon, CheckCircle2Icon, SparklesIcon, CalendarIcon } from "lucide-react"

type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

interface FinanceiroTabProps {
  bookings: BookingWithDetails[]
  barbershopId: string
  subscriptionActive?: boolean
  trialEndsAt?: Date | string | null
}

export default function FinanceiroTab({ 
  bookings, 
  barbershopId, 
  subscriptionActive = true, 
  trialEndsAt 
}: FinanceiroTabProps) {
  const [commissionPercent, setCommissionPercent] = useState<number>(50)
  const [barberCommissions, setBarberCommissions] = useState<Record<string, number>>({})
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPayment[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState<boolean>(true)

  // Fetch subscription payments for the current barbershop
  useEffect(() => {
    if (!barbershopId) return
    const fetchPayments = async () => {
      try {
        setIsLoadingPayments(true)
        const data = await getSubscriptionPayments(barbershopId)
        setSubscriptionPayments(data)
      } catch (error) {
        console.error('Failed to load subscription payments', error)
      } finally {
        setIsLoadingPayments(false)
      }
    }
    fetchPayments()
  }, [barbershopId])

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
      .filter((b) => (b.paymentMethod as string) === "ONLINE" && b.paymentStatus === "PAID")
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

      {/* Subscription Payments History Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Histórico de Assinaturas</h3>
        <div className="overflow-x-auto rounded-lg border border-secondary/30 bg-secondary/10">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary/20">
              <tr>
                <th className="px-4 py-2 text-left text-gray-400">Data</th>
                <th className="px-4 py-2 text-left text-gray-400">Valor</th>
                <th className="px-4 py-2 text-left text-gray-400">Status</th>
                <th className="px-4 py-2 text-left text-gray-400">Transação</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionPayments.map((p) => (
                <tr key={p.id} className="border-b border-secondary/20 hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-2 text-gray-300">
                    {new Date(p.paidAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 text-gray-300">
                    R$ {Number(p.amount).toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      p.status === 'APPROVED' ? 'bg-green-700 text-green-100' :
                      p.status === 'PENDING' ? 'bg-yellow-700 text-yellow-100' :
                      'bg-red-700 text-red-100'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-2 flex items-center space-x-2 text-gray-300">
                    <span className="truncate max-w-xs">{p.mercadopagoPaymentId}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(p.mercadopagoPaymentId)}
                      className="text-primary-400 hover:text-primary-300 transition-colors"
                      title="Copiar ID da transação"
                    >
                      📋
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {/* 3. HISTÓRICO DA ASSINATURA SAAS (MENSALIDADES DA BARBEARIA) */}
      <div className="bg-card border border-border/40 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-gray-200">Histórico da Assinatura SaaS</h3>
              {subscriptionActive ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-none hover:bg-emerald-500/20 text-[10px] font-semibold">
                  <CheckCircle2Icon className="h-3 w-3 mr-1" />
                  Plano Ativo
                </Badge>
              ) : trialEndsAt && new Date() < new Date(trialEndsAt) ? (
                <Badge className="bg-blue-500/20 text-blue-400 border-none hover:bg-blue-500/20 text-[10px] font-semibold">
                  <SparklesIcon className="h-3 w-3 mr-1" />
                  Período de Testes
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-[10px]">
                  Aguardando Pagamento
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registro das mensalidades pagas via Pix para manutenção da sua plataforma.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
            <span>Processado com segurança pelo Mercado Pago</span>
          </div>
        </div>

        {isLoadingPayments ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span>Carregando histórico de pagamentos...</span>
          </div>
        ) : subscriptionPayments.length > 0 ? (
          <div className="space-y-3">
            {subscriptionPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-secondary/10 border border-secondary/30 rounded-xl hover:border-secondary/60 transition-all text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                    <QrCodeIcon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-200 text-sm">
                        Mensalidade Barbearia SaaS
                      </span>
                      <Badge
                        className={`text-[10px] border-none font-semibold ${
                          payment.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : payment.status === "PENDING"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {payment.status === "APPROVED"
                          ? "Aprovado"
                          : payment.status === "PENDING"
                          ? "Pendente"
                          : "Recusado"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(payment.paidAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Transação: #{payment.mercadopagoPaymentId} • Método: {payment.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-secondary/30">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold block">Valor Pago</span>
                  <span className="text-base font-bold text-emerald-400">
                    {Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(payment.amount))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/60 bg-secondary/5 space-y-2">
            <QrCodeIcon className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs font-semibold text-gray-300">Nenhum pagamento registrado ainda</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Se você está no período de testes gratuitos, os comprovantes das mensalidades pagas via Pix aparecerão aqui assim que renovar.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
