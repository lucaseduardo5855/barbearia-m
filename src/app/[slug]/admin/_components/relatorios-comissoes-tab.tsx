"use client"

import { formatBRL } from "@/lib/formatters"
import { MoneyInput } from "@/components/ui/money-input"

import { useState, useMemo } from "react"
import Image from "next/image"
import {
  Booking,
  BarbershopService,
  Barber,
  User,
  ProductSale,
  FinancialTransaction,
} from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import {
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  UserCheck,
  PlusCircle,
  Search,
  PieChart as PieChartIcon,
  Award,
  Wallet,
  Coins,
} from "lucide-react"
import {
  payBarberCommissionsAction,
  createFinancialTransactionAction,
  updateBarberCommissionRateAction,
} from "@/app/_actions/admin-actions"
import { AdminPageHeader } from "./admin-page-header"
import { bookingAmounts } from "@/lib/financial-summary"

import type { BookingWithDetails } from "@/lib/booking-types"

interface RelatoriosComissoesTabProps {
  barbershop: {
    id: string
    name: string
    barbers: Barber[]
    services: BarbershopService[]
  }
  bookings: BookingWithDetails[]
  productSales?: ProductSale[]
  transactions?: FinancialTransaction[]
}

export default function RelatoriosComissoesTab({
  barbershop,
  bookings,
  productSales = [],
  transactions = [],
}: RelatoriosComissoesTabProps) {
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  )
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  )
  const [searchTerm, setSearchTerm] = useState("")

  // Modais
  const [isPayCommissionOpen, setIsPayCommissionOpen] = useState(false)
  const [selectedBarberToPay, setSelectedBarberToPay] = useState<string>("")
  const [payAmount, setPayAmount] = useState<number>(0)
  const [isSubmittingPay, setIsSubmittingPay] = useState(false)

  const [isAddBonusOpen, setIsAddBonusOpen] = useState(false)
  const [bonusBarberId, setBonusBarberId] = useState<string>("")
  const [bonusType, setBonusType] = useState<"COMISSAO_PAGA" | "VALE">("VALE")
  const [bonusAmount, setBonusAmount] = useState<number>(0)
  const [bonusDesc, setBonusDesc] = useState("")
  const [isSubmittingBonus, setIsSubmittingBonus] = useState(false)

  // Filtra dados no período
  const periodData = useMemo(() => {
    const sDate = new Date(`${startDate}T00:00:00`)
    const eDate = new Date(`${endDate}T23:59:59`)

    const filteredBookings = bookings.filter((b) => {
      const bDate = new Date(b.date)
      return bDate >= sDate && bDate <= eDate
    })

    const filteredSales = productSales.filter((ps) => {
      const psDate = new Date(ps.date)
      return psDate >= sDate && psDate <= eDate
    })

    const filteredTxs = transactions.filter((t) => {
      const tDate = new Date(t.date)
      return tDate >= sDate && tDate <= eDate
    })

    return { filteredBookings, filteredSales, filteredTxs }
  }, [bookings, productSales, transactions, startDate, endDate])

  // Processamento por Colaborador
  const barbersData = useMemo(() => {
    const { filteredBookings, filteredSales, filteredTxs } = periodData

    return barbershop.barbers.map((barber) => {
      const rate = barber.commissionRate ? Number(barber.commissionRate) : 50

      // Agendamentos deste barbeiro
      const barberBookings = filteredBookings.filter(
        (b) => b.barberId === barber.id,
      )
      const finishedBookings = barberBookings.filter((b) => b.status === "DONE")

      // Vendas de serviços (total e comissão)
      const vendasServicos = finishedBookings.reduce(
        (acc, b) => acc + bookingAmounts(b).services,
        0,
      )
      const comissaoServicos = finishedBookings.reduce((acc, b) => {
        const amounts = bookingAmounts(b)
        const commission = Number(
          b.barberCommissionAmount ?? (amounts.total * rate) / 100,
        )
        return (
          acc +
          (amounts.total > 0
            ? (commission * amounts.services) / amounts.total
            : 0)
        )
      }, 0)

      // Vendas de produtos deste barbeiro
      const barberSales = filteredSales.filter(
        (ps) => ps.barberId === barber.id && !ps.bookingId,
      )
      const vendasProdutos =
        finishedBookings.reduce(
          (sum, b) => sum + bookingAmounts(b).products,
          0,
        ) + barberSales.reduce((acc, ps) => acc + Number(ps.totalAmount), 0)
      const comissaoProdutos =
        finishedBookings.reduce((sum, b) => {
          const amounts = bookingAmounts(b)
          const commission = Number(
            b.barberCommissionAmount ?? (amounts.total * rate) / 100,
          )
          return (
            sum +
            (amounts.total > 0
              ? (commission * amounts.products) / amounts.total
              : 0)
          )
        }, 0) +
        barberSales.reduce((acc, ps) => acc + Number(ps.commissionAmount), 0)

      // Total de Vendas
      const vendasTotal = vendasServicos + vendasProdutos

      // Comissões pagas e Vales deste barbeiro
      const comissoesPagas = filteredTxs
        .filter((t) => t.barberId === barber.id && t.type === "COMISSAO_PAGA")
        .reduce((acc, t) => acc + Number(t.amount), 0)

      const vales = filteredTxs
        .filter((t) => t.barberId === barber.id && t.type === "VALE")
        .reduce((acc, t) => acc + Number(t.amount), 0)

      // Comissão Total Bruta
      const comissaoTotalBruta = comissaoServicos + comissaoProdutos

      // Comissão Líquida Pendente a Pagar
      const comissaoPendente = Math.max(
        0,
        comissaoTotalBruta - comissoesPagas - vales,
      )

      return {
        barber,
        agendamentosCount: barberBookings.length,
        finalizadosCount: finishedBookings.length,
        vendasTotal,
        vendasServicos,
        vendasProdutos,
        comissaoServicos,
        comissaoProdutos,
        comissaoAssinatura: 0,
        totalExtras: 0,
        comprasProdutosVales: vales,
        comissoesPagas,
        comissaoTotalBruta,
        comissaoPendente,
        rate,
      }
    })
  }, [barbershop.barbers, periodData])

  // Métricas Consolidadas (Cards do Topo - Idêntico à Imagem 4)
  const consolidatedMetrics = useMemo(() => {
    const vendasTotal = barbersData.reduce((acc, b) => acc + b.vendasTotal, 0)
    const vendasServicos = barbersData.reduce(
      (acc, b) => acc + b.vendasServicos,
      0,
    )
    const vendasProdutos = barbersData.reduce(
      (acc, b) => acc + b.vendasProdutos,
      0,
    )
    const comissoesNormais = barbersData.reduce(
      (acc, b) => acc + b.comissaoServicos,
      0,
    )
    const comissoesTotal = barbersData.reduce(
      (acc, b) => acc + b.comissaoTotalBruta,
      0,
    )
    const comissoesPagas = barbersData.reduce(
      (acc, b) => acc + b.comissoesPagas,
      0,
    )
    const comissoesPendentes = barbersData.reduce(
      (acc, b) => acc + b.comissaoPendente,
      0,
    )
    const valesPagos = barbersData.reduce(
      (acc, b) => acc + b.comprasProdutosVales,
      0,
    )

    const totalBookingsCount = periodData.filteredBookings.length
    const finishedBookingsCount = periodData.filteredBookings.filter(
      (b) => b.status === "DONE",
    ).length

    return {
      vendasTotal,
      vendasServicos,
      vendasProdutos,
      comissoesNormais,
      comissoesTotal,
      comissoesPagas,
      comissoesPendentes,
      valesPagos,
      totalBookingsCount,
      finishedBookingsCount,
      comissoesAssinaturas: 0,
    }
  }, [barbersData, periodData])

  // Cores do gráfico Donut
  const DONUT_COLORS = [
    "hsl(var(--info))",
    "hsl(var(--success))",
    "hsl(var(--primary))",
    "hsl(var(--warning))",
    "hsl(var(--primary) / 0.75)",
    "hsl(var(--info) / 0.75)",
    "hsl(var(--destructive) / 0.85)",
  ]

  // Exportar Excel/CSV
  const handleExportExcel = () => {
    let csv =
      "Colaborador,Taxa Comissão,Agendamentos,Vendas Serviços,Vendas Produtos,Vendas Total,Comissão Serviços,Comissão Produtos,Comissão Bruta,Vales/Descontos,Comissão Paga,Comissão Pendente\n"
    barbersData.forEach((b) => {
      csv += `"${b.barber.name}","${b.rate}%",${b.agendamentosCount},"R$ ${b.vendasServicos.toFixed(2)}","R$ ${b.vendasProdutos.toFixed(2)}","R$ ${b.vendasTotal.toFixed(2)}","R$ ${b.comissaoServicos.toFixed(2)}","R$ ${b.comissaoProdutos.toFixed(2)}","R$ ${b.comissaoTotalBruta.toFixed(2)}","R$ ${b.comprasProdutosVales.toFixed(2)}","R$ ${b.comissoesPagas.toFixed(2)}","R$ ${b.comissaoPendente.toFixed(2)}"\n`
    })

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `relatorio_colaboradores_comissoes_${startDate}_a_${endDate}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Relatório de comissões exportado com sucesso!")
  }

  // Handler: Dar Baixa nas Comissões
  const handlePayCommission = async () => {
    try {
      if (!selectedBarberToPay) {
        toast.error("Selecione um colaborador.")
        return
      }
      if (payAmount <= 0) {
        toast.error("Informe um valor válido.")
        return
      }

      setIsSubmittingPay(true)
      await payBarberCommissionsAction({
        barbershopId: barbershop.id,
        barberId: selectedBarberToPay,
        amount: payAmount,
        description: `Baixa de comissão paga em ${format(new Date(), "dd/MM/yyyy")}`,
      })

      toast.success("Baixa na comissão realizada com sucesso!")
      setIsPayCommissionOpen(false)
      setPayAmount(0)
    } catch (err: any) {
      toast.error(
        err.message ||
          "Não foi possível registrar a baixa da comissão. Tente novamente.",
      )
    } finally {
      setIsSubmittingPay(false)
    }
  }

  // Handler: Adicionar Lançamento / Vale / Bônus para o Barbeiro
  const handleAddBonus = async () => {
    try {
      if (!bonusBarberId) {
        toast.error("Selecione o barbeiro.")
        return
      }
      if (bonusAmount <= 0) {
        toast.error("Informe um valor válido.")
        return
      }

      setIsSubmittingBonus(true)
      await createFinancialTransactionAction({
        barbershopId: barbershop.id,
        barberId: bonusBarberId,
        type: bonusType,
        category: "Comissões",
        description:
          bonusDesc.trim() ||
          (bonusType === "VALE" ? "Adiantamento / Vale" : "Comissão Extra"),
        amount: bonusAmount,
        date: new Date(),
      })

      toast.success("Lançamento adicionado ao colaborador!")
      setIsAddBonusOpen(false)
      setBonusAmount(0)
      setBonusDesc("")
    } catch (err: any) {
      toast.error(
        err.message ||
          "Não foi possível adicionar o lançamento. Tente novamente.",
      )
    } finally {
      setIsSubmittingBonus(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Coins}
        title="Relatório de colaboradores"
        description="Acompanhe o faturamento por barbeiro, comissões normais, vales e repasses pendentes."
        actions={
          <>
            <Button
              onClick={() => {
                if (barbershop.barbers.length > 0) {
                  setSelectedBarberToPay(barbershop.barbers[0].id)
                  const bData = barbersData.find(
                    (b) => b.barber.id === barbershop.barbers[0].id,
                  )
                  setPayAmount(bData?.comissaoPendente || 0)
                }
                setIsPayCommissionOpen(true)
              }}
              className="h-9 gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4 stroke-[1.75]" />
              Dar baixa nas comissões
            </Button>

            <Button
              onClick={handleExportExcel}
              className="h-9 gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <FileSpreadsheet className="h-4 w-4 stroke-[1.75]" />
              Exportar CSV
            </Button>
          </>
        }
      />

      {/* 📊 GRID DE 10 CARDS DE MÉTRICAS + GRÁFICO DONUT (Idêntico à Imagem 4) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Bloco de 10 Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 lg:col-span-2">
          {/* Linha 1 */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-medium text-foreground">
              {formatBRL(consolidatedMetrics.vendasTotal)}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">
              Vendas Total
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-medium text-foreground">
              {formatBRL(consolidatedMetrics.vendasServicos)}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">
              Total Vendas serviços
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-medium text-foreground">
              {formatBRL(consolidatedMetrics.comissoesAssinaturas)}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">
              Comissões Assinaturas
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-medium text-foreground">
              {formatBRL(consolidatedMetrics.comissoesPagas)}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">
              Comissões Pagas
            </span>
          </div>

          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-lg font-medium text-destructive">
              {formatBRL(consolidatedMetrics.comissoesPendentes)}
            </p>
            <span className="mt-1 block text-xs font-semibold text-destructive">
              Comissões Pendentes
            </span>
          </div>

          {/* Linha 2 */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-medium text-foreground">
              {consolidatedMetrics.totalBookingsCount}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">
              Vendas Total (Qtd)
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-medium text-foreground">
              {consolidatedMetrics.finishedBookingsCount}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">
              Vendas Finalizados
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-medium text-foreground">
              {formatBRL(consolidatedMetrics.vendasProdutos)}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">
              Total Vendas produto
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-medium text-foreground">
              {formatBRL(consolidatedMetrics.comissoesNormais)}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">
              Comissões Normais
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-medium text-warning">
              {formatBRL(consolidatedMetrics.comissoesTotal)}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">
              Comissões Total
            </span>
          </div>
        </div>

        {/* Gráfico Donut: Detalhamento de Comissões */}
        <div className="flex flex-col items-center justify-between rounded-xl border border-border bg-card p-5 text-center">
          <div className="mb-2 w-full text-left">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <PieChartIcon className="h-4 w-4 text-warning" /> Detalhamento de
              comissões
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Distribuição entre profissionais
            </p>
          </div>

          <div className="relative my-2 h-44 w-44">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              {(() => {
                let accumulatedPercent = 0
                return barbersData.map((b, idx) => {
                  const percent =
                    consolidatedMetrics.comissoesTotal > 0
                      ? (b.comissaoTotalBruta /
                          consolidatedMetrics.comissoesTotal) *
                        100
                      : 0
                  const strokeDasharray = `${percent} ${100 - percent}`
                  const strokeDashoffset = -accumulatedPercent
                  accumulatedPercent += percent

                  return (
                    <circle
                      key={b.barber.id}
                      cx="50"
                      cy="50"
                      r="38"
                      pathLength="100"
                      fill="transparent"
                      stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
                      strokeWidth="24"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all hover:opacity-80"
                    />
                  )
                })
              })()}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-extrabold text-warning">
                Comissões
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2 text-[10px] text-muted-foreground">
            {barbersData.map((b, idx) => (
              <span key={b.barber.id} className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length],
                  }}
                />
                {b.barber.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 🧭 FILTROS: Início, Fim, Pesquisar, Botão "Adicionar lançamento para o barbeiro" (Idêntico à Imagem 4) */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Início</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-36 bg-secondary/40 text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Fim</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-36 bg-secondary/40 text-xs font-semibold"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar barbeiro..."
              className="h-8 w-44 bg-secondary/40 pl-8 text-xs"
            />
          </div>
        </div>

        {/* Botão Amarelo: Adicionar lançamento para o barbeiro */}
        <Button
          onClick={() => {
            if (barbershop.barbers.length > 0) {
              setBonusBarberId(barbershop.barbers[0].id)
            }
            setIsAddBonusOpen(true)
          }}
          className="h-8 gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Coins className="h-3.5 w-3.5 stroke-[1.75]" />
          Adicionar lançamento para o barbeiro
        </Button>
      </div>

      {/* 📋 TABELA POR COLABORADOR (Idêntica à Imagem 4) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/80 bg-secondary/40 text-[10px] font-bold uppercase text-muted-foreground">
              <tr>
                <th className="p-3.5">Colaborador</th>
                <th className="p-3.5">Total em Vendas</th>
                <th className="p-3.5">Comissão Serviços</th>
                <th className="p-3.5">Comissão Produtos</th>
                <th className="p-3.5">Comissão Assinatura</th>
                <th className="p-3.5">Total em Extras</th>
                <th className="p-3.5">Compras / Vales</th>
                <th className="p-3.5 text-right">Comissão Pendente</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {barbersData
                .filter((b) =>
                  b.barber.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
                )
                .map((item) => (
                  <tr
                    key={item.barber.id}
                    className="transition-colors hover:bg-secondary/20"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-warning/40 bg-warning/10">
                          {item.barber.imageUrl ? (
                            <Image
                              src={item.barber.imageUrl}
                              alt={item.barber.name}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          ) : (
                            <UserCheck className="h-4 w-4 text-warning" />
                          )}
                        </div>
                        <div>
                          <strong className="block font-bold text-foreground">
                            {item.barber.name}
                          </strong>
                          <span className="text-[10px] text-muted-foreground">
                            {item.agendamentosCount} agendamentos • {item.rate}%
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-bold text-foreground">
                      {formatBRL(item.vendasTotal)}
                    </td>

                    <td className="p-3.5 font-bold text-foreground">
                      {formatBRL(item.comissaoServicos)}
                    </td>

                    <td className="p-3.5 font-bold text-foreground">
                      {formatBRL(item.comissaoProdutos)}
                    </td>

                    <td className="p-3.5 text-muted-foreground">
                      {formatBRL(item.comissaoAssinatura)}
                    </td>

                    <td className="p-3.5 text-muted-foreground">
                      {formatBRL(item.totalExtras)}
                    </td>

                    <td className="p-3.5 font-semibold text-destructive">
                      -{formatBRL(item.comprasProdutosVales)}
                    </td>

                    <td className="p-3.5 text-right text-sm font-extrabold text-foreground">
                      {formatBRL(item.comissaoPendente)}
                    </td>

                    <td className="p-3.5 text-center">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedBarberToPay(item.barber.id)
                          setPayAmount(item.comissaoPendente)
                          setIsPayCommissionOpen(true)
                        }}
                        className="h-11 rounded-md bg-primary px-3 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 md:h-7"
                      >
                        Pagar
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💳 MODAL: DAR BAIXA NAS COMISSÕES */}
      <Dialog open={isPayCommissionOpen} onOpenChange={setIsPayCommissionOpen}>
        <DialogContent className="max-w-md border-border bg-card p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <CheckCircle2 className="h-5 w-5" /> Registrar Pagamento de
              Comissão
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Dê baixa no saldo de comissão pendente do colaborador selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Colaborador
              </label>
              <select
                value={selectedBarberToPay}
                onChange={(e) => {
                  setSelectedBarberToPay(e.target.value)
                  const b = barbersData.find(
                    (item) => item.barber.id === e.target.value,
                  )
                  if (b) setPayAmount(b.comissaoPendente)
                }}
                className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-foreground"
              >
                {barbershop.barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Valor a Pagar (R$)
              </label>
              <MoneyInput
                value={payAmount}
                onValueChange={setPayAmount}
                className="bg-secondary/40 text-base font-bold text-foreground"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPayCommissionOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handlePayCommission}
              disabled={isSubmittingPay || payAmount <= 0}
              className="bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              {isSubmittingPay ? "Processando..." : "Confirmar Baixa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ➕ MODAL: ADICIONAR LANÇAMENTO / VALE / BÔNUS */}
      <Dialog open={isAddBonusOpen} onOpenChange={setIsAddBonusOpen}>
        <DialogContent className="max-w-md border-border bg-card p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-warning">
              <Coins className="h-5 w-5" /> Adicionar Lançamento para o Barbeiro
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre um adiantamento (vale) ou bonificação/comissão extra.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Colaborador
              </label>
              <select
                value={bonusBarberId}
                onChange={(e) => setBonusBarberId(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-foreground"
              >
                {barbershop.barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBonusType("VALE")}
                className={`rounded-lg px-3 py-2 text-center font-bold transition-all ${
                  bonusType === "VALE"
                    ? "bg-destructive text-destructive-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                Vale / Adiantamento (-)
              </button>
              <button
                type="button"
                onClick={() => setBonusType("COMISSAO_PAGA")}
                className={`rounded-lg px-3 py-2 text-center font-bold transition-all ${
                  bonusType === "COMISSAO_PAGA"
                    ? "bg-warning text-warning-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                Bônus / Extra (+)
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Valor (R$)
              </label>
              <MoneyInput
                value={bonusAmount}
                onValueChange={setBonusAmount}
                placeholder="0,00"
                className="bg-secondary/40 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Descrição / Motivo
              </label>
              <Input
                value={bonusDesc}
                onChange={(e) => setBonusDesc(e.target.value)}
                placeholder="Ex: Adiantamento semanal, meta batida, etc."
                className="bg-secondary/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddBonusOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAddBonus}
              disabled={isSubmittingBonus || bonusAmount <= 0}
              className="bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              {isSubmittingBonus ? "Salvando..." : "Confirmar Lançamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
