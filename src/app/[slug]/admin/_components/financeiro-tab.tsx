"use client"

import { useState, useMemo } from "react"
import { Booking, BarbershopService, Barber, User, ProductSale, FinancialTransaction, SubscriptionPayment } from "@prisma/client"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { createFinancialTransactionAction } from "@/app/_actions/admin-actions"
import { AdminPageHeader } from "./admin-page-header"
import { formatBRL } from "@/lib/formatters"

type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

interface FinanceiroTabProps {
  barbershopId: string
  barbershopName?: string
  bookings: BookingWithDetails[]
  productSales?: ProductSale[]
  transactions?: FinancialTransaction[]
  subscriptionPayments?: SubscriptionPayment[]
  subscriptionActive?: boolean
  trialEndsAt?: Date | string | null
}

type FinancePeriodSummaryProps = {
  currentDate: Date
  saldoPeriodo: number
  totalRecebimentos: number
  previsaoTotalBruto: number
  comissoesPagas: number
  totalSaidas: number
}

function FinancePeriodSummary({
  currentDate,
  saldoPeriodo,
  totalRecebimentos,
  previsaoTotalBruto,
  comissoesPagas,
  totalSaidas,
}: FinancePeriodSummaryProps) {
  const items = [
    { label: "Saldo do período", value: saldoPeriodo, detail: "Entradas menos saídas", tone: "success", icon: Wallet },
    { label: "Recebimentos", value: totalRecebimentos, detail: "Vendas concluídas", tone: "success", icon: ArrowUpRight },
    { label: "Previsão", value: previsaoTotalBruto, detail: "Inclui comandas em aberto", tone: "default", icon: TrendingUp },
    { label: "Comissões pagas", value: comissoesPagas, detail: "Repasses no período", tone: "info", icon: Receipt },
    { label: "Saídas", value: totalSaidas, detail: "Despesas e comissões", tone: "destructive", icon: ArrowDownRight },
  ] as const

  return (
    <section aria-label="Resumo financeiro do período" className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
      <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Resumo do período</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Os valores abaixo usam os mesmos lançamentos e comandas mostrados nos detalhes.</p>
        </div>
        <span className="text-xs font-semibold capitalize text-muted-foreground">{format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}</span>
      </div>
      <div className="grid lg:grid-cols-5">
        {items.map((item, index) => {
          const Icon = item.icon
          const valueClass = item.tone === "destructive" ? "text-destructive" : item.tone === "success" ? "text-success" : "text-foreground"
          const iconClass = item.tone === "destructive" ? "text-destructive" : item.tone === "success" ? "text-success" : item.tone === "info" ? "text-info" : "text-primary"
          return (
            <div key={item.label} className={`min-w-0 px-5 py-4 ${index < items.length - 1 ? "border-b border-border lg:border-b-0 lg:border-r" : ""}`}>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"><Icon className={`size-3.5 ${iconClass}`} aria-hidden="true" />{item.label}</div>
              <p className={`mt-2 truncate text-xl font-extrabold tracking-[-0.02em] tabular-nums ${valueClass}`}>{formatBRL(item.value)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function FinanceiroTab({
  barbershopId,
  barbershopName,
  bookings,
  productSales = [],
  transactions = [],
  subscriptionPayments = [],
  subscriptionActive = true,
  trialEndsAt
}: FinanceiroTabProps) {
  // Controle de sub-aba do financeiro
  const [subTab, setSubTab] = useState<"dashboard" | "assinaturas">("dashboard")

  // Filtro de mês/ano atual
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // Modal de lançamento de despesa/receita manual
  const [isNewTxOpen, setIsNewTxOpen] = useState(false)
  const [txType, setTxType] = useState<"RECEITA" | "DESPESA">("DESPESA")
  const [txCategory, setTxCategory] = useState("Lançamento Manual")
  const [txDescription, setTxDescription] = useState("")
  const [txAmount, setTxAmount] = useState<number>(0)
  const [isSubmittingTx, setIsSubmittingTx] = useState(false)

  // Intervalo do mês selecionado
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)

  // 1. Cálculos de métricas do período selecionado
  const metrics = useMemo(() => {
    // Comandas finalizadas do período
    const completedBookings = bookings.filter((b) => {
      const bDate = new Date(b.date)
      return bDate >= monthStart && bDate <= monthEnd && b.status === "DONE"
    })

    // Comandas em aberto
    const openBookings = bookings.filter((b) => {
      const bDate = new Date(b.date)
      return bDate >= monthStart && bDate <= monthEnd && (b.status === "CONFIRMED" || b.status === "PENDING")
    })

    // Vendas de produtos do período
    const monthProductSales = productSales.filter((ps) => {
      const psDate = new Date(ps.date)
      return psDate >= monthStart && psDate <= monthEnd
    })

    // Faturamento dos cortes/serviços finalizados
    const totalServicosFinalizados = completedBookings.reduce(
      (acc, b) => acc + Number(b.totalPrice || b.service.price),
      0
    )

    // Faturamento das vendas de produtos
    const totalVendasProdutos = monthProductSales.reduce(
      (acc, ps) => acc + Number(ps.totalAmount),
      0
    )

    // Total Bruto de vendas no período (finalizados + produtos)
    const totalBrutoVendas = totalServicosFinalizados + totalVendasProdutos

    // Comandas em aberto (valor)
    const totalComandasAberto = openBookings.reduce(
      (acc, b) => acc + Number(b.totalPrice || b.service.price),
      0
    )

    // Previsão do total bruto de vendas no período (finalizadas + em aberto)
    const previsaoTotalBruto = totalBrutoVendas + totalComandasAberto

    // Clientes atendidos no mês
    const totalClientesAtendidos = completedBookings.length
    const daysPassedInMonth = Math.max(1, new Date().getDate())
    const mediaClientesPorDia = Number((totalClientesAtendidos / daysPassedInMonth).toFixed(2))

    // Despesas e Saídas
    const monthTransactions = transactions.filter((t) => {
      const tDate = new Date(t.date)
      return tDate >= monthStart && tDate <= monthEnd
    })

    // Comissões pagas registradas
    const comissoesPagas = monthTransactions
      .filter((t) => t.type === "COMISSAO_PAGA")
      .reduce((acc, t) => acc + Number(t.amount), 0)

    // Despesas manuais
    const despesasManuais = monthTransactions
      .filter((t) => t.type === "DESPESA")
      .reduce((acc, t) => acc + Number(t.amount), 0)

    const totalSaidas = comissoesPagas + despesasManuais

    // Recebimentos no período
    const totalRecebimentos = totalBrutoVendas
    const saldoPeriodo = totalRecebimentos - totalSaidas

    // Valores a receber
    const receitasManuais = monthTransactions
      .filter((t) => t.type === "RECEITA")
      .reduce((acc, t) => acc + Number(t.amount), 0)

    const pacotesAssinaturas = 0 // Reserva para pacotes
    const totalLiquidoReceber = totalRecebimentos + receitasManuais

    return {
      totalBrutoVendas,
      totalComandasAberto,
      totalClientesAtendidos,
      mediaClientesPorDia,
      previsaoTotalBruto,
      totalRecebimentos,
      totalSaidas,
      saldoPeriodo,
      totalServicosFinalizados,
      totalVendasProdutos,
      receitasManuais,
      pacotesAssinaturas,
      totalLiquidoReceber,
      comissoesPagas,
      despesasManuais
    }
  }, [bookings, productSales, transactions, monthStart, monthEnd])

  // 2. Dados diários para o gráfico "Total de receita bruta por dia"
  const chartDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    return days.map((day) => {
      const dayBookings = bookings.filter((b) => {
        const bDate = new Date(b.date)
        return isSameDay(bDate, day) && b.status === "DONE"
      })
      const daySales = productSales.filter((ps) => {
        const psDate = new Date(ps.date)
        return isSameDay(psDate, day)
      })

      const totalServicos = dayBookings.reduce((acc, b) => acc + Number(b.totalPrice || b.service.price), 0)
      const totalProdutos = daySales.reduce((acc, ps) => acc + Number(ps.totalAmount), 0)
      const totalDia = totalServicos + totalProdutos

      return {
        dateStr: format(day, "dd/MM"),
        dayNum: format(day, "dd"),
        total: totalDia
      }
    })
  }, [bookings, productSales, monthStart, monthEnd])

  const maxDailyRevenue = Math.max(...chartDays.map((d) => d.total), 100)

  // Handler: Novo Lançamento Manual (Despesa / Receita)
  const handleCreateTransaction = async () => {
    try {
      if (!txDescription.trim()) {
        toast.error("Informe a descrição.")
        return
      }
      if (txAmount <= 0) {
        toast.error("Informe um valor válido.")
        return
      }

      setIsSubmittingTx(true)

      await createFinancialTransactionAction({
        barbershopId,
        type: txType,
        category: txCategory,
        description: txDescription.trim(),
        amount: txAmount,
        date: new Date()
      })

      toast.success(`${txType === "DESPESA" ? "Despesa" : "Receita"} lançada com sucesso!`)
      setIsNewTxOpen(false)
      setTxDescription("")
      setTxAmount(0)
    } catch (err: any) {
      toast.error(err.message || "Não foi possível registrar a transação. Tente novamente.")
    } finally {
      setIsSubmittingTx(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 🧭 Navegação Superior entre Sub-Abas: Dashboard | Histórico Assinatura */}
      <AdminPageHeader
        icon={DollarSign}
        title="Visão financeira"
        description={`Acompanhe entradas, saídas e o saldo ${barbershopName ? `da ${barbershopName}` : "da sua barbearia"} no período selecionado.`}
        actions={
          <>
            <div className="flex items-center rounded-lg bg-secondary p-1">
              <Button variant="ghost" size="icon-sm" aria-label="Ver mês anterior" onClick={() => setCurrentDate((date) => addMonths(date, -1))}><ChevronLeft className="size-3.5" /></Button>
              <span className="min-w-28 px-2 text-center text-xs font-bold capitalize text-foreground">{format(currentDate, "MMM yyyy", { locale: ptBR })}</span>
              <Button variant="ghost" size="icon-sm" aria-label="Ver próximo mês" onClick={() => setCurrentDate((date) => addMonths(date, 1))}><ChevronRight className="size-3.5" /></Button>
            </div>
            <div className="flex rounded-lg bg-secondary p-1">
              <Button variant={subTab === "dashboard" ? "default" : "ghost"} size="sm" onClick={() => setSubTab("dashboard")} className="gap-1.5 font-bold"><TrendingUp className="size-3.5" /> Financeiro</Button>
              <Button variant={subTab === "assinaturas" ? "default" : "ghost"} size="sm" onClick={() => setSubTab("assinaturas")} className="gap-1.5 font-bold"><QrCode className="size-3.5" /> Assinatura</Button>
            </div>
            <Button onClick={() => setIsNewTxOpen(true)} className="gap-1.5 font-bold"><PlusCircle className="size-3.5" /> Novo lançamento</Button>
          </>
        }
      />

      {subTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <FinancePeriodSummary
            currentDate={currentDate}
            saldoPeriodo={metrics.saldoPeriodo}
            totalRecebimentos={metrics.totalRecebimentos}
            previsaoTotalBruto={metrics.previsaoTotalBruto}
            comissoesPagas={metrics.comissoesPagas}
            totalSaidas={metrics.totalSaidas}
          />
          {/* 📊 SEÇÃO SUPERIOR: Gráfico "Total de receita bruta por dia" + Cards laterais (Idêntico à Imagem 2) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {/* Gráfico SVG no Topo Esquerdo */}
            <div className="flex flex-col justify-between rounded-xl bg-card p-5 shadow-[0_12px_30px_hsl(var(--foreground)/0.08)] lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    Total de receita bruta por dia
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Faturamento diário consolidado de cortes, serviços e produtos
                  </p>
                </div>
                <span className="text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-lg border border-success/20">
                  {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>

              {/* Área do Gráfico */}
              <div className="relative h-56 w-full pt-4">
                {/* Linhas de Grade de Fundo */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-dashed border-muted-foreground w-full" />
                  <div className="border-b border-dashed border-muted-foreground w-full" />
                  <div className="border-b border-dashed border-muted-foreground w-full" />
                  <div className="border-b border-dashed border-muted-foreground w-full" />
                </div>

                {/* SVG Line / Area com Neon Green Glow */}
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartDays.length * 20} 140`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="neonGreenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Curva Suave preenchida */}
                  {(() => {
                    const points = chartDays.map((d, idx) => {
                      const x = idx * 20 + 10
                      const y = 130 - (d.total / maxDailyRevenue) * 110
                      return { x, y }
                    })

                    if (points.length < 2) return null

                    let pathD = `M ${points[0].x} ${points[0].y}`
                    for (let i = 1; i < points.length; i++) {
                      const prev = points[i - 1]
                      const curr = points[i]
                      const midX = (prev.x + curr.x) / 2
                      pathD += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`
                    }

                    const areaD = `${pathD} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`

                    return (
                      <>
                        <path d={areaD} fill="url(#neonGreenGradient)" />
                        <path
                          d={pathD}
                          fill="none"
                          stroke="hsl(var(--success))"
                          strokeWidth="2.5"
                          className="drop-shadow-[0_4px_8px_hsl(var(--success)/0.3)]"
                        />
                        {points.map((p, idx) => (
                          <circle
                            key={idx}
                            cx={p.x}
                            cy={p.y}
                            r="3"
                            fill="hsl(var(--success))"
                            stroke="hsl(var(--background))"
                            strokeWidth="1.5"
                            className="transition-transform hover:scale-150 cursor-pointer"
                          >
                            <title>{`${chartDays[idx].dateStr}: R$ ${chartDays[idx].total.toFixed(2)}`}</title>
                          </circle>
                        ))}
                      </>
                    )
                  })()}
                </svg>
              </div>

              {/* Rótulos do Eixo X */}
              <div className="flex justify-between pt-2 text-[10px] font-semibold tabular-nums text-muted-foreground">
                <span>01/{format(currentDate, "MM")}</span>
                <span>08/{format(currentDate, "MM")}</span>
                <span>15/{format(currentDate, "MM")}</span>
                <span>22/{format(currentDate, "MM")}</span>
                <span>{chartDays.length}/{format(currentDate, "MM")}</span>
              </div>
            </div>

            {/* Coluna de Cards Laterais (Idêntica à Imagem 2) */}
            <div className="space-y-3.5 flex flex-col justify-between">
              {/* Card 1: Total bruto de vendas no período */}
              <div className="rounded-xl bg-card p-4 ring-1 ring-border">
                <span className="text-[11px] font-bold text-success uppercase tracking-wider block">
                  Total bruto de vendas no período
                </span>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
                  R$ {metrics.totalBrutoVendas.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Valor total bruto das comandas finalizadas no período selecionado
                </p>
              </div>

              {/* Card Duplo: Total comandas em aberto | Total clientes Atendidos | Por dia */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-card p-3 ring-1 ring-border">
                  <span className="text-[10px] font-semibold text-warning uppercase block">Em Aberto</span>
                  <strong className="text-sm font-bold text-foreground mt-1 block">
                    R$ {metrics.totalComandasAberto.toFixed(2).replace(".", ",")}
                  </strong>
                  <span className="text-[9px] text-muted-foreground">Comandas</span>
                </div>

                <div className="rounded-xl bg-card p-3 text-center ring-1 ring-border">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Atendidos</span>
                  <strong className="text-base font-extrabold text-foreground mt-1 block">
                    {metrics.totalClientesAtendidos}
                  </strong>
                  <span className="text-[9px] text-muted-foreground">Clientes</span>
                </div>

                <div className="rounded-xl bg-card p-3 text-right ring-1 ring-border">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Por dia</span>
                  <strong className="text-base font-extrabold text-success mt-1 block">
                    {metrics.mediaClientesPorDia}
                  </strong>
                  <span className="text-[9px] text-muted-foreground">Média clientes</span>
                </div>
              </div>

              {/* Card 3: Previsão do total bruto de vendas */}
              <div className="rounded-xl bg-card p-4 ring-1 ring-border">
                <span className="text-[11px] font-bold text-success uppercase tracking-wider block">
                  Previsão do total bruto de vendas no período
                </span>
                <p className="text-2xl font-extrabold text-success mt-1">
                  R$ {metrics.previsaoTotalBruto.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Previsão do valor total bruto de todas as comandas do período
                </p>
              </div>
            </div>
          </div>

          {/* 💵 SEÇÃO: "Saldo do período" (Idêntico à Imagem 2) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4 text-success" />
              Saldo do período
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card Grande Verde: Saldo do período */}
              <div className="flex flex-col justify-between rounded-xl bg-success/10 p-5 ring-1 ring-success/25">
                <span className="text-xs font-extrabold text-success uppercase tracking-wider">
                  Saldo do período
                </span>
                <p className="text-3xl font-black text-success my-2">
                  R$ {metrics.saldoPeriodo.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-success/80">
                  Total de recebimentos - Total de saídas
                </p>
              </div>

              {/* Card: Total de Recebimentos no período */}
              <div className="flex flex-col justify-between rounded-xl bg-card p-5 ring-1 ring-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-success" /> Total de Recebimentos no período
                </span>
                <p className="text-2xl font-bold text-success my-2">
                  R$ {metrics.totalRecebimentos.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  (taxas de pagamento já descontadas)
                </p>
              </div>

              {/* Card: Total de Saídas no período */}
              <div className="flex flex-col justify-between rounded-xl bg-card p-5 ring-1 ring-border">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-destructive" /> Total de Saídas no período
                </span>
                <p className="text-2xl font-bold text-destructive my-2">
                  R$ {metrics.totalSaidas.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Total de despesas e comissões no período
                </p>
              </div>
            </div>
          </div>

          {/* 📥 SEÇÃO: "Valores a receber no período selecionado" (Idêntico à Imagem 2) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-4 h-4 text-warning" />
              Valores a receber no período selecionado
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Card 1 */}
              <div className="flex flex-col justify-between rounded-xl bg-card p-4 ring-1 ring-border">
                <p className="text-lg font-bold text-success">
                  R$ {metrics.totalServicosFinalizados.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Vendas realizadas DENTRO do período e com data de recebimento dentro período selecionado
                </p>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col justify-between rounded-xl bg-card p-4 ring-1 ring-border">
                <p className="text-lg font-bold text-success">
                  R$ {metrics.totalVendasProdutos.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Vendas de produtos realizadas no período selecionado
                </p>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col justify-between rounded-xl bg-card p-4 ring-1 ring-border">
                <p className="text-lg font-bold text-foreground">
                  R$ {metrics.receitasManuais.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Lançamentos manuais de receita (entradas) lançadas no período selecionado
                </p>
              </div>

              {/* Card 4 */}
              <div className="flex flex-col justify-between rounded-xl bg-card p-4 ring-1 ring-border">
                <p className="text-lg font-bold text-foreground">
                  R$ {metrics.pacotesAssinaturas.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Venda de pacotes e planos de assinatura
                </p>
              </div>

              {/* Card 5 (Verde destacado) */}
              <div className="flex flex-col justify-between rounded-xl bg-success/10 p-4 ring-1 ring-success/25">
                <p className="text-xl font-extrabold text-success">
                  R$ {metrics.totalLiquidoReceber.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-[10px] text-success/90 font-medium mt-2 leading-relaxed">
                  Valor total líquido a receber no período selecionado (taxas de pagamento já descontadas)
                </p>
              </div>
            </div>
          </div>

          {/* 📤 SEÇÃO: "Despesas pagas no período selecionado" (Idêntico à Imagem 2) */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              Despesas pagas no período selecionado
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-card p-4 ring-1 ring-border">
                <p className="text-xl font-bold text-destructive">
                  R$ {metrics.comissoesPagas.toFixed(2).replace(".", ",")}
                </p>
                <span className="text-xs font-semibold text-muted-foreground block mt-1">Total de comissões pagas</span>
                <p className="text-[10px] text-muted-foreground">Valor total das comissões repassadas aos barbeiros no período</p>
              </div>

              <div className="rounded-xl bg-card p-4 ring-1 ring-border">
                <p className="text-xl font-bold text-destructive">
                  R$ {metrics.despesasManuais.toFixed(2).replace(".", ",")}
                </p>
                <span className="text-xs font-semibold text-muted-foreground block mt-1">Lançamentos manuais de despesas</span>
                <p className="text-[10px] text-muted-foreground">Valor total de despesas lançadas manualmente no período</p>
              </div>

              <div className="rounded-xl bg-destructive/10 p-4 ring-1 ring-destructive/25">
                <p className="text-xl font-bold text-destructive">
                  R$ {metrics.totalSaidas.toFixed(2).replace(".", ",")}
                </p>
                <span className="text-xs font-semibold text-destructive block mt-1">Total de despesas pagas</span>
                <p className="text-[10px] text-destructive/70">Valor total das despesas pagas no período selecionado</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💳 SUB-ABA: HISTÓRICO DE ASSINATURA SAAS (MENSALIDADE PIX MERCADO PAGO) */}
      {subTab === "assinaturas" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-foreground">Status do Plano SaaS</h3>
                  {subscriptionActive ? (
                    <span className="bg-success/20 text-success text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-success/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Assinatura Ativa
                    </span>
                  ) : trialEndsAt && new Date() < new Date(trialEndsAt) ? (
                    <span className="bg-info/20 text-info text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-info/30">
                      <Sparkles className="w-3.5 h-3.5" /> Período de Testes (Trial)
                    </span>
                  ) : (
                    <span className="bg-destructive/20 text-destructive text-xs font-bold px-2.5 py-1 rounded-full">
                      Pendente de Pagamento
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comprovantes e registros de renovação da mensalidade da barbearia processados via Pix Mercado Pago.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 p-2.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>Checkout Transparente Seguro</span>
              </div>
            </div>

            {/* Listagem de Comprovantes */}
            {subscriptionPayments.length > 0 ? (
              <div className="space-y-3">
                {subscriptionPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-secondary/15 border border-border/60 hover:border-success/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-success/10 text-success mt-0.5">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-foreground">Mensalidade SaaS</strong>
                          <span className="text-[10px] bg-success/20 text-success px-2 py-0.5 rounded-md font-bold">
                            {p.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(p.paidAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          ID Transação: #{p.mercadopagoPaymentId} • Método: {p.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Valor</span>
                      <strong className="text-lg font-extrabold text-success">
                        R$ {Number(p.amount).toFixed(2).replace(".", ",")}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-border rounded-xl">
                <QrCode className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-muted-foreground">Nenhum pagamento registrado ainda</p>
                <p className="text-xs text-muted-foreground">
                  Se você está no período de testes gratuitos, os comprovantes de mensalidade paga aparecerão aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ➕ MODAL DE LANÇAMENTO MANUAL (DESPESA OU RECEITA) */}
      <Dialog open={isNewTxOpen} onOpenChange={setIsNewTxOpen}>
        <DialogContent className="max-w-md bg-card border-border p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-success">
              <PlusCircle className="w-5 h-5" /> Novo Lançamento Financeiro
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre despesas operacionais ou receitas avulsas para manter o fluxo de caixa atualizado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTxType("DESPESA")}
                className={`py-2 px-3 rounded-lg font-bold transition-all text-center ${
                  txType === "DESPESA"
                    ? "bg-destructive text-destructive-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                Despesa (Saída)
              </button>
              <button
                type="button"
                onClick={() => setTxType("RECEITA")}
                className={`py-2 px-3 rounded-lg font-bold transition-all text-center ${
                  txType === "RECEITA"
                    ? "bg-success/60 text-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                Receita (Entrada)
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Categoria</label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full bg-secondary/40 text-foreground p-2 rounded-lg border border-border"
              >
                <option value="Lançamento Manual">Lançamento Manual</option>
                <option value="Aluguel & Contas">Aluguel & Contas</option>
                <option value="Produtos & Estoque">Produtos & Estoque</option>
                <option value="Manutenção & Equipamentos">Manutenção & Equipamentos</option>
                <option value="Marketing & Anúncios">Marketing & Anúncios</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Descrição</label>
              <Input
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="Ex: Compra de café, lâminas ou conta de luz"
                className="bg-secondary/40"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={txAmount || ""}
                onChange={(e) => setTxAmount(Number(e.target.value))}
                placeholder="0,00"
                className="bg-secondary/40 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="ghost" size="sm" onClick={() => setIsNewTxOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateTransaction}
              disabled={isSubmittingTx || !txDescription.trim() || txAmount <= 0}
              className="bg-success/60 hover:bg-success/70 text-foreground font-bold text-xs"
            >
              {isSubmittingTx ? "Salvando..." : "Registrar Lançamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
